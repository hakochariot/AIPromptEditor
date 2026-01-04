// app.js — Prompt Assist (Vanilla JS) with Clipboard History & Favorites
// Note: Generate button / generateImage logic removed.

const promptEl = document.getElementById('prompt');
const negativeEl = document.getElementById('negative');
const suggestionsEl = document.getElementById('suggestions');
const charCountEl = document.getElementById('charCount');
const wordCountEl = document.getElementById('wordCount');
const tokenEstimateEl = document.getElementById('tokenEstimate');
const tagButtonsEl = document.getElementById('tagButtons');
const copyBtn = document.getElementById('copyBtn');
const savePresetBtn = document.getElementById('savePreset');
const presetSelect = document.getElementById('presetSelect');
const logEl = document.getElementById('log');

const favoritesEl = document.getElementById('favorites');
const favInput = document.getElementById('favInput');
const addFavBtn = document.getElementById('addFavBtn');

const clipboardHistoryEl = document.getElementById('clipboardHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const SUGGESTIONS = [
  "highly detailed", "8k", "cinematic lighting", "photorealistic",
  "anime style", "studio photo", "bokeh", "ultra wide angle",
  "concept art", "digital painting", "vivid colors", "soft lighting"
];

const TAGS = [
  "by greg rutkowski", "artstation", "studio ghibli", "hayao miyazaki",
  "cinematic", "photorealism", "oil painting", "watercolor",
  "trending on artstation", "dark fantasy", "vaporwave"
];

// localStorage keys
const LS_FAV_KEY = 'pa_favorites';
const LS_HISTORY_KEY = 'pa_clip_history';
const LS_PRESETS_KEY = 'pa_presets';
const MAX_HISTORY = 100;

function renderSuggestions() {
  suggestionsEl.innerHTML = '';
  for (const s of SUGGESTIONS) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'suggestion-chip';
    chip.textContent = s;
    chip.addEventListener('click', () => insertSuggestion(s));
    suggestionsEl.appendChild(chip);
  }
}
function renderTags() {
  tagButtonsEl.innerHTML = '';
  for (const t of TAGS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'tag';
    b.textContent = t;
    b.addEventListener('click', () => insertAtCursor(promptEl, t));
    tagButtonsEl.appendChild(b);
  }
}

function insertSuggestion(text) {
  if (promptEl.value.trim().length === 0) promptEl.value = text;
  else promptEl.value = promptEl.value.trim() + ', ' + text;
  updateStats();
  promptEl.focus();
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.slice(0, start) + (start===0 ? text : ' ' + text) + val.slice(end);
  textarea.selectionStart = textarea.selectionEnd = start + text.length + (start===0?0:1);
  updateStats();
  textarea.focus();
}

// Simple stats + rough token estimate
function updateStats() {
  const v = promptEl.value;
  const chars = v.length;
  const words = v.trim().length === 0 ? 0 : v.trim().split(/\s+/).length;
  const tokenEstimate = Math.ceil(words * 1.3);
  charCountEl.textContent = `${chars} chars`;
  wordCountEl.textContent = `${words} words`;
  tokenEstimateEl.textContent = `~${tokenEstimate} tokens`;
}

function buildFullPrompt() {
  return promptEl.value.trim();
}

function log(msg, isError=false) {
  const el = document.createElement('div');
  el.textContent = msg;
  el.style.color = isError ? '#ff8a8a' : 'var(--muted)';
  logEl.prepend(el);
}

/* ---------- Favorites (localStorage) ---------- */
function loadFavorites() {
  try {
    return JSON.parse(localStorage.getItem(LS_FAV_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function saveFavorites(list) {
  localStorage.setItem(LS_FAV_KEY, JSON.stringify(list));
}
function renderFavorites() {
  const list = loadFavorites();
  favoritesEl.innerHTML = '';
  for (let i = 0; i < list.length; i++) {
    const text = list[i];
    const wrap = document.createElement('div');
    wrap.className = 'favorite';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = text;
    btn.addEventListener('click', () => insertAtCursor(promptEl, text));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove';
    remove.textContent = '✕';
    remove.title = 'Remove favorite';
    remove.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFavorite(i);
    });
    wrap.appendChild(btn);
    wrap.appendChild(remove);
    favoritesEl.appendChild(wrap);
  }
}
function addFavorite(text) {
  if (!text || !text.trim()) return;
  const list = loadFavorites();
  if (!list.includes(text)) list.unshift(text);
  saveFavorites(list);
  renderFavorites();
  log('Favorite added.');
}
function removeFavorite(index) {
  const list = loadFavorites();
  if (index < 0 || index >= list.length) return;
  const removed = list.splice(index, 1);
  saveFavorites(list);
  renderFavorites();
  log('Favorite removed: ' + (removed[0] || ''));
}

/* ---------- Clipboard History (localStorage) ---------- */
function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(LS_HISTORY_KEY) || '[]');
  } catch (e) {
    return [];
  }
}
function saveHistory(list) {
  localStorage.setItem(LS_HISTORY_KEY, JSON.stringify(list));
}
function addHistoryEntry(text) {
  if (!text) return;
  const list = loadHistory();
  if (list.length && list[0].text === text) return;
  const entry = {
    text,
    ts: Date.now()
  };
  list.unshift(entry);
  if (list.length > MAX_HISTORY) list.length = MAX_HISTORY;
  saveHistory(list);
  renderHistory();
}
function removeHistoryEntry(idx) {
  const list = loadHistory();
  if (idx < 0 || idx >= list.length) return;
  list.splice(idx, 1);
  saveHistory(list);
  renderHistory();
}
function clearHistory() {
  localStorage.removeItem(LS_HISTORY_KEY);
  renderHistory();
  log('History cleared.');
}
function renderHistory() {
  const list = loadHistory();
  clipboardHistoryEl.innerHTML = '';
  if (!list.length) {
    const p = document.createElement('div');
    p.className = 'history-item';
    p.textContent = 'No clipboard history yet.';
    clipboardHistoryEl.appendChild(p);
    return;
  }
  list.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const left = document.createElement('div');
    left.style.flex = '1 1 auto';
    const meta = document.createElement('div');
    meta.className = 'history-meta';
    meta.textContent = new Date(entry.ts).toLocaleString();
    const text = document.createElement('div');
    text.className = 'history-text';
    text.textContent = entry.text;
    left.appendChild(meta);
    left.appendChild(text);

    const actions = document.createElement('div');
    actions.className = 'history-actions';

    const insertBtn = document.createElement('button');
    insertBtn.type = 'button';
    insertBtn.textContent = 'Insert';
    insertBtn.title = 'Insert into prompt';
    insertBtn.addEventListener('click', () => {
      insertAtCursor(promptEl, entry.text);
    });

    const copyBtnLocal = document.createElement('button');
    copyBtnLocal.type = 'button';
    copyBtnLocal.textContent = 'Copy';
    copyBtnLocal.title = 'Copy to clipboard';
    copyBtnLocal.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(entry.text);
        addHistoryEntry(entry.text);
        log('History item copied to clipboard.');
      } catch (err) {
        log('Copy failed: ' + err, true);
      }
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Delete';
    delBtn.title = 'Delete from history';
    delBtn.addEventListener('click', () => {
      removeHistoryEntry(idx);
    });

    actions.appendChild(insertBtn);
    actions.appendChild(copyBtnLocal);
    actions.appendChild(delBtn);

    item.appendChild(left);
    item.appendChild(actions);
    clipboardHistoryEl.appendChild(item);
  });
}

/* ---------- Presets (localStorage) ----------
   Presets store prompt and negative only.
*/
function savePreset() {
  const name = prompt("Preset name?");
  if (!name) return;
  const p = {
    name,
    prompt: promptEl.value,
    negative: negativeEl.value
  };
  const list = JSON.parse(localStorage.getItem(LS_PRESETS_KEY) || '[]');
  list.push(p);
  localStorage.setItem(LS_PRESETS_KEY, JSON.stringify(list));
  loadPresetOptions();
  log("Preset saved: " + name);
}

function loadPresetOptions() {
  const list = JSON.parse(localStorage.getItem(LS_PRESETS_KEY) || '[]');
  presetSelect.innerHTML = '<option value="">Load Preset...</option>';
  list.forEach((p, idx) => {
    const opt = document.createElement('option');
    opt.value = String(idx);
    opt.textContent = p.name;
    presetSelect.appendChild(opt);
  });
}

function applyPreset(index) {
  const list = JSON.parse(localStorage.getItem(LS_PRESETS_KEY) || '[]');
  const p = list[index];
  if (!p) return;
  promptEl.value = p.prompt || '';
  negativeEl.value = p.negative || '';
  updateStats();
  log("Preset applied: " + p.name);
}

/* ---------- Copy behavior (adds to history) ---------- */
async function copyPromptToClipboard() {
  const full = buildFullPrompt();
  try {
    await navigator.clipboard.writeText(full);
    log("Prompt copied to clipboard!");
    addHistoryEntry(full);
  } catch (err) {
    log("Copy failed: " + err, true);
  }
}

/* ---------- Helpers & events ---------- */
promptEl.addEventListener('input', updateStats);
promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (SUGGESTIONS.length) insertSuggestion(SUGGESTIONS[0]);
  }
});
negativeEl.addEventListener('input', () => {/* no-op for now */});
copyBtn.addEventListener('click', copyPromptToClipboard);
savePresetBtn.addEventListener('click', savePreset);
presetSelect.addEventListener('change', (e) => {
  if (!e.target.value) return;
  applyPreset(Number(e.target.value));
});

addFavBtn.addEventListener('click', () => {
  const v = favInput.value;
  if (!v || !v.trim()) return;
  addFavorite(v.trim());
  favInput.value = '';
});
favInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addFavBtn.click();
  }
});

clearHistoryBtn.addEventListener('click', () => {
  if (confirm('Clear clipboard history?')) clearHistory();
});

/* ---------- Init ---------- */
window.addEventListener('load', () => {
  renderSuggestions();
  renderTags();
  renderFavorites();
  renderHistory();
  loadPresetOptions();
  updateStats();
  log("Prompt Assist ready (Generate button removed).");
});