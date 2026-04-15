
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// ── Ollama Configuration ─────────────────────────────────────────
const OLLAMA_API = process.env.OLLAMA_API || 'http://localhost:11434';
// const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';  // Change this to any model you have
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'phi3:mini';
// ── Session store ─────────────────────────────────────────────────
const sessions = new Map();

function getSession(id) {
  if (!sessions.has(id)) {
    sessions.set(id, {
      id,
      messages: [],
      subject: 'auto',
      doubtsResolved: 0,
      createdAt: Date.now(),
      lastActive: Date.now()
    });
  }
  const s = sessions.get(id);
  s.lastActive = Date.now();
  return s;
}

// Clean sessions older than 1 hour
setInterval(() => {
  const cutoff = Date.now() - 3600_000;
  for (const [id, s] of sessions) {
    if (s.lastActive < cutoff) sessions.delete(id);
  }
}, 15 * 60_000);

// ── System prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are DoubtSolver AI — a brilliant, patient tutor helping students from Class 6 to university level solve academic doubts instantly.

Your job:
1. Identify the subject and topic automatically from the doubt.
2. Give a clear, well-structured answer with:
   - A direct answer to the question first
   - Step-by-step explanation when needed (especially for math/science problems)
   - A simple real-world analogy or example
   - A quick "Key Takeaway" at the end (1-2 sentences)
3. If it's a math/physics problem, show full working step-by-step.
4. If it's a concept question, explain it like talking to a smart 16-year-old.
5. If the student seems confused, offer to explain it a different way.

Formatting rules:
- Use **bold** for key terms, formulas, and important points
- Use numbered lists for steps
- Use bullet points for concepts
- Wrap math expressions in backticks like \`E = mc²\`
- Keep answers focused — don't pad with unnecessary information

Tone: Encouraging, clear, never condescending. Make the student feel smart, not stupid.

Always end with a brief "💡 Tip:" that gives the student a trick or insight to remember this concept easily.`;

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use('/api', rateLimit({ windowMs: 60_000, max: 40, message: { error: 'Slow down! Max 40 requests per minute.' } }));

// ── Helper: Call Ollama ──────────────────────────────────────────
async function callOllama(prompt, systemPrompt, conversationHistory = []) {
  // Build messages array for Ollama
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: prompt }
  ];

  try {
    const response = await fetch(`${OLLAMA_API}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: 0.7,
          max_tokens: 1500,
          top_p: 0.9
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  } catch (error) {
    console.error('Ollama error:', error.message);
    throw new Error('Failed to get response from local AI. Make sure Ollama is running.');
  }
}

// ── Routes ────────────────────────────────────────────────────────

// Session init
app.post('/api/session', (req, res) => {
  const id = req.body.sessionId || uuidv4();
  const s = getSession(id);
  res.json({ sessionId: s.id, doubtsResolved: s.doubtsResolved });
});

// Ask a doubt — main endpoint
app.post('/api/ask', async (req, res) => {
  const { sessionId, doubt, subject } = req.body;
  if (!doubt?.trim()) return res.status(400).json({ error: 'Doubt is required.' });

  const session = getSession(sessionId || uuidv4());
  if (subject && subject !== 'auto') session.subject = subject;

  // Build user message — prepend subject context if set
  const userContent = session.subject !== 'auto'
    ? `[Subject: ${session.subject}]\n${doubt.trim()}`
    : doubt.trim();

  session.messages.push({ role: 'user', content: userContent });

  // Keep last 30 messages (15 exchanges) - Ollama works better with fewer
  const historyForOllama = session.messages.slice(-20);

  try {
    // Call Ollama
    const answer = await callOllama(
      userContent,
      SYSTEM_PROMPT,
      historyForOllama.slice(0, -1) // Don't include the last user message twice
    );

    session.messages.push({ role: 'assistant', content: answer });
    session.doubtsResolved++;

    // Auto-detect subject from doubt
    const detectedSubject = detectSubject(doubt);

    res.json({
      sessionId: session.id,
      answer,
      detectedSubject,
      doubtsResolved: session.doubtsResolved
    });
  } catch (err) {
    console.error('API error:', err.message);
    session.messages.pop(); // revert on error
    res.status(500).json({ error: err.message || 'AI service unavailable. Make sure Ollama is running.' });
  }
});

// Follow-up / clarification
app.post('/api/followup', async (req, res) => {
  const { sessionId, message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message required.' });

  // Reuse /ask logic
  req.body.doubt = message;
  return app._router.handle({ ...req, url: '/api/ask', path: '/api/ask' }, res, () => {});
});

// Get history
app.get('/api/session/:id/history', (req, res) => {
  const s = sessions.get(req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  res.json({ messages: s.messages, doubtsResolved: s.doubtsResolved });
});

// Clear history
app.delete('/api/session/:id', (req, res) => {
  if (sessions.has(req.params.id)) {
    const s = sessions.get(req.params.id);
    s.messages = [];
    s.doubtsResolved = 0;
  }
  res.json({ success: true });
});

// Health check - also checks Ollama
app.get('/api/health', async (req, res) => {
  let ollamaStatus = 'unknown';
  try {
    const ollamaHealth = await fetch(`${OLLAMA_API}/api/tags`);
    ollamaStatus = ollamaHealth.ok ? 'connected' : 'unavailable';
  } catch {
    ollamaStatus = 'not running';
  }
  
  res.json({ 
    ok: true, 
    sessions: sessions.size, 
    uptime: Math.floor(process.uptime()) + 's',
    ollama: ollamaStatus,
    model: OLLAMA_MODEL
  });
});

// ── Subject detection ─────────────────────────────────────────────
function detectSubject(text) {
  const t = text.toLowerCase();
  if (/\b(equation|algebra|calculus|integral|derivative|matrix|trigon|sin|cos|tan|log|polynomial|fraction|geometry|theorem|proof|arithmetic|statistics|probability)\b/.test(t)) return 'Mathematics';
  if (/\b(force|velocity|acceleration|energy|momentum|wave|electric|magnetic|quantum|thermodynamic|optics|gravity|newton|einstein|circuit|resistor|capacitor)\b/.test(t)) return 'Physics';
  if (/\b(reaction|element|compound|molecule|atom|bond|acid|base|oxidation|reduction|organic|inorganic|electron|proton|neutron|periodic|mole|solution|titration)\b/.test(t)) return 'Chemistry';
  if (/\b(cell|dna|rna|gene|protein|evolution|ecosystem|photosynthesis|respiration|mitosis|meiosis|bacteria|virus|organ|tissue|nervous|immune)\b/.test(t)) return 'Biology';
  if (/\b(history|war|revolution|empire|dynasty|civilization|ancient|medieval|colonial|independence|treaty|constitution|democracy|parliament)\b/.test(t)) return 'History';
  if (/\b(grammar|syntax|metaphor|literature|poem|novel|author|tense|verb|noun|adjective|essay|writing|comprehension)\b/.test(t)) return 'English';
  if (/\b(code|function|algorithm|loop|array|class|object|database|sql|api|html|css|javascript|python|java|variable|recursion)\b/.test(t)) return 'Computer Science';
  if (/\b(economy|supply|demand|market|inflation|gdp|trade|fiscal|monetary|capital|socialism|capitalism)\b/.test(t)) return 'Economics';
  return 'General';
}

app.listen(PORT, () => {
  console.log(`\n✅ DoubtSolver Backend (Ollama) → http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   Using Ollama at: ${OLLAMA_API}`);
  console.log(`   Model: ${OLLAMA_MODEL}`);
  console.log(`\n   Make sure Ollama is running with: ollama serve`);
  console.log(`   And pull a model: ollama pull ${OLLAMA_MODEL}\n`);
});


























