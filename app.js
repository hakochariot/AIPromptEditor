// app.js — Prompt Assist (Vanilla JS) with Clipboard History & Favorites
// Updated: per-field copy buttons (prompt & negative) placed alongside each textarea.

const promptEl = document.getElementById('prompt');
const negativeEl = document.getElementById('negative');
const negativeDetails = document.getElementById('negativeDetails');
const suggestionsEl = document.getElementById('suggestions');
const charCountEl = document.getElementById('charCount');
const wordCountEl = document.getElementById('wordCount');
const tokenEstimateEl = document.getElementById('tokenEstimate');
const savePresetBtn = document.getElementById('savePreset');
const presetSelect = document.getElementById('presetSelect');
const logEl = document.getElementById('log');

const copyPromptBtn = document.getElementById('copyPromptBtn');
const copyNegativeBtn = document.getElementById('copyNegativeBtn');

const favoritesEl = document.getElementById('favorites');
const favInput = document.getElementById('favInput');
const addFavBtn = document.getElementById('addFavBtn');

const clipboardHistoryEl = document.getElementById('clipboardHistory');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

const SUGGESTIONS = [
  "高精細", "8K", "映画的なライティング", "フォトリアル",
  "アニメ風", "スタジオ写真", "ボケ", "超広角",
  "コンセプトアート", "デジタルペインティング", "鮮やかな色彩", "ソフトライティング"
];

// localStorage keys
const LS_FAV_KEY = 'pa_favorites';
const LS_HISTORY_KEY = 'pa_clip_history';
const LS_PRESETS_KEY = 'pa_presets';
const LS_NEGATIVE_OPEN = 'pa_negative_open';
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

// 簡易統計 + トークン概算
function updateStats() {
  const v = promptEl.value;
  const chars = v.length;
  const words = v.trim().length === 0 ? 0 : v.trim().split(/\s+/).length;
  const tokenEstimate = Math.ceil(words * 1.3);
  charCountEl.textContent = `${chars} 文字`;
  wordCountEl.textContent = `${words} 単語`;
  tokenEstimateEl.textContent = `〜${tokenEstimate} トークン`;
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
    remove.title = 'お気に入りを削除';
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
  log('お気に入りを追加しました。');
}
function removeFavorite(index) {
  const list = loadFavorites();
  if (index < 0 || index >= list.length) return;
  const removed = list.splice(index, 1);
  saveFavorites(list);
  renderFavorites();
  log('お気に入りを削除しました: ' + (removed[0] || ''));
}

/* ---------- クリップボード履歴 (localStorage) ---------- */
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
  if (list.length && list[0].text === text) return; // 直前と同じなら追加しない
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
  log('履歴をクリアしました。');
}
function renderHistory() {
  const list = loadHistory();
  clipboardHistoryEl.innerHTML = '';
  if (!list.length) {
    const p = document.createElement('div');
    p.className = 'history-item';
    p.textContent = '履歴はまだありません。';
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
    insertBtn.textContent = '挿入';
    insertBtn.title = 'プロンプトに挿入';
    insertBtn.addEventListener('click', () => {
      insertAtCursor(promptEl, entry.text);
    });

    const copyBtnLocal = document.createElement('button');
    copyBtnLocal.type = 'button';
    copyBtnLocal.textContent = 'コピー';
    copyBtnLocal.title = 'クリップボードにコピー';
    copyBtnLocal.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(entry.text);
        addHistoryEntry(entry.text); // 先頭に持ってくる
        log('履歴項目をコピーしました。');
      } catch (err) {
        log('コピーに失敗しました: ' + err, true);
      }
    });

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = '削除';
    delBtn.title = '履歴から削除';
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

/* ---------- プリセット (localStorage) ----------
   プリセットはプロンプトとネガティブのみ保存します。
*/
function savePreset() {
  const name = prompt("プリセット名を入力してください。");
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
  log("プリセットを保存しました: " + name);
}

function loadPresetOptions() {
  const list = JSON.parse(localStorage.getItem(LS_PRESETS_KEY) || '[]');
  presetSelect.innerHTML = '<option value="">プリセットを読み込む...</option>';
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
  log("プリセットを適用しました: " + p.name);
}

/* ---------- コピーヘルパー（任意のテキストをコピーして履歴へ追加） ---------- */
async function copyAndRecord(text, labelForLog = 'コピー') {
  if (!text) {
    log('コピーするテキストが空です。', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    addHistoryEntry(text);
    log(`${labelForLog}しました。`);
  } catch (err) {
    log(`${labelForLog}に失敗しました: ${err}`, true);
  }
}

/* ---------- ネガティブ折りたたみ状態の保存/復元 ---------- */
function loadNegativeOpenState() {
  try {
    const v = localStorage.getItem(LS_NEGATIVE_OPEN);
    if (v === 'false') negativeDetails.open = false;
    else negativeDetails.open = true; // デフォルトは開いている
  } catch (e) { /* ignore */ }
}
if (negativeDetails) {
  negativeDetails.addEventListener('toggle', () => {
    try {
      localStorage.setItem(LS_NEGATIVE_OPEN, negativeDetails.open ? 'true' : 'false');
    } catch (e) {}
  });
}

/* ---------- イベント & 初期化 ---------- */
promptEl.addEventListener('input', updateStats);
promptEl.addEventListener('keydown', (e) => {
  if (e.key === 'Tab') {
    e.preventDefault();
    if (SUGGESTIONS.length) insertSuggestion(SUGGESTIONS[0]);
  }
});
negativeEl.addEventListener('input', () => {/* no-op */});

if (copyPromptBtn) copyPromptBtn.addEventListener('click', () => copyAndRecord(buildFullPrompt(), 'プロンプトをコピー'));
if (copyNegativeBtn) copyNegativeBtn.addEventListener('click', () => copyAndRecord(negativeEl.value.trim(), 'ネガティブプロンプトをコピー'));

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
  if (confirm('クリップボード履歴を削除しますか？')) clearHistory();
});

window.addEventListener('load', () => {
  renderSuggestions();
  renderFavorites();
  renderHistory();
  loadPresetOptions();
  loadNegativeOpenState();
  updateStats();
  log("準備ができました。");
});