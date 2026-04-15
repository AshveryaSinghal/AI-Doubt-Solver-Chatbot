// // ── Config ────────────────────────────────────────────────────────
// const API = 'http://localhost:3001/api';
// const MAX_CHARS = 1000;

// // ── State ─────────────────────────────────────────────────────────
// let sessionId = localStorage.getItem('ds_session') || null;
// let activeSubject = 'auto';
// let isAsking = false;
// let doubtsCount = 0;

// // ── DOM ───────────────────────────────────────────────────────────
// const messagesEl   = document.getElementById('chat-messages');
// const inputEl      = document.getElementById('doubt-input');
// const askBtn       = document.getElementById('ask-btn');
// const charCount    = document.getElementById('char-count');
// const statCount    = document.getElementById('stat-count');
// const statSubject  = document.getElementById('stat-subject');
// const statusPill   = document.getElementById('status-pill');
// const topbarSubj   = document.getElementById('topbar-subject');
// const activeBadge  = document.getElementById('active-subject-badge');
// const sidebar      = document.getElementById('sidebar');
// const overlay      = document.getElementById('sidebar-overlay');
// const menuToggle   = document.getElementById('menu-toggle');

// // ── Init ──────────────────────────────────────────────────────────
// async function init() {
//   try {
//     const res = await fetch(`${API}/session`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId })
//     });
//     const data = await res.json();
//     sessionId = data.sessionId;
//     localStorage.setItem('ds_session', sessionId);
//     doubtsCount = data.doubtsResolved || 0;
//     updateStats();
//     setStatus('live');
//   } catch {
//     setStatus('offline');
//   }
// }

// // ── Status ────────────────────────────────────────────────────────
// function setStatus(state) {
//   if (state === 'live') {
//     statusPill.textContent = '● Live';
//     statusPill.className = 'topbar-pill';
//   } else if (state === 'thinking') {
//     statusPill.textContent = '⟳ Thinking…';
//     statusPill.className = 'topbar-pill thinking';
//   } else {
//     statusPill.textContent = '○ Offline';
//     statusPill.className = 'topbar-pill';
//     statusPill.style.background = 'var(--red-bg)';
//     statusPill.style.color = 'var(--red)';
//   }
// }

// // ── Subject switching ─────────────────────────────────────────────
// document.querySelectorAll('.subj-btn').forEach(btn => {
//   btn.addEventListener('click', () => {
//     activeSubject = btn.dataset.subject;
//     document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
//     btn.classList.add('active');

//     const label = activeSubject === 'auto' ? '⚡ Auto' : btn.querySelector('span:last-child').textContent;
//     activeBadge.textContent = label;
//     topbarSubj.textContent = activeSubject === 'auto' ? 'Ask Your Doubt' : label;
//     statSubject.textContent = activeSubject === 'auto' ? '—' : label.split(' ').slice(-1)[0];

//     closeSidebar();
//     inputEl.focus();
//   });
// });

// // ── Ask a doubt ───────────────────────────────────────────────────
// async function askDoubt() {
//   const text = inputEl.value.trim();
//   if (!text || isAsking) return;
//   if (text.length > MAX_CHARS) return;

//   // Hide welcome
//   document.getElementById('welcome-block')?.remove();

//   isAsking = true;
//   askBtn.disabled = true;
//   inputEl.value = '';
//   inputEl.style.height = 'auto';
//   updateCharCount();
//   setStatus('thinking');

//   // Render user message
//   appendUserMsg(text);
//   const typingId = appendTyping();
//   scrollBottom();

//   try {
//     const res = await fetch(`${API}/ask`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId, doubt: text, subject: activeSubject })
//     });

//     const data = await res.json();
//     removeTyping(typingId);

//     if (!res.ok) throw new Error(data.error || 'Request failed');

//     sessionId = data.sessionId;
//     localStorage.setItem('ds_session', sessionId);
//     doubtsCount = data.doubtsResolved;
//     updateStats(data.detectedSubject);
//     appendBotMsg(data.answer, data.detectedSubject);
//     setStatus('live');

//   } catch (err) {
//     removeTyping(typingId);
//     appendError(err.message || 'Something went wrong. Please check the backend is running.');
//     setStatus('offline');
//     setTimeout(() => setStatus('live'), 4000);
//   }

//   isAsking = false;
//   askBtn.disabled = false;
//   inputEl.focus();
//   scrollBottom();
// }

// // ── Render helpers ────────────────────────────────────────────────
// function appendUserMsg(text) {
//   const row = document.createElement('div');
//   row.className = 'msg-row user';
//   row.innerHTML = `
//     <div class="msg-meta" style="justify-content:flex-end">
//       <span class="avatar-label" style="color:var(--accent)">You</span>
//     </div>
//     <div class="msg-bubble">${escHtml(text)}</div>
//   `;
//   messagesEl.appendChild(row);
// }

// function appendBotMsg(rawText, subject) {
//   const subjectTag = subject && subject !== 'General'
//     ? `<span class="subject-tag">${escHtml(subject)}</span>` : '';

//   const row = document.createElement('div');
//   row.className = 'msg-row bot';
//   row.innerHTML = `
//     <div class="msg-meta">
//       <span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span>
//       ${subjectTag}
//     </div>
//     <div class="msg-bubble">
//       <div class="answer-body">${formatAnswer(rawText)}</div>
//     </div>
//   `;
//   messagesEl.appendChild(row);
// }

// function appendError(msg) {
//   const row = document.createElement('div');
//   row.className = 'msg-row bot';
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--red)">Error</span></div>
//     <div class="msg-bubble" style="border-color:var(--red);background:var(--red-bg);">
//       <span style="color:var(--red)">⚠ ${escHtml(msg)}</span>
//     </div>
//   `;
//   messagesEl.appendChild(row);
// }

// function appendTyping() {
//   const id = 'typing-' + Date.now();
//   const row = document.createElement('div');
//   row.className = 'msg-row bot typing-row';
//   row.id = id;
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span></div>
//     <div class="msg-bubble">
//       <div class="typing-dots"><span></span><span></span><span></span></div>
//     </div>
//   `;
//   messagesEl.appendChild(row);
//   return id;
// }

// function removeTyping(id) {
//   document.getElementById(id)?.remove();
// }

// // ── Format answer (markdown-lite + tip box) ───────────────────────
// function formatAnswer(raw) {
//   // Extract 💡 Tip line and render separately
//   const tipMatch = raw.match(/(💡\s*Tip:?.*?)(\n|$)/i);
//   let mainText = raw;
//   let tipHtml = '';

//   if (tipMatch) {
//     mainText = raw.replace(tipMatch[0], '').trim();
//     tipHtml = `<div class="tip-box">${escHtml(tipMatch[1].trim())}</div>`;
//   }

//   // Escape HTML on main text
//   let html = escHtml(mainText);

//   // Code blocks
//   html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
//     `<pre><code>${code.trim()}</code></pre>`
//   );

//   // Inline code
//   html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

//   // Bold
//   html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
//   html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

//   // Italic
//   html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

//   // Numbered list
//   html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li>$2</li>');
//   html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => `<ol>${match}</ol>`);

//   // Bullet list
//   html = html.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
//   html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => {
//     if (match.startsWith('<ol>')) return match;
//     return `<ul>${match}</ul>`;
//   });

//   // Paragraphs from double newlines
//   const blocks = html.split(/\n{2,}/);
//   html = blocks.map(block => {
//     block = block.trim();
//     if (!block) return '';
//     if (block.startsWith('<ol>') || block.startsWith('<ul>') || block.startsWith('<pre>')) return block;
//     return `<p>${block.replace(/\n/g, '<br>')}</p>`;
//   }).filter(Boolean).join('\n');

//   return html + tipHtml;
// }

// // ── Stats ─────────────────────────────────────────────────────────
// function updateStats(detectedSubject) {
//   statCount.textContent = doubtsCount;
//   if (detectedSubject && detectedSubject !== 'General' && activeSubject === 'auto') {
//     statSubject.textContent = detectedSubject.split(' ')[0];
//   }
// }

// // ── Char counter ──────────────────────────────────────────────────
// function updateCharCount() {
//   const len = inputEl.value.length;
//   charCount.textContent = `${len} / ${MAX_CHARS}`;
//   charCount.classList.toggle('over', len > MAX_CHARS);
// }

// // ── Sample doubts ─────────────────────────────────────────────────
// document.querySelectorAll('.sample-btn').forEach(btn => {
//   btn.addEventListener('click', () => {
//     inputEl.value = btn.dataset.q;
//     updateCharCount();
//     autoResize();
//     askDoubt();
//   });
// });

// // ── Clear session ─────────────────────────────────────────────────
// document.getElementById('clear-btn').addEventListener('click', async () => {
//   if (!confirm('Clear this chat session?')) return;
//   messagesEl.innerHTML = '';
//   doubtsCount = 0;
//   updateStats();
//   renderWelcome();
//   try {
//     await fetch(`${API}/session/${sessionId}`, { method: 'DELETE' });
//   } catch { /* ignore */ }
// });

// document.getElementById('new-chat-btn').addEventListener('click', async () => {
//   messagesEl.innerHTML = '';
//   sessionId = null;
//   localStorage.removeItem('ds_session');
//   doubtsCount = 0;
//   updateStats();
//   renderWelcome();
//   await init();
//   closeSidebar();
// });

// function renderWelcome() {
//   const div = document.createElement('div');
//   div.className = 'welcome-block';
//   div.id = 'welcome-block';
//   div.innerHTML = `
//     <div class="welcome-glyph">?</div>
//     <h1 class="welcome-title">What's your doubt?</h1>
//     <p class="welcome-sub">Ask any academic question — Maths, Science, History, Coding and more.<br>Get a clear, step-by-step explanation instantly.</p>
//     <div class="sample-doubts">
//       <button class="sample-btn" data-q="Explain Newton's third law of motion with an example">⚛ Newton's Third Law</button>
//       <button class="sample-btn" data-q="How do I solve quadratic equations? Show me step by step">∑ Quadratic Equations</button>
//       <button class="sample-btn" data-q="What caused World War 1? Explain briefly">📜 Causes of WW1</button>
//       <button class="sample-btn" data-q="What is photosynthesis and how does it work?">🧬 Photosynthesis</button>
//       <button class="sample-btn" data-q="Explain the difference between stack and queue in data structures">{ } Stack vs Queue</button>
//       <button class="sample-btn" data-q="What is the difference between acids and bases in chemistry?">⚗ Acids vs Bases</button>
//     </div>
//   `;
//   messagesEl.appendChild(div);

//   div.querySelectorAll('.sample-btn').forEach(btn => {
//     btn.addEventListener('click', () => {
//       inputEl.value = btn.dataset.q;
//       updateCharCount();
//       autoResize();
//       askDoubt();
//     });
//   });
// }

// // ── Sidebar mobile ────────────────────────────────────────────────
// menuToggle.addEventListener('click', () => {
//   sidebar.classList.toggle('open');
//   overlay.classList.toggle('visible');
// });

// overlay.addEventListener('click', closeSidebar);

// function closeSidebar() {
//   sidebar.classList.remove('open');
//   overlay.classList.remove('visible');
// }

// // ── Input handlers ────────────────────────────────────────────────
// inputEl.addEventListener('input', () => {
//   autoResize();
//   updateCharCount();
// });

// inputEl.addEventListener('keydown', e => {
//   if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault();
//     askDoubt();
//   }
// });

// askBtn.addEventListener('click', askDoubt);

// function autoResize() {
//   inputEl.style.height = 'auto';
//   inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
// }

// // ── Scroll ────────────────────────────────────────────────────────
// function scrollBottom() {
//   requestAnimationFrame(() => {
//     document.getElementById('chat-window').scrollTop = 999999;
//   });
// }

// // ── Escape HTML ───────────────────────────────────────────────────
// function escHtml(str) {
//   return String(str)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;');
// }

// // ── Boot ──────────────────────────────────────────────────────────
// init();
















































































// ── Config ────────────────────────────────────────────────────────
const API = 'http://localhost:3001/api';
const MAX_CHARS = 1000;

// ── State ─────────────────────────────────────────────────────────
let sessionId = localStorage.getItem('ds_session') || null;
let activeSubject = 'auto';
let isAsking = false;
let doubtsCount = 0;

// NEW: Store conversations per subject
let subjectConversations = {
  'auto': { messages: [], doubtsResolved: 0 }
};

// Load saved conversations from localStorage
function loadSubjectConversations() {
  const saved = localStorage.getItem('ds_subject_conversations');
  if (saved) {
    try {
      subjectConversations = JSON.parse(saved);
    } catch(e) { console.error('Failed to load conversations'); }
  }
}

// Save conversations to localStorage
function saveSubjectConversations() {
  localStorage.setItem('ds_subject_conversations', JSON.stringify(subjectConversations));
}

// ── DOM ───────────────────────────────────────────────────────────
const messagesEl   = document.getElementById('chat-messages');
const inputEl      = document.getElementById('doubt-input');
const askBtn       = document.getElementById('ask-btn');
const charCount    = document.getElementById('char-count');
const statCount    = document.getElementById('stat-count');
const statSubject  = document.getElementById('stat-subject');
const statusPill   = document.getElementById('status-pill');
const topbarSubj   = document.getElementById('topbar-subject');
const activeBadge  = document.getElementById('active-subject-badge');
const sidebar      = document.getElementById('sidebar');
const overlay      = document.getElementById('sidebar-overlay');
const menuToggle   = document.getElementById('menu-toggle');

// ── Init ──────────────────────────────────────────────────────────
async function init() {
  loadSubjectConversations();
  
  try {
    const res = await fetch(`${API}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId })
    });
    const data = await res.json();
    sessionId = data.sessionId;
    localStorage.setItem('ds_session', sessionId);
    
    // Load saved stats for current subject
    updateStatsFromSubject();
    setStatus('live');
  } catch {
    setStatus('offline');
  }
}

// ── Subject switching with conversation persistence ───────────────
document.querySelectorAll('.subj-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Save current conversation before switching
    saveCurrentConversation();
    
    // Switch subject
    activeSubject = btn.dataset.subject;
    document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Update UI
    const label = activeSubject === 'auto' ? '⚡ Auto' : btn.querySelector('span:last-child').textContent;
    activeBadge.textContent = label;
    topbarSubj.textContent = activeSubject === 'auto' ? 'Ask Your Doubt' : label;
    
    // Load the conversation for the new subject
    loadSubjectConversation();
    
    closeSidebar();
    inputEl.focus();
  });
});

// Save current conversation to subjectConversations object
function saveCurrentConversation() {
  if (!subjectConversations[activeSubject]) {
    subjectConversations[activeSubject] = { messages: [], doubtsResolved: 0 };
  }
  
  // Save current messages from DOM
  const currentMessages = [];
  const messageElements = messagesEl.querySelectorAll('.msg-row:not(.welcome-block)');
  
  messageElements.forEach(el => {
    const isUser = el.classList.contains('user');
    const bubble = el.querySelector('.msg-bubble');
    const text = bubble ? bubble.innerText : '';
    
    if (text) {
      currentMessages.push({
        role: isUser ? 'user' : 'assistant',
        content: text,
        html: el.innerHTML // Save the HTML to preserve formatting
      });
    }
  });
  
  subjectConversations[activeSubject].messages = currentMessages;
  subjectConversations[activeSubject].doubtsResolved = doubtsCount;
  saveSubjectConversations();
}

// Load conversation for the selected subject
function loadSubjectConversation() {
  // Clear current messages
  messagesEl.innerHTML = '';
  
  const conv = subjectConversations[activeSubject];
  
  if (conv && conv.messages.length > 0) {
    // Restore saved messages
    conv.messages.forEach(msg => {
      const row = document.createElement('div');
      row.className = `msg-row ${msg.role}`;
      if (msg.html) {
        row.innerHTML = msg.html;
      } else {
        // Fallback rendering
        row.innerHTML = `
          <div class="msg-meta ${msg.role === 'user' ? 'style="justify-content:flex-end"' : ''}">
            <span class="avatar-label" style="color:${msg.role === 'user' ? 'var(--accent)' : 'var(--text-muted)'}">
              ${msg.role === 'user' ? 'You' : 'DoubtSolver AI'}
            </span>
          </div>
          <div class="msg-bubble">${escHtml(msg.content)}</div>
        `;
      }
      messagesEl.appendChild(row);
    });
    
    doubtsCount = conv.doubtsResolved;
  } else {
    // Show welcome screen for new subject
    renderWelcome();
    doubtsCount = 0;
  }
  
  updateStats();
  scrollBottom();
}

// ── Status ────────────────────────────────────────────────────────
function setStatus(state) {
  if (state === 'live') {
    statusPill.textContent = '● Live';
    statusPill.className = 'topbar-pill';
  } else if (state === 'thinking') {
    statusPill.textContent = '⟳ Thinking…';
    statusPill.className = 'topbar-pill thinking';
  } else {
    statusPill.textContent = '○ Offline';
    statusPill.className = 'topbar-pill';
    statusPill.style.background = 'var(--red-bg)';
    statusPill.style.color = 'var(--red)';
  }
}

// ── Ask a doubt ───────────────────────────────────────────────────
async function askDoubt() {
  const text = inputEl.value.trim();
  if (!text || isAsking) return;
  if (text.length > MAX_CHARS) return;

  // Hide welcome if present
  const welcomeBlock = document.getElementById('welcome-block');
  if (welcomeBlock) welcomeBlock.remove();

  isAsking = true;
  askBtn.disabled = true;
  inputEl.value = '';
  inputEl.style.height = 'auto';
  updateCharCount();
  setStatus('thinking');

  // Render user message
  appendUserMsg(text);
  const typingId = appendTyping();
  scrollBottom();

  try {
    const res = await fetch(`${API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, doubt: text, subject: activeSubject })
    });

    const data = await res.json();
    removeTyping(typingId);

    if (!res.ok) throw new Error(data.error || 'Request failed');

    sessionId = data.sessionId;
    localStorage.setItem('ds_session', sessionId);
    doubtsCount = data.doubtsResolved;
    updateStats(data.detectedSubject);
    appendBotMsg(data.answer, data.detectedSubject);
    setStatus('live');
    
    // Auto-save after each message
    saveCurrentConversation();

  } catch (err) {
    removeTyping(typingId);
    appendError(err.message || 'Something went wrong. Please check the backend is running.');
    setStatus('offline');
    setTimeout(() => setStatus('live'), 4000);
  }

  isAsking = false;
  askBtn.disabled = false;
  inputEl.focus();
  scrollBottom();
}






// ── Render helpers ────────────────────────────────────────────────
function appendUserMsg(text) {
  const row = document.createElement('div');
  row.className = 'msg-row user';
  row.innerHTML = `
    <div class="msg-meta" style="justify-content:flex-end">
      <span class="avatar-label" style="color:var(--accent)">You</span>
    </div>
    <div class="msg-bubble">${escHtml(text)}</div>
  `;
  messagesEl.appendChild(row);
}

function appendBotMsg(rawText, subject) {
  const subjectTag = subject && subject !== 'General'
    ? `<span class="subject-tag">${escHtml(subject)}</span>` : '';

  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.innerHTML = `
    <div class="msg-meta">
      <span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span>
      ${subjectTag}
    </div>
    <div class="msg-bubble">
      <div class="answer-body">${formatAnswer(rawText)}</div>
    </div>
  `;
  messagesEl.appendChild(row);
}

function appendError(msg) {
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  row.innerHTML = `
    <div class="msg-meta"><span class="avatar-label" style="color:var(--red)">Error</span></div>
    <div class="msg-bubble" style="border-color:var(--red);background:var(--red-bg);">
      <span style="color:var(--red)">⚠ ${escHtml(msg)}</span>
    </div>
  `;
  messagesEl.appendChild(row);
}

function appendTyping() {
  const id = 'typing-' + Date.now();
  const row = document.createElement('div');
  row.className = 'msg-row bot typing-row';
  row.id = id;
  row.innerHTML = `
    <div class="msg-meta"><span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span></div>
    <div class="msg-bubble">
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
  `;
  messagesEl.appendChild(row);
  return id;
}

function removeTyping(id) {
  document.getElementById(id)?.remove();
}

// ── Format answer (markdown-lite + tip box) ───────────────────────
function formatAnswer(raw) {
  // Extract 💡 Tip line and render separately
  const tipMatch = raw.match(/(💡\s*Tip:?.*?)(\n|$)/i);
  let mainText = raw;
  let tipHtml = '';

  if (tipMatch) {
    mainText = raw.replace(tipMatch[0], '').trim();
    tipHtml = `<div class="tip-box">${escHtml(tipMatch[1].trim())}</div>`;
  }

  // Escape HTML on main text
  let html = escHtml(mainText);

  // Code blocks
  html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
    `<pre><code>${code.trim()}</code></pre>`
  );

  // Inline code
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  // Bold
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');

  // Italic
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

  // Numbered list
  html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li>$2</li>');
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => `<ol>${match}</ol>`);

  // Bullet list
  html = html.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => {
    if (match.startsWith('<ol>')) return match;
    return `<ul>${match}</ul>`;
  });

  // Paragraphs from double newlines
  const blocks = html.split(/\n{2,}/);
  html = blocks.map(block => {
    block = block.trim();
    if (!block) return '';
    if (block.startsWith('<ol>') || block.startsWith('<ul>') || block.startsWith('<pre>')) return block;
    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
  }).filter(Boolean).join('\n');

  return html + tipHtml;
}

// ── Stats ─────────────────────────────────────────────────────────
function updateStats(detectedSubject) {
  statCount.textContent = doubtsCount;
  if (detectedSubject && detectedSubject !== 'General' && activeSubject === 'auto') {
    statSubject.textContent = detectedSubject.split(' ')[0];
  }
}

function updateStatsFromSubject() {
  const conv = subjectConversations[activeSubject];
  if (conv) {
    doubtsCount = conv.doubtsResolved;
  } else {
    doubtsCount = 0;
  }
  statCount.textContent = doubtsCount;
  statSubject.textContent = activeSubject === 'auto' ? '—' : activeSubject.split(' ')[0];
}

// ── Char counter ──────────────────────────────────────────────────
function updateCharCount() {
  const len = inputEl.value.length;
  charCount.textContent = `${len} / ${MAX_CHARS}`;
  charCount.classList.toggle('over', len > MAX_CHARS);
}

// ── Sample doubts ─────────────────────────────────────────────────
document.querySelectorAll('.sample-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    inputEl.value = btn.dataset.q;
    updateCharCount();
    autoResize();
    askDoubt();
  });
});

// ── Clear current subject chat ───────────────────────────────────
document.getElementById('clear-btn').addEventListener('click', async () => {
  if (!confirm(`Clear ${activeSubject} chat history?`)) return;
  
  // Clear current subject's conversation
  subjectConversations[activeSubject] = { messages: [], doubtsResolved: 0 };
  saveSubjectConversations();
  
  // Reload the conversation (shows welcome screen)
  loadSubjectConversation();
  
  // Also try to clear server-side session
  try {
    await fetch(`${API}/session/${sessionId}`, { method: 'DELETE' });
  } catch { /* ignore */ }
});

// ── New session (clear all subjects) ─────────────────────────────
document.getElementById('new-chat-btn').addEventListener('click', async () => {
  if (!confirm('Clear ALL chat history for ALL subjects?')) return;
  
  // Clear all conversations
  subjectConversations = {
    'auto': { messages: [], doubtsResolved: 0 }
  };
  saveSubjectConversations();
  
  messagesEl.innerHTML = '';
  sessionId = null;
  localStorage.removeItem('ds_session');
  doubtsCount = 0;
  updateStats();
  renderWelcome();
  await init();
  closeSidebar();
});

function renderWelcome() {
  const div = document.createElement('div');
  div.className = 'welcome-block';
  div.id = 'welcome-block';
  div.innerHTML = `
    <div class="welcome-glyph">?</div>
    <h1 class="welcome-title">What's your doubt?</h1>
    <p class="welcome-sub">Ask any academic question — Maths, Science, History, Coding and more.<br>Get a clear, step-by-step explanation instantly.</p>
    <div class="sample-doubts">
      <button class="sample-btn" data-q="Explain Newton's third law of motion with an example">⚛ Newton's Third Law</button>
      <button class="sample-btn" data-q="How do I solve quadratic equations? Show me step by step">∑ Quadratic Equations</button>
      <button class="sample-btn" data-q="What caused World War 1? Explain briefly">📜 Causes of WW1</button>
      <button class="sample-btn" data-q="What is photosynthesis and how does it work?">🧬 Photosynthesis</button>
      <button class="sample-btn" data-q="Explain the difference between stack and queue in data structures">{ } Stack vs Queue</button>
      <button class="sample-btn" data-q="What is the difference between acids and bases in chemistry?">⚗ Acids vs Bases</button>
    </div>
  `;
  messagesEl.appendChild(div);

  div.querySelectorAll('.sample-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      inputEl.value = btn.dataset.q;
      updateCharCount();
      autoResize();
      askDoubt();
    });
  });
}

// ── Sidebar mobile ────────────────────────────────────────────────
menuToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('visible');
});

overlay.addEventListener('click', closeSidebar);

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('visible');
}

// ── Input handlers ────────────────────────────────────────────────
inputEl.addEventListener('input', () => {
  autoResize();
  updateCharCount();
});

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    askDoubt();
  }
});

askBtn.addEventListener('click', askDoubt);

function autoResize() {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
}

// ── Scroll ────────────────────────────────────────────────────────
function scrollBottom() {
  requestAnimationFrame(() => {
    document.getElementById('chat-window').scrollTop = 999999;
  });
}

// ── Escape HTML ───────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ──────────────────────────────────────────────────────────
init();



















































// // ── Config ────────────────────────────────────────────────────────
// const API = 'http://localhost:3001/api';
// const MAX_CHARS = 1000;

// // ── State ─────────────────────────────────────────────────────────
// let sessionId = localStorage.getItem('ds_session') || null;
// let activeSubject = 'auto';
// let doubtsCount = 0;

// // Store conversations per subject with loading states
// let subjectConversations = {
//   'auto': { messages: [], doubtsResolved: 0, isLoading: false, pendingQuestion: null }
// };

// // Track active requests per subject
// let activeRequests = new Map();

// // Track uploaded files
// let uploadedFiles = [];

// // Load saved conversations from localStorage
// function loadSubjectConversations() {
//   const saved = localStorage.getItem('ds_subject_conversations');
//   if (saved) {
//     try {
//       const parsed = JSON.parse(saved);
//       Object.keys(parsed).forEach(subj => {
//         subjectConversations[subj] = {
//           ...parsed[subj],
//           isLoading: false,
//           pendingQuestion: null
//         };
//       });
//     } catch(e) { console.error('Failed to load conversations'); }
//   }
  
//   // Load uploaded files
//   const savedFiles = localStorage.getItem('ds_uploaded_files');
//   if (savedFiles) {
//     try {
//       uploadedFiles = JSON.parse(savedFiles);
//       updateFilesPopup();
//     } catch(e) { console.error('Failed to load files'); }
//   }
// }

// // Save conversations to localStorage
// function saveSubjectConversations() {
//   const toSave = {};
//   Object.keys(subjectConversations).forEach(subj => {
//     toSave[subj] = {
//       messages: subjectConversations[subj].messages,
//       doubtsResolved: subjectConversations[subj].doubtsResolved
//     };
//   });
//   localStorage.setItem('ds_subject_conversations', JSON.stringify(toSave));
// }

// // Save uploaded files to localStorage
// function saveUploadedFiles() {
//   localStorage.setItem('ds_uploaded_files', JSON.stringify(uploadedFiles));
// }

// // ── DOM ───────────────────────────────────────────────────────────
// const messagesEl   = document.getElementById('chat-messages');
// const inputEl      = document.getElementById('doubt-input');
// const askBtn       = document.getElementById('ask-btn');
// const charCount    = document.getElementById('char-count');
// const statCount    = document.getElementById('stat-count');
// const statSubject  = document.getElementById('stat-subject');
// const statusPill   = document.getElementById('status-pill');
// const topbarSubj   = document.getElementById('topbar-subject');
// const activeBadge  = document.getElementById('active-subject-badge');
// const sidebar      = document.getElementById('sidebar');
// const overlay      = document.getElementById('sidebar-overlay');
// const menuToggle   = document.getElementById('menu-toggle');

// // Attachment elements
// const attachBtn = document.getElementById('attach-btn');
// const hiddenFileInput = document.getElementById('hidden-file-input');
// const filesPopup = document.getElementById('uploaded-files-popup');
// const closePopup = document.getElementById('close-popup');
// const fileSelectPopup = document.getElementById('file-select-popup');
// const fileQuestionPopup = document.getElementById('file-question-popup');
// const askFilePopupBtn = document.getElementById('ask-file-popup-btn');

// // ── Init ──────────────────────────────────────────────────────────
// async function init() {
//   loadSubjectConversations();
  
//   try {
//     const res = await fetch(`${API}/session`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId })
//     });
//     const data = await res.json();
//     sessionId = data.sessionId;
//     localStorage.setItem('ds_session', sessionId);
    
//     updateStatsFromSubject();
//     setStatus('live');
//   } catch {
//     setStatus('offline');
//   }
// }

// // ── Subject switching with conversation persistence ───────────────
// document.querySelectorAll('.subj-btn').forEach(btn => {
//   btn.addEventListener('click', () => {
//     saveCurrentConversation();
    
//     activeSubject = btn.dataset.subject;
//     document.querySelectorAll('.subj-btn').forEach(b => b.classList.remove('active'));
//     btn.classList.add('active');
    
//     const label = activeSubject === 'auto' ? '⚡ Auto' : btn.querySelector('span:last-child').textContent;
//     activeBadge.textContent = label;
//     topbarSubj.textContent = activeSubject === 'auto' ? 'Ask Your Doubt' : label;
    
//     loadSubjectConversation();
//     updateGlobalStatus();
    
//     closeSidebar();
//     inputEl.focus();
//   });
// });

// function saveCurrentConversation() {
//   if (!subjectConversations[activeSubject]) {
//     subjectConversations[activeSubject] = { 
//       messages: [], 
//       doubtsResolved: 0, 
//       isLoading: false, 
//       pendingQuestion: null 
//     };
//   }
  
//   if (!subjectConversations[activeSubject].isLoading) {
//     const currentMessages = [];
//     const messageElements = messagesEl.querySelectorAll('.msg-row:not(.welcome-block)');
    
//     messageElements.forEach(el => {
//       const isUser = el.classList.contains('user');
//       const bubble = el.querySelector('.msg-bubble');
//       const text = bubble ? bubble.innerText : '';
      
//       if (text) {
//         currentMessages.push({
//           role: isUser ? 'user' : 'assistant',
//           content: text,
//           html: el.innerHTML
//         });
//       }
//     });
    
//     subjectConversations[activeSubject].messages = currentMessages;
//     subjectConversations[activeSubject].doubtsResolved = doubtsCount;
//     saveSubjectConversations();
//   }
// }

// function loadSubjectConversation() {
//   messagesEl.innerHTML = '';
  
//   const conv = subjectConversations[activeSubject];
  
//   if (conv && conv.messages.length > 0) {
//     conv.messages.forEach(msg => {
//       const row = document.createElement('div');
//       row.className = `msg-row ${msg.role}`;
//       if (msg.html) {
//         row.innerHTML = msg.html;
//       } else {
//         row.innerHTML = `
//           <div class="msg-meta ${msg.role === 'user' ? 'style="justify-content:flex-end"' : ''}">
//             <span class="avatar-label" style="color:${msg.role === 'user' ? 'var(--accent)' : 'var(--text-muted)'}">
//               ${msg.role === 'user' ? 'You' : 'DoubtSolver AI'}
//             </span>
//           </div>
//           <div class="msg-bubble">${escHtml(msg.content)}</div>
//         `;
//       }
//       messagesEl.appendChild(row);
//     });
    
//     doubtsCount = conv.doubtsResolved;
//   } else {
//     renderWelcome();
//     doubtsCount = 0;
//   }
  
//   if (conv && conv.isLoading && conv.pendingQuestion) {
//     showTypingIndicatorForLoading();
//   }
  
//   updateStats();
//   scrollBottom();
// }

// function showTypingIndicatorForLoading() {
//   if (messagesEl.querySelector('.typing-row')) return;
  
//   const typingId = 'typing-' + Date.now();
//   const row = document.createElement('div');
//   row.className = 'msg-row bot typing-row';
//   row.id = typingId;
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span></div>
//     <div class="msg-bubble">
//       <div class="typing-dots"><span></span><span></span><span></span></div>
//     </div>
//   `;
//   messagesEl.appendChild(row);
//   scrollBottom();
// }

// function removeTypingIndicator() {
//   const typingRow = messagesEl.querySelector('.typing-row');
//   if (typingRow) typingRow.remove();
// }

// function updateGlobalStatus() {
//   const anyLoading = Object.values(subjectConversations).some(conv => conv.isLoading);
//   if (anyLoading) {
//     setStatus('thinking');
//   } else {
//     setStatus('live');
//   }
// }

// // ── Status ────────────────────────────────────────────────────────
// function setStatus(state) {
//   if (state === 'live') {
//     statusPill.textContent = '● Live';
//     statusPill.className = 'topbar-pill';
//   } else if (state === 'thinking') {
//     statusPill.textContent = '⟳ Thinking…';
//     statusPill.className = 'topbar-pill thinking';
//   } else {
//     statusPill.textContent = '○ Offline';
//     statusPill.className = 'topbar-pill';
//     statusPill.style.background = 'var(--red-bg)';
//     statusPill.style.color = 'var(--red)';
//   }
// }

// // ── Ask a doubt with parallel support ────────────────────────────
// async function askDoubt() {
//   const text = inputEl.value.trim();
//   if (!text) return;
//   if (text.length > MAX_CHARS) return;

//   if (!subjectConversations[activeSubject]) {
//     subjectConversations[activeSubject] = { 
//       messages: [], 
//       doubtsResolved: 0, 
//       isLoading: false, 
//       pendingQuestion: null 
//     };
//   }

//   if (subjectConversations[activeSubject].isLoading) {
//     subjectConversations[activeSubject].pendingQuestion = text;
//     appendInfoMessage('Your question is queued. Waiting for current response to finish...');
//     inputEl.value = '';
//     updateCharCount();
//     return;
//   }

//   const welcomeBlock = document.getElementById('welcome-block');
//   if (welcomeBlock) welcomeBlock.remove();

//   subjectConversations[activeSubject].isLoading = true;
//   updateGlobalStatus();

//   saveCurrentConversation();

//   inputEl.value = '';
//   inputEl.style.height = 'auto';
//   updateCharCount();

//   appendUserMsg(text);
//   const typingId = appendTyping();
//   scrollBottom();

//   const abortController = new AbortController();
//   activeRequests.set(activeSubject, abortController);

//   try {
//     const res = await fetch(`${API}/ask`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId, doubt: text, subject: activeSubject }),
//       signal: abortController.signal
//     });

//     const data = await res.json();
//     removeTyping(typingId);

//     if (!res.ok) throw new Error(data.error || 'Request failed');

//     sessionId = data.sessionId;
//     localStorage.setItem('ds_session', sessionId);
    
//     subjectConversations[activeSubject].doubtsResolved = data.doubtsResolved;
//     doubtsCount = data.doubtsResolved;
    
//     appendBotMsg(data.answer, data.detectedSubject);
    
//     updateStats(data.detectedSubject);

//   } catch (err) {
//     removeTyping(typingId);
//     if (err.name !== 'AbortError') {
//       appendError(err.message || 'Something went wrong.');
//     }
//   } finally {
//     subjectConversations[activeSubject].isLoading = false;
//     activeRequests.delete(activeSubject);
//     updateGlobalStatus();
//     saveCurrentConversation();
    
//     if (subjectConversations[activeSubject].pendingQuestion) {
//       const pending = subjectConversations[activeSubject].pendingQuestion;
//       subjectConversations[activeSubject].pendingQuestion = null;
//       inputEl.value = pending;
//       updateCharCount();
//       askDoubt();
//     }
//   }

//   inputEl.focus();
//   scrollBottom();
// }

// function appendInfoMessage(msg) {
//   const row = document.createElement('div');
//   row.className = 'msg-row bot';
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--blue)">Info</span></div>
//     <div class="msg-bubble" style="border-color:var(--blue);background:var(--blue-bg);">
//       <span style="color:var(--blue)">ℹ ${escHtml(msg)}</span>
//     </div>
//   `;
//   messagesEl.appendChild(row);
//   scrollBottom();
// }

// // ── Render helpers ────────────────────────────────────────────────
// function appendUserMsg(text) {
//   const row = document.createElement('div');
//   row.className = 'msg-row user';
//   row.innerHTML = `
//     <div class="msg-meta" style="justify-content:flex-end">
//       <span class="avatar-label" style="color:var(--accent)">You</span>
//     </div>
//     <div class="msg-bubble">${escHtml(text)}</div>
//   `;
//   messagesEl.appendChild(row);
// }

// function appendBotMsg(rawText, subject) {
//   const subjectTag = subject && subject !== 'General'
//     ? `<span class="subject-tag">${escHtml(subject)}</span>` : '';

//   const row = document.createElement('div');
//   row.className = 'msg-row bot';
//   row.innerHTML = `
//     <div class="msg-meta">
//       <span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span>
//       ${subjectTag}
//     </div>
//     <div class="msg-bubble">
//       <div class="answer-body">${formatAnswer(rawText)}</div>
//     </div>
//   `;
//   messagesEl.appendChild(row);
  
//   if (subjectConversations[activeSubject]) {
//     subjectConversations[activeSubject].messages.push({
//       role: 'assistant',
//       content: rawText,
//       html: row.innerHTML
//     });
//     saveSubjectConversations();
//   }
// }

// function appendError(msg) {
//   const row = document.createElement('div');
//   row.className = 'msg-row bot';
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--red)">Error</span></div>
//     <div class="msg-bubble" style="border-color:var(--red);background:var(--red-bg);">
//       <span style="color:var(--red)">⚠ ${escHtml(msg)}</span>
//     </div>
//   `;
//   messagesEl.appendChild(row);
// }

// function appendTyping() {
//   const id = 'typing-' + Date.now();
//   const row = document.createElement('div');
//   row.className = 'msg-row bot typing-row';
//   row.id = id;
//   row.innerHTML = `
//     <div class="msg-meta"><span class="avatar-label" style="color:var(--text-muted)">DoubtSolver AI</span></div>
//     <div class="msg-bubble">
//       <div class="typing-dots"><span></span><span></span><span></span></div>
//     </div>
//   `;
//   messagesEl.appendChild(row);
//   return id;
// }

// function removeTyping(id) {
//   document.getElementById(id)?.remove();
// }

// // ── Format answer (markdown-lite + tip box) ───────────────────────
// function formatAnswer(raw) {
//   const tipMatch = raw.match(/(💡\s*Tip:?.*?)(\n|$)/i);
//   let mainText = raw;
//   let tipHtml = '';

//   if (tipMatch) {
//     mainText = raw.replace(tipMatch[0], '').trim();
//     tipHtml = `<div class="tip-box">${escHtml(tipMatch[1].trim())}</div>`;
//   }

//   let html = escHtml(mainText);
//   html = html.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
//     `<pre><code>${code.trim()}</code></pre>`
//   );
//   html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
//   html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
//   html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>');
//   html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
//   html = html.replace(/^(\d+)\.\s(.+)$/gm, '<li>$2</li>');
//   html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => `<ol>${match}</ol>`);
//   html = html.replace(/^[-•]\s(.+)$/gm, '<li>$1</li>');
//   html = html.replace(/(<li>.*<\/li>(\n|$))+/g, match => {
//     if (match.startsWith('<ol>')) return match;
//     return `<ul>${match}</ul>`;
//   });

//   const blocks = html.split(/\n{2,}/);
//   html = blocks.map(block => {
//     block = block.trim();
//     if (!block) return '';
//     if (block.startsWith('<ol>') || block.startsWith('<ul>') || block.startsWith('<pre>')) return block;
//     return `<p>${block.replace(/\n/g, '<br>')}</p>`;
//   }).filter(Boolean).join('\n');

//   return html + tipHtml;
// }

// // ── Stats ─────────────────────────────────────────────────────────
// function updateStats(detectedSubject) {
//   statCount.textContent = doubtsCount;
//   if (detectedSubject && detectedSubject !== 'General' && activeSubject === 'auto') {
//     statSubject.textContent = detectedSubject.split(' ')[0];
//   }
// }

// function updateStatsFromSubject() {
//   const conv = subjectConversations[activeSubject];
//   if (conv) {
//     doubtsCount = conv.doubtsResolved;
//   } else {
//     doubtsCount = 0;
//   }
//   statCount.textContent = doubtsCount;
//   statSubject.textContent = activeSubject === 'auto' ? '—' : activeSubject.split(' ')[0];
// }

// // ── Char counter ──────────────────────────────────────────────────
// function updateCharCount() {
//   const len = inputEl.value.length;
//   charCount.textContent = `${len} / ${MAX_CHARS}`;
//   charCount.classList.toggle('over', len > MAX_CHARS);
// }

// // ── Sample doubts ─────────────────────────────────────────────────
// document.querySelectorAll('.sample-btn').forEach(btn => {
//   btn.addEventListener('click', () => {
//     inputEl.value = btn.dataset.q;
//     updateCharCount();
//     autoResize();
//     askDoubt();
//   });
// });

// // ── Clear current subject chat ───────────────────────────────────
// document.getElementById('clear-btn').addEventListener('click', async () => {
//   if (!confirm(`Clear ${activeSubject} chat history?`)) return;
  
//   if (activeRequests.has(activeSubject)) {
//     activeRequests.get(activeSubject).abort();
//     activeRequests.delete(activeSubject);
//   }
  
//   subjectConversations[activeSubject] = { 
//     messages: [], 
//     doubtsResolved: 0, 
//     isLoading: false, 
//     pendingQuestion: null 
//   };
//   saveSubjectConversations();
//   loadSubjectConversation();
  
//   try {
//     await fetch(`${API}/session/${sessionId}`, { method: 'DELETE' });
//   } catch { /* ignore */ }
// });

// // ── New session (clear all subjects) ─────────────────────────────
// document.getElementById('new-chat-btn').addEventListener('click', async () => {
//   if (!confirm('Clear ALL chat history for ALL subjects?')) return;
  
//   for (const [subject, controller] of activeRequests) {
//     controller.abort();
//   }
//   activeRequests.clear();
  
//   subjectConversations = {
//     'auto': { messages: [], doubtsResolved: 0, isLoading: false, pendingQuestion: null }
//   };
//   saveSubjectConversations();
  
//   messagesEl.innerHTML = '';
//   sessionId = null;
//   localStorage.removeItem('ds_session');
//   doubtsCount = 0;
//   updateStats();
//   renderWelcome();
//   await init();
//   closeSidebar();
// });

// function renderWelcome() {
//   const div = document.createElement('div');
//   div.className = 'welcome-block';
//   div.id = 'welcome-block';
//   div.innerHTML = `
//     <div class="welcome-glyph">?</div>
//     <h1 class="welcome-title">What's your doubt?</h1>
//     <p class="welcome-sub">Ask any academic question — Maths, Science, History, Coding and more.<br>Get a clear, step-by-step explanation instantly.</p>
//     <div class="sample-doubts">
//       <button class="sample-btn" data-q="Explain Newton's third law of motion with an example">⚛ Newton's Third Law</button>
//       <button class="sample-btn" data-q="How do I solve quadratic equations? Show me step by step">∑ Quadratic Equations</button>
//       <button class="sample-btn" data-q="What caused World War 1? Explain briefly">📜 Causes of WW1</button>
//       <button class="sample-btn" data-q="What is photosynthesis and how does it work?">🧬 Photosynthesis</button>
//       <button class="sample-btn" data-q="Explain the difference between stack and queue in data structures">{ } Stack vs Queue</button>
//       <button class="sample-btn" data-q="What is the difference between acids and bases in chemistry?">⚗ Acids vs Bases</button>
//     </div>
//   `;
//   messagesEl.appendChild(div);

//   div.querySelectorAll('.sample-btn').forEach(btn => {
//     btn.addEventListener('click', () => {
//       inputEl.value = btn.dataset.q;
//       updateCharCount();
//       autoResize();
//       askDoubt();
//     });
//   });
// }

// // ── Analytics Functions ─────────────────────────────────────
// async function openAnalytics() {
//   const panel = document.getElementById('analytics-panel');
//   panel.classList.add('open');
  
//   try {
//     const res = await fetch(`${API}/analytics/${sessionId}`);
//     const data = await res.json();
    
//     const content = document.getElementById('analytics-content');
//     content.innerHTML = `
//       <div class="stat-card">
//         <h4>Total Questions</h4>
//         <div class="big-number">${data.totalQuestions}</div>
//       </div>
//       <div class="stat-card">
//         <h4>Subjects Explored</h4>
//         <div class="subject-breakdown">
//           ${Object.entries(data.subjectBreakdown).map(([subj, info]) => `
//             <div class="subject-stat">
//               <span>${subj}</span>
//               <span>${info.count} questions</span>
//               <div class="topic-tags">
//                 ${info.topics.map(t => `<span class="topic-tag">${escHtml(t)}</span>`).join('')}
//               </div>
//             </div>
//           `).join('')}
//         </div>
//       </div>
//     `;
//   } catch (error) {
//     document.getElementById('analytics-content').innerHTML = '<div class="loading-placeholder">Failed to load analytics</div>';
//   }
// }

// // Generate study plan
// document.getElementById('generate-study-plan-btn')?.addEventListener('click', async () => {
//   const btn = document.getElementById('generate-study-plan-btn');
//   btn.textContent = 'Generating...';
//   btn.disabled = true;
  
//   try {
//     const res = await fetch(`${API}/study-plan/${sessionId}`, { method: 'POST' });
//     const data = await res.json();
    
//     const content = document.getElementById('analytics-content');
//     const planDiv = document.createElement('div');
//     planDiv.className = 'study-plan';
//     planDiv.innerHTML = `<h4>📖 Your Personalized Study Plan</h4><div class="plan-content">${data.studyPlan.replace(/\n/g, '<br>')}</div>`;
//     content.appendChild(planDiv);
//   } catch (error) {
//     appendError('Failed to generate study plan');
//   } finally {
//     btn.textContent = '📚 Generate Personalized Study Plan';
//     btn.disabled = false;
//   }
// });

// // ── Attachment Button Functions ──────────────────────────────────

// // Open file picker when attach button is clicked
// attachBtn?.addEventListener('click', () => {
//   hiddenFileInput.click();
// });

// // Handle file selection
// hiddenFileInput?.addEventListener('change', async (e) => {
//   const file = e.target.files[0];
//   if (!file) return;
  
//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('sessionId', sessionId);
  
//   const isImage = file.type.startsWith('image/');
//   const endpoint = isImage ? `${API}/analyze-image` : `${API}/upload`;
  
//   // Show uploading indicator
//   const originalText = attachBtn.innerHTML;
//   attachBtn.innerHTML = '⏳';
//   attachBtn.disabled = true;
  
//   try {
//     const res = await fetch(endpoint, {
//       method: 'POST',
//       body: formData
//     });
    
//     const data = await res.json();
    
//     if (isImage) {
//       // Image analysis - show in chat
//       appendBotMsg(data.analysis, 'Image Analysis');
//     } else {
//       // Add to uploaded files list
//       uploadedFiles.push({
//         id: data.fileId,
//         name: data.filename
//       });
//       saveUploadedFiles();
//       updateFilesPopup();
//       appendInfoMessage(`📄 File "${data.filename}" uploaded. Click 📎 to ask questions about it.`);
      
//       // Show popup
//       filesPopup.style.display = 'block';
      
//       // Auto-hide after 5 seconds
//       setTimeout(() => {
//         if (filesPopup.style.display === 'block') {
//           filesPopup.style.display = 'none';
//         }
//       }, 5000);
//     }
    
//     hiddenFileInput.value = '';
//   } catch (error) {
//     appendError('Failed to upload file');
//   } finally {
//     attachBtn.innerHTML = originalText;
//     attachBtn.disabled = false;
//   }
// });

// // Update files popup with uploaded files
// function updateFilesPopup() {
//   const list = document.getElementById('uploaded-files-list');
//   const select = fileSelectPopup;
  
//   if (!list) return;
  
//   list.innerHTML = '';
//   select.innerHTML = '<option value="">Select a file...</option>';
  
//   uploadedFiles.forEach(file => {
//     // Add to list
//     const fileItem = document.createElement('div');
//     fileItem.className = 'file-item';
//     fileItem.innerHTML = `
//       <span>📄 ${file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name}</span>
//       <button onclick="window.askAboutFilePopup('${file.id}')">Ask</button>
//     `;
//     list.appendChild(fileItem);
    
//     // Add to select
//     const option = document.createElement('option');
//     option.value = file.id;
//     option.textContent = file.name;
//     select.appendChild(option);
//   });
// }

// // Ask about file from popup
// window.askAboutFilePopup = async function(fileId) {
//   const question = fileQuestionPopup.value;
//   if (!question) {
//     alert('Please enter a question about the file');
//     return;
//   }
  
//   appendUserMsg(`[📎 File Q] ${question}`);
//   const typingId = appendTyping();
  
//   try {
//     const res = await fetch(`${API}/ask-file`, {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId, fileId, question })
//     });
    
//     const data = await res.json();
//     removeTyping(typingId);
//     appendBotMsg(data.answer, 'Document Analysis');
//     fileQuestionPopup.value = '';
//     filesPopup.style.display = 'none';
//   } catch (error) {
//     removeTyping(typingId);
//     appendError('Failed to get answer from file');
//   }
// };

// // Ask from select dropdown
// askFilePopupBtn?.addEventListener('click', () => {
//   const fileId = fileSelectPopup.value;
//   if (!fileId) {
//     alert('Please select a file first');
//     return;
//   }
//   window.askAboutFilePopup(fileId);
// });

// // Close popup
// closePopup?.addEventListener('click', () => {
//   filesPopup.style.display = 'none';
// });

// // Close popup when clicking outside
// document.addEventListener('click', (e) => {
//   if (filesPopup && filesPopup.style.display === 'block') {
//     if (!filesPopup.contains(e.target) && e.target !== attachBtn) {
//       filesPopup.style.display = 'none';
//     }
//   }
// });

// // Close analytics panel
// document.getElementById('close-analytics')?.addEventListener('click', () => {
//   document.getElementById('analytics-panel').classList.remove('open');
// });

// // Add analytics button to topbar
// const topbarRight = document.querySelector('.topbar-right');
// if (topbarRight && !document.querySelector('.analytics-icon-btn')) {
//   const analyticsBtn = document.createElement('button');
//   analyticsBtn.className = 'analytics-icon-btn';
//   analyticsBtn.innerHTML = '📊';
//   analyticsBtn.title = 'View Analytics & Study Plan';
//   analyticsBtn.onclick = openAnalytics;
//   topbarRight.appendChild(analyticsBtn);
// }

// // ── Sidebar mobile ────────────────────────────────────────────────
// menuToggle.addEventListener('click', () => {
//   sidebar.classList.toggle('open');
//   overlay.classList.toggle('visible');
// });

// overlay.addEventListener('click', closeSidebar);

// function closeSidebar() {
//   sidebar.classList.remove('open');
//   overlay.classList.remove('visible');
// }

// // ── Input handlers ────────────────────────────────────────────────
// inputEl.addEventListener('input', () => {
//   autoResize();
//   updateCharCount();
// });

// inputEl.addEventListener('keydown', e => {
//   if (e.key === 'Enter' && !e.shiftKey) {
//     e.preventDefault();
//     askDoubt();
//   }
// });

// askBtn.addEventListener('click', askDoubt);

// function autoResize() {
//   inputEl.style.height = 'auto';
//   inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
// }

// // ── Scroll ────────────────────────────────────────────────────────
// function scrollBottom() {
//   requestAnimationFrame(() => {
//     const chatWindow = document.getElementById('chat-window');
//     if (chatWindow) chatWindow.scrollTop = 999999;
//   });
// }

// // ── Escape HTML ───────────────────────────────────────────────────
// function escHtml(str) {
//   return String(str)
//     .replace(/&/g, '&amp;')
//     .replace(/</g, '&lt;')
//     .replace(/>/g, '&gt;')
//     .replace(/"/g, '&quot;');
// }

// // ── Boot ──────────────────────────────────────────────────────────
// init();