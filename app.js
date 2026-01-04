// app.js — Prompt Assist (Vanilla JS) with Clipboard History & Favorites
// Updated: GitHub Gist の URL を保存して favorites を読み書きできる機能を追加
// 注意: Gist へ「書き込み」するには Personal Access Token (scope: gist) が必要です。

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

const gistUrlInput = document.getElementById('gistUrlInput');
const gistTokenInput = document.getElementById('gistTokenInput');
const saveGistBtn = document.getElementById('saveGistBtn');
const loadGistBtn = document.getElementById('loadGistBtn');
const pushGistBtn = document.getElementById('pushGistBtn');
const gistStatus = document.getElementById('gistStatus');

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
const LS_GIST_URL = 'pa_gist_url';
const LS_GIST_TOKEN = 'pa_gist_token';
const MAX_HISTORY = 100;

/* ---------- Helpers: Favorites/localStorage ---------- */
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

/* ---------- Suggestions / Insert helpers ---------- */
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

/* ---------- Stats / UI helpers ---------- */
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

/* ---------- Presets (unchanged) ---------- */
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

/* ---------- Copy helpers ---------- */
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

/* ---------- Gist helpers: parse ID, fetch, push ---------- */
function saveGistConfigToLocal() {
  try {
    const url = (gistUrlInput.value || '').trim();
    const token = (gistTokenInput.value || '').trim();
    if (url) localStorage.setItem(LS_GIST_URL, url);
    else localStorage.removeItem(LS_GIST_URL);
    if (token) localStorage.setItem(LS_GIST_TOKEN, token);
    else localStorage.removeItem(LS_GIST_TOKEN);
    updateGistStatus('Gist 設定を保存しました。');
  } catch (e) {
    updateGistStatus('Gist 設定の保存に失敗しました。', true);
  }
}
function loadGistConfigToUI() {
  const url = localStorage.getItem(LS_GIST_URL) || '';
  const token = localStorage.getItem(LS_GIST_TOKEN) || '';
  gistUrlInput.value = url;
  gistTokenInput.value = token;
}
function extractGistIdFromUrl(u) {
  try {
    const parsed = new URL(u);
    const parts = parsed.pathname.split('/').filter(Boolean);
    // typical: /username/gistid
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      if (/^[0-9a-f]{5,}$/i.test(p)) return p;
    }
    return parts[parts.length - 1] || '';
  } catch (e) {
    // fallback: try to find hex sequence
    const m = u.match(/([0-9a-f]{5,})/i);
    return m ? m[1] : '';
  }
}
function updateGistStatus(msg, isError=false) {
  gistStatus.textContent = msg;
  gistStatus.style.color = isError ? '#ff8a8a' : 'var(--muted)';
}

// Fetch gist and merge favorites into local
async function fetchFavoritesFromGist() {
  const url = (gistUrlInput.value || '').trim() || localStorage.getItem(LS_GIST_URL);
  if (!url) {
    updateGistStatus('Gist の URL が設定されていません。', true);
    return;
  }
  const gistId = extractGistIdFromUrl(url);
  if (!gistId) {
    updateGistStatus('Gist ID を URL から抽出できません。URL を確認してください。', true);
    return;
  }
  updateGistStatus('Gist を取得中...');
  try {
    const res = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!res.ok) {
      const txt = await res.text();
      updateGistStatus(`Gist の取得に失敗しました: ${res.status} ${txt}`, true);
      return;
    }
    const data = await res.json();
    const files = data.files || {};
    let fileName = 'favorites.json';
    if (!files[fileName]) {
      // pick first file
      const keys = Object.keys(files);
      if (keys.length === 0) {
        updateGistStatus('Gist にファイルが見つかりません。', true);
        return;
      }
      fileName = keys[0];
    }
    const content = files[fileName].content;
    let imported;
    try {
      imported = JSON.parse(content);
      if (!Array.isArray(imported)) throw new Error('期待する形式ではありません（配列）');
    } catch (e) {
      updateGistStatus('Gist のファイルが JSON 配列ではありません。', true);
      return;
    }
    // マージ（重複を避けて remote -> local の順に追加）
    const local = loadFavorites();
    const merged = [...imported.filter(i => !local.includes(i)), ...local];
    saveFavorites(merged);
    renderFavorites();
    updateGistStatus(`Gist から読み込みました（${fileName}）。`);
    log(`Gist (${gistId}/${fileName}) からお気に入りを読み込みました。`);
  } catch (err) {
    updateGistStatus('Gist の取得中にエラーが発生しました。', true);
    log('Gist fetch error: ' + err, true);
  }
}

// Push local favorites to gist (PATCH) - requires token
async function pushFavoritesToGist() {
  const url = (gistUrlInput.value || '').trim() || localStorage.getItem(LS_GIST_URL);
  const token = (gistTokenInput.value || '').trim() || localStorage.getItem(LS_GIST_TOKEN);
  if (!url) {
    updateGistStatus('Gist の URL が設定されていません。', true);
    return;
  }
  const gistId = extractGistIdFromUrl(url);
  if (!gistId) {
    updateGistStatus('Gist ID を URL から抽出できません。URL を確認してください。', true);
    return;
  }
  if (!token) {
    updateGistStatus('Gist を更新するには GitHub トークンが必要です（Gist scope）。', true);
    return;
  }
  updateGistStatus('Gist に保存中...');
  try {
    // まず既存ファイル名を取得
    const metaRes = await fetch(`https://api.github.com/gists/${gistId}`);
    if (!metaRes.ok) {
      updateGistStatus('Gist メタ取得に失敗しました: ' + metaRes.status, true);
      return;
    }
    const meta = await metaRes.json();
    const files = Object.keys(meta.files || {});
    let fileName = 'favorites.json';
    if (!files.includes(fileName)) {
      if (files.length === 0) {
        // create favorites.json by updating with that filename
        fileName = 'favorites.json';
      } else {
        fileName = files[0];
      }
    }
    const favorites = loadFavorites();
    const body = {
      files: {
        [fileName]: {
          content: JSON.stringify(favorites, null, 2)
        }
      }
    };
    const patchRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    if (!patchRes.ok) {
      const txt = await patchRes.text();
      updateGistStatus(`Gist 更新に失敗しました: ${patchRes.status} ${txt}`, true);
      return;
    }
    updateGistStatus('Gist に保存しました。');
    log('Gist にお気に入りを保存しました。');
  } catch (err) {
    updateGistStatus('Gist の保存中にエラーが発生しました。', true);
    log('Gist push error: ' + err, true);
  }
}

/* ---------- Negative fold state save/restore ---------- */
function loadNegativeOpenState() {
  try {
    const v = localStorage.getItem(LS_NEGATIVE_OPEN);
    if (v === 'false') negativeDetails.open = false;
    else negativeDetails.open = true; // default open
  } catch (e) { /* ignore */ }
}
if (negativeDetails) {
  negativeDetails.addEventListener('toggle', () => {
    try {
      localStorage.setItem(LS_NEGATIVE_OPEN, negativeDetails.open ? 'true' : 'false');
    } catch (e) {}
  });
}

/* ---------- Event wiring ---------- */
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

saveGistBtn.addEventListener('click', () => {
  saveGistConfigToLocal();
});
loadGistBtn.addEventListener('click', async () => {
  await fetchFavoritesFromGist();
});
pushGistBtn.addEventListener('click', async () => {
  await pushFavoritesToGist();
});

/* ---------- Init ---------- */
window.addEventListener('load', () => {
  renderSuggestions();
  renderFavorites();
  renderHistory();
  loadPresetOptions();
  loadNegativeOpenState();
  loadGistConfigToUI();
  updateStats();
  log("準備ができました。");
});