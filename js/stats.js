// Shared stat math and rendering helpers. Every page loads this after config.js,
// so a formula changed here changes everywhere.

// ---------- Innings ----------
// Innings are stored in baseball notation: 5.1 = 5 1/3, 5.2 = 5 2/3. Do all math in
// outs, or 5.1 + 0.2 comes out 5.3 instead of 6.0.
function ipToOuts(ip) {
  const whole = Math.trunc(ip || 0);
  return whole * 3 + Math.round(((ip || 0) - whole) * 10);
}
function outsToIp(outs) { return Math.trunc(outs / 3) + (outs % 3) / 10; }
function fmtOuts(outs) { return Math.trunc(outs / 3) + '.' + (outs % 3); }

// ---------- Rates ----------
// A rate over zero innings is undefined, not zero: Infinity when something was
// allowed (a pitcher who got nobody out), null when nothing happened at all.
function rate(numerator, innings) {
  if (innings > 0) return numerator / innings;
  return numerator > 0 ? Infinity : null;
}
function fmtRate(v) {
  if (v == null) return '-';
  return Number.isFinite(v) ? v.toFixed(2) : 'INF';
}
function eraOf(er, outs) { return rate(er * ERA_INNINGS, outs / 3); }
function whipOf(h, bb, outs) { return rate(h + bb, outs / 3); }

// Batting rates. HBP is `hb` in the personal data and `hbp` in box scores.
function hbpOf(t) { return t.hb != null ? t.hb : (t.hbp || 0); }
function avgOf(t) { return t.ab ? t.h / t.ab : null; }
// OBP = (H + BB + HBP) / (AB + BB + HBP + SF). Sac flies count against it; bunts don't.
function obpOf(t) {
  const hbp = hbpOf(t), d = t.ab + t.bb + hbp + (t.sf || 0);
  return d ? (t.h + t.bb + hbp) / d : null;
}
function slgOf(t) { return t.ab ? (t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr) / t.ab : null; }
function withRates(t) {
  t.avg = avgOf(t); t.obp = obpOf(t); t.slg = slgOf(t);
  t.ops = t.obp == null && t.slg == null ? null : (t.obp || 0) + (t.slg || 0);
  return t;
}
// Baseball style: .432, not 0.432. OPS of 1.039 keeps its leading digit.
function fmtAvg(v) {
  if (v == null) return '-';
  const s = v.toFixed(3);
  return s.startsWith('0') ? s.slice(1) : s;
}

// ---------- Sums ----------
const BAT_KEYS = ['g', 'ab', 'r', 'h', '2b', '3b', 'hr', 'rbi', 'bb', 'k', 'hb', 'sb', 's', 'sf', 'w', 'l'];
function emptyBatting(extra) { const t = { ...extra }; BAT_KEYS.forEach(k => t[k] = 0); return t; }
function sumBatting(rows, extra) {
  const t = emptyBatting(extra);
  rows.forEach(r => BAT_KEYS.forEach(k => t[k] += r[k] || 0));
  return withRates(t);
}

const PITCH_KEYS = ['g', 'gs', 'w', 'l', 's', 'cg', 'sho', 'h', 'r', 'er', 'bb', 'k'];
function emptyPitching(extra) { const t = { ...extra, outs: 0 }; PITCH_KEYS.forEach(k => t[k] = 0); return t; }
function pitchRates(t) {
  t.ip = outsToIp(t.outs); t.era = eraOf(t.er, t.outs); t.whip = whipOf(t.h, t.bb, t.outs);
  return t;
}
// Rows are season lines carrying `ip` in notation (or `outs` if already summed).
function sumPitching(rows, extra) {
  const t = emptyPitching(extra);
  rows.forEach(r => {
    PITCH_KEYS.forEach(k => t[k] += r[k] || 0);
    t.outs += r.outs != null ? r.outs : ipToOuts(r.ip);
  });
  return pitchRates(t);
}

// ---------- Results ----------
// Results are "W 6-4" with our score first.
function resultLetter(result) { const m = /^\s*([WLT])/.exec(result || ''); return m ? m[1] : ''; }
function resultHtml(result) {
  const m = /^\s*([WLT])\s*(.*)$/.exec(result || '');
  if (!m) return esc(result || '');
  return `<span class="res res-${m[1].toLowerCase()}">${m[1]}</span> ${esc(m[2])}`;
}

// ---------- Time ----------
// "9:00am" -> 540. Text sorting puts "1:30pm" before "9:00am", so sort on this.
function timeMinutes(str) {
  const m = /(\d+):(\d+)\s*(am|pm)/i.exec(str || '');
  if (!m) return null;
  return (+m[1] % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + +m[2];
}
function gameKey(g) {
  const t = timeMinutes(g.time);
  return g.date + ' ' + String(t == null ? 9999 : t).padStart(4, '0');
}

// ---------- HTML ----------
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Zeros are rendered dim so the real numbers stand out.
function num(v) { return v === 0 ? '<span class="zero">0</span>' : (v == null ? '-' : v); }
function ageFor(year) { return year - BIRTH_YEAR; }
function isChamp(note) { const n = (note || '').toLowerCase(); return n.includes('champ') && !n.startsWith('lost') && n !== 'lost champ'; }

// ---------- Loading ----------
async function loadJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} (HTTP ${res.status})`);
  return res.json();
}
// For files that may legitimately be missing. Returns { data, error }.
async function tryLoadJSON(url) {
  try { return { data: await loadJSON(url) }; }
  catch (e) { return { data: null, error: e.message }; }
}
function showError(msg) {
  const main = document.querySelector('main');
  const div = document.createElement('div');
  div.className = 'error-banner';
  div.setAttribute('role', 'alert');
  div.textContent = msg;
  main.insertBefore(div, main.firstChild);
}

// ---------- Sorting ----------
// Numbers compare numerically, text alphabetically; null sorts lowest and
// Infinity highest without producing NaN.
function cmpVal(a, b) {
  if (typeof a === 'string' || typeof b === 'string') return String(a ?? '').localeCompare(String(b ?? ''));
  const x = a == null ? -Infinity : a, y = b == null ? -Infinity : b;
  return x === y ? 0 : (x < y ? -1 : 1);
}
// Lower is better for these, so their first click sorts ascending.
const ASC_FIRST = new Set(['era', 'whip', 'k', 'l', 'label', 'team', 'name', 'year', 'date', 'opponent', 'field']);

// Wires th[data-col] headers in `thead` to `state` ({ col, dir }) and calls `render`.
// Headers become keyboard-focusable and announce their sort via aria-sort.
function bindSort(thead, state, render) {
  const activate = th => {
    const col = th.dataset.col;
    if (state.col === col) state.dir = state.dir === 'asc' ? 'desc' : 'asc';
    else { state.col = col; state.dir = ASC_FIRST.has(col) ? 'asc' : 'desc'; }
    render();
  };
  thead.addEventListener('click', e => { const th = e.target.closest('th[data-col]'); if (th) activate(th); });
  thead.addEventListener('keydown', e => {
    const th = e.target.closest('th[data-col]');
    if (th && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); activate(th); }
  });
}
function markSort(thead, state) {
  thead.querySelectorAll('th[data-col]').forEach(th => {
    th.tabIndex = 0;
    th.classList.add('sortable');
    const on = th.dataset.col === state.col;
    th.classList.toggle('sort-asc', on && state.dir === 'asc');
    th.classList.toggle('sort-desc', on && state.dir === 'desc');
    th.setAttribute('aria-sort', on ? (state.dir === 'asc' ? 'ascending' : 'descending') : 'none');
  });
}
function sortRows(rows, state) {
  const sign = state.dir === 'asc' ? 1 : -1;
  return rows.sort((a, b) => sign * cmpVal(a[state.col], b[state.col]));
}

// ---------- "More stats" toggle ----------
// Columns marked class="x" are secondary and hidden until the toggle is on. The
// choice is remembered across pages.
function setupMoreToggle() {
  const btn = document.getElementById('moreToggle');
  if (!btn) return;
  const apply = on => {
    document.body.classList.toggle('show-more', on);
    btn.setAttribute('aria-pressed', String(on));
    btn.textContent = on ? 'Fewer stats' : 'More stats';
  };
  apply(localStorage.getItem('showMore') === '1');
  btn.addEventListener('click', () => {
    const on = !document.body.classList.contains('show-more');
    localStorage.setItem('showMore', on ? '1' : '0');
    apply(on);
  });
}
