// Leonida Ledger — offline GTA VI trophy guide & tracker.
// Loads the trophy data from data/trophies.json (a file inside app/), keeps
// progress in localStorage, and renders the checklist, guide pane, roadmap,
// missables watch and save tools. No network requests leave this folder.
const STORAGE_KEY = 'leonida-ledger-v1';
const KIND_LABELS = {
  story: 'Story',
  strangers: 'Strangers & side strands',
  activities: 'Activities',
  collectibles: 'Collectibles',
  crimes: 'Crimes & robberies',
  exploration: 'Exploration',
  money: 'Money',
  misc: 'Miscellaneous',
  platinum: 'Platinum & 100%',
};
const STAGES = [
  { n: 1, title: 'Stage 1 — The story run', blurb: 'Play the campaign through all chapters and the final mission. Every story trophy unlocks on its own; no medals or difficulty settings are involved. Two habits start now: keep a manual save at each chapter start, and do Lucia\u2019s Chapter 1 balcony meditation before the chapter ends.' },
  { n: 2, title: 'Stage 2 — Strangers & side strands', blurb: 'Finish the named strands (Andy, Kenton, Billy, Randy, Tyrone), hunt one unique animal for Bret, then find three more stranger strands to complete the Strangers & Freaks silver.' },
  { n: 3, title: 'Stage 3 — Activities & challenges', blurb: 'Try all nine activity types, gold all 42 shooting-range challenges, win Top Fun at 14 locations and 20 different races, beat Cal at fishing, finish an arcade game, and complete 50 challenges on the way to 250 stunts.' },
  { n: 4, title: 'Stage 4 — Collectibles & exploration', blurb: 'WAiNK-scan 100 locations and 100 vehicles, complete 3 card sets, meditate at all 18 spots, and uncover the whole map for The Goodtime State. Scan everything new from Chapter 1 onward and this stage mostly does itself.' },
  { n: 5, title: 'Stage 5 — Robberies & money', blurb: 'Clear the crime set: 5 bank vaults, an armored truck, a silent jewelry job, one illegal operation per gang, the partner trophies, then launder $250,000, spend $100,000, buy all 8 garages and register 10 vehicles with Scooter Bros.' },
  { n: 6, title: 'Stage 6 — 100% & the platinum', blurb: 'Finish the in-game 100% checklist (Progress > Stats) for A Long Road — quotas, not literally everything — and Vice Got a Price! follows as the last trophy falls.' },
];

let trophies = [];
let state = loadState();
let selectedId = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        earned: parsed.earned || {},
        counts: parsed.counts || {},
        spoiler: Boolean(parsed.spoiler),
      };
    }
  } catch (err) { /* corrupted save: start fresh */ }
  return { earned: {}, counts: {}, spoiler: false };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function isEarned(t) { return Boolean(state.earned[t.id]); }
function countOf(t) { return Math.max(0, Number(state.counts[t.id] || 0)); }

function setEarned(t, on) {
  if (on) state.earned[t.id] = true; else delete state.earned[t.id];
  saveState();
  renderAll();
}

function bumpCount(t, delta) {
  const next = Math.max(0, countOf(t) + delta);
  state.counts[t.id] = t.target ? Math.min(next, t.target) : next;
  if (t.target && state.counts[t.id] >= t.target) state.earned[t.id] = true;
  saveState();
  renderAll();
}

function masked(t) {
  // Spoiler shield: story trophies PlayStation hides stay masked until earned.
  return state.spoiler && t.hidden && t.kind === 'story' && !isEarned(t);
}

function displayName(t) { return masked(t) ? 'Hidden story trophy' : t.name; }
function displayDesc(t) { return masked(t) ? 'Complete more of the story to reveal this trophy.' : t.description; }

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtNum(n) { return n.toLocaleString('en-US'); }

function currentFilters() {
  return {
    q: document.getElementById('search').value.trim().toLowerCase(),
    grade: document.getElementById('filter-grade').value,
    kind: document.getElementById('filter-kind').value,
    status: document.getElementById('filter-status').value,
    missableOnly: document.getElementById('filter-missable').checked,
    hiddenOnly: document.getElementById('filter-hidden').checked,
  };
}

function passesFilters(t, f) {
  if (f.grade !== 'all' && t.grade !== f.grade) return false;
  if (f.kind !== 'all' && t.kind !== f.kind) return false;
  if (f.status === 'earned' && !isEarned(t)) return false;
  if (f.status === 'missing' && isEarned(t)) return false;
  if (f.missableOnly && !t.missable) return false;
  if (f.hiddenOnly && !t.hidden) return false;
  if (f.q) {
    const hay = masked(t) ? '' : (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(f.q)) return false;
  }
  return true;
}

function renderScoreboard() {
  const earned = trophies.filter(isEarned);
  document.getElementById('earned-count').textContent = earned.length;
  document.getElementById('score-fill').style.width = (earned.length / trophies.length * 100) + '%';
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (isEarned(t)) byGrade[t.grade].got += 1;
  }
  document.getElementById('score-grades').textContent =
    ['platinum', 'gold', 'silver', 'bronze'].map((g) => g + ' ' + byGrade[g].got + '/' + byGrade[g].total).join(' · ');
}

function progressCell(t) {
  if (!t.target) return '<span class="t-desc">—</span>';
  const c = countOf(t);
  return '<span class="counter">' +
    '<button type="button" data-bump="-1" data-id="' + t.id + '" aria-label="Decrease">−</button>' +
    '<span class="count">' + fmtNum(c) + ' / ' + fmtNum(t.target) + '</span>' +
    '<button type="button" data-bump="1" data-id="' + t.id + '" aria-label="Increase">+</button>' +
    '</span>';
}

function renderList() {
  const f = currentFilters();
  const shown = trophies.filter((t) => passesFilters(t, f));
  const tbody = document.getElementById('trophy-rows');
  tbody.innerHTML = shown.map((t) => {
    const badges = [
      '<span class="badge">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>',
      t.hidden ? '<span class="badge hidden-flag">Hidden on PSN</span>' : '',
      t.missable ? '<span class="badge missable">Missable</span>' : '',
    ].join('');
    return '<tr data-id="' + t.id + '"' + (t.id === selectedId ? ' class="is-selected"' : '') + (isEarned(t) ? ' class="is-earned"' : '') + '>' +
      '<td><input type="checkbox" data-earned="' + t.id + '"' + (isEarned(t) ? ' checked' : '') + ' aria-label="Earned"></td>' +
      '<td><span class="t-name">' + esc(displayName(t)) + '</span><br><span class="t-desc">' + esc(displayDesc(t)) + '</span><span class="t-badges">' + badges + '</span></td>' +
      '<td><span class="medal ' + t.grade + '">' + t.grade + '</span></td>' +
      '<td>' + progressCell(t) + '</td></tr>';
  }).join('');
  document.getElementById('empty-note').hidden = shown.length > 0;
  document.getElementById('result-count').textContent =
    'Showing ' + shown.length + ' of ' + trophies.length + ' trophies' +
    (state.spoiler ? ' · spoiler shield on (story trophies masked until earned)' : '');
}

function renderDetail() {
  const pane = document.getElementById('detail-pane');
  const t = trophies.find((x) => x.id === selectedId);
  if (!t) {
    pane.innerHTML = '<p class="detail-hint">Pick a trophy on the left to read its full guide here — what to do, where to start, and the sources behind each fact.</p>';
    return;
  }
  if (masked(t)) {
    pane.innerHTML = '<h3>Hidden story trophy</h3>' +
      '<p class="detail-desc">The spoiler shield is hiding this trophy until you earn it.</p>' +
      '<p>Turn the shield off in the toolbar if you want to read ahead, or keep playing — the name, description and guide reveal themselves the moment the trophy pops.</p>';
    return;
  }
  const pct = t.target ? Math.min(100, Math.round(countOf(t) / t.target * 100)) : null;
  pane.innerHTML =
    '<h3>' + esc(t.name) + '</h3>' +
    '<div class="detail-meta"><span class="medal ' + t.grade + '">' + t.grade + '</span>' +
    '<span class="badge">' + esc(KIND_LABELS[t.kind] || t.kind) + '</span>' +
    (t.hidden ? '<span class="badge hidden-flag">Hidden on PSN</span>' : '') +
    (t.missable ? '<span class="badge missable">Missable — see Missables watch</span>' : '') +
    '<span class="badge">Roadmap stage ' + t.stage + '</span></div>' +
    '<p class="detail-desc">“' + esc(t.description) + '”</p>' +
    '<p class="detail-guide">' + esc(t.guide) + '</p>' +
    '<strong>How to earn it</strong><ol class="detail-steps">' +
    t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    (t.target ? '<div class="detail-progress"><strong>Your progress: ' + fmtNum(countOf(t)) + ' / ' + fmtNum(t.target) + ' (' + pct + '%)</strong>' +
      '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
      '<p class="t-desc">Use the − / + counter in the list to track this trophy; reaching the target ticks it off.</p></div>' : '') +
    '<label class="check" style="display:flex;gap:6px;align-items:center;margin-top:10px"><input type="checkbox" id="detail-earned"' + (isEarned(t) ? ' checked' : '') + '> I have earned this trophy</label>' +
    '<div class="detail-sources"><strong>Sources:</strong> ' + esc(t.sources) + '</div>';
  const box = document.getElementById('detail-earned');
  if (box) box.addEventListener('change', () => setEarned(t, box.checked));
}

function renderRoadmap() {
  const wrap = document.getElementById('roadmap-stages');
  wrap.innerHTML = STAGES.map((stage) => {
    const inStage = trophies.filter((t) => t.stage === stage.n);
    const got = inStage.filter(isEarned).length;
    const pct = inStage.length ? Math.round(got / inStage.length * 100) : 0;
    const items = inStage.map((t) =>
      '<li' + (isEarned(t) ? ' class="done"' : '') + '><strong>' + esc(displayName(t)) + '</strong> — ' + esc(displayDesc(t)) + '</li>').join('');
    return '<div class="stage"><h3>' + esc(stage.title) + '</h3>' +
      '<p>' + esc(stage.blurb) + '</p>' +
      '<div class="stage-progress">' + got + ' of ' + inStage.length + ' trophies in this stage (' + pct + '%)</div>' +
      '<div class="bar"><div style="width:' + pct + '%"></div></div>' +
      '<ul>' + items + '</ul></div>';
  }).join('');
}

function renderMissables() {
  const wrap = document.getElementById('missable-list');
  const miss = trophies.filter((t) => t.missable);
  wrap.innerHTML = miss.map((t) =>
    '<div class="missable-card"><h3>' + esc(t.name) + ' <span class="medal ' + t.grade + '">' + t.grade + '</span></h3>' +
    '<p class="detail-desc">“' + esc(t.description) + '”</p>' +
    '<p>' + esc(t.guide) + '</p>' +
    '<ol class="detail-steps">' + t.steps.map((s) => '<li>' + esc(s) + '</li>').join('') + '</ol>' +
    '<div class="detail-sources"><strong>Sources:</strong> ' + esc(t.sources) + '</div></div>').join('') +
    '<p>Every other trophy can be earned in free roam after the story — the story trophies themselves are automatic, and nothing else is currently flagged as missable. This page will grow if the community confirms more.</p>';
}

function renderAll() {
  renderScoreboard();
  renderList();
  renderDetail();
  renderRoadmap();
  renderMissables();
}

function switchView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.id === 'view-' + name));
}

function setStatus(msg) {
  document.getElementById('save-status').textContent = msg;
}

function exportProgress() {
  const payload = { app: 'leonida-ledger', version: 1, earned: state.earned, counts: state.counts, spoiler: state.spoiler };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-ledger-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
  setStatus('Progress exported. Keep the file somewhere safe.');
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      if (!data || typeof data !== 'object' || !data.earned || !data.counts) throw new Error('bad file');
      state = { earned: data.earned, counts: data.counts, spoiler: Boolean(data.spoiler) };
      document.getElementById('spoiler-toggle').checked = state.spoiler;
      saveState();
      renderAll();
      setStatus('Progress imported — ' + Object.keys(state.earned).length + ' trophies marked earned.');
    } catch (err) {
      setStatus('That file could not be imported. Pick a Leonida Ledger progress JSON.');
    }
  };
  reader.readAsText(file);
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => switchView(b.dataset.view)));
  for (const id of ['search', 'filter-grade', 'filter-kind', 'filter-status', 'filter-missable', 'filter-hidden']) {
    document.getElementById(id).addEventListener('input', renderList);
    document.getElementById(id).addEventListener('change', renderList);
  }
  document.getElementById('spoiler-toggle').checked = state.spoiler;
  document.getElementById('spoiler-toggle').addEventListener('change', (e) => {
    state.spoiler = e.target.checked;
    saveState();
    renderAll();
  });
  document.getElementById('trophy-rows').addEventListener('click', (e) => {
    const bump = e.target.closest('[data-bump]');
    if (bump) {
      const t = trophies.find((x) => x.id === Number(bump.dataset.id));
      if (t) bumpCount(t, Number(bump.dataset.bump));
      return;
    }
    const box = e.target.closest('[data-earned]');
    if (box) {
      const t = trophies.find((x) => x.id === Number(box.dataset.earned));
      if (t) setEarned(t, box.checked);
      return;
    }
    const row = e.target.closest('tr[data-id]');
    if (row) {
      selectedId = Number(row.dataset.id);
      renderList();
      renderDetail();
    }
  });
  document.getElementById('export-btn').addEventListener('click', exportProgress);
  document.getElementById('import-file').addEventListener('change', (e) => {
    if (e.target.files[0]) importProgress(e.target.files[0]);
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    state = { earned: {}, counts: {}, spoiler: state.spoiler };
    saveState();
    renderAll();
    setStatus('All progress reset. A fresh ledger page.');
  });
  // Keyboard shortcuts: "/" focuses search, Escape clears the open guide.
  document.addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (e.key === '/' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
      e.preventDefault();
      document.getElementById('search').focus();
    }
    if (e.key === 'Escape') {
      selectedId = null;
      renderList();
      renderDetail();
    }
  });
}

async function boot() {
  const res = await fetch('data/trophies.json');
  const data = await res.json();
  trophies = data.trophies || data;
  wireEvents();
  // Screenshot/demo helpers: ?seed=demo fills sample progress, ?view= picks a
  // tab, ?select=<id> opens a guide. Normal use needs none of these.
  const params = new URLSearchParams(location.search);
  if (params.get('seed') === 'demo') {
    state.earned = { 2: true, 3: true, 8: true, 9: true, 15: false, 20: true, 21: true, 22: true, 29: true, 36: true, 41: true, 44: true, 52: false };
    delete state.earned[15]; delete state.earned[52];
    state.counts = { 15: 137, 17: 18, 18: 6, 19: 9, 25: 3, 28: 7, 30: 1, 31: 42, 32: 21, 35: 58, 40: 2, 43: 4, 48: 210, 52: 95000, 53: 34000, 54: 3, 55: 4 };
    saveState();
  }
  if (params.get('select')) selectedId = Number(params.get('select'));
  renderAll();
  const view = params.get('view');
  if (view) switchView(view);
  if (params.get('spoiler') === '1') {
    state.spoiler = true;
    document.getElementById('spoiler-toggle').checked = true;
    renderAll();
  }
}

boot();
