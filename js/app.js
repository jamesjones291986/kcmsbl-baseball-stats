let seasons = [];
let sortCol = 'year';
let sortAsc = true;

async function init() {
  const res = await fetch('data/personal/seasons.json');
  seasons = await res.json();
  populateFilters();
  renderSeasons();
  renderCareer();
  renderTotals();

  document.getElementById('yearFilter').addEventListener('change', renderSeasons);
  document.getElementById('teamFilter').addEventListener('change', renderSeasons);
  document.getElementById('hideTotals').addEventListener('change', renderSeasons);

  document.querySelectorAll('#seasonTable th').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col, 'seasonTable'));
  });
  document.querySelectorAll('#careerTable th').forEach(th => {
    th.addEventListener('click', () => sortTable(th.dataset.col, 'careerTable'));
  });
}

function populateFilters() {
  const years = [...new Set(seasons.map(s => s.year))].sort();
  const teams = [...new Set(seasons.filter(s => s.team !== 'Total').map(s => s.team))].sort();

  const yf = document.getElementById('yearFilter');
  years.forEach(y => { const o = document.createElement('option'); o.value = y; o.textContent = y; yf.appendChild(o); });

  const tf = document.getElementById('teamFilter');
  teams.forEach(t => { const o = document.createElement('option'); o.value = t; o.textContent = t; tf.appendChild(o); });
}

function getFiltered() {
  const year = document.getElementById('yearFilter').value;
  const team = document.getElementById('teamFilter').value;
  const hideTotals = document.getElementById('hideTotals').checked;

  return seasons.filter(s => {
    if (hideTotals && s.team === 'Total') return false;
    if (year && s.year !== +year) return false;
    if (team && s.team !== team && s.team !== 'Total') return false;
    return true;
  });
}

function fmt(val, decimals) {
  if (val == null) return '-';
  return decimals ? val.toFixed(3) : val;
}

function renderSeasons() {
  const data = getFiltered();
  const tbody = document.querySelector('#seasonTable tbody');
  tbody.innerHTML = data.map(s => {
    const cls = [];
    if (s.team === 'Total') cls.push('total-row');
    if (s.note && s.note.toLowerCase().includes('champ') && !s.note.toLowerCase().includes('lost')) cls.push('champ-row');
    return `<tr class="${cls.join(' ')}">
      <td>${s.year}</td><td>${s.team}</td><td>${s.age}</td>
      <td>${s.g}</td><td>${fmt(s.avg, 3)}</td><td>${s.h}</td>
      <td>${s.ab}</td><td>${s.hr}</td><td>${s.rbi}</td>
      <td>${fmt(s.obp, 3)}</td><td>${fmt(s.slg, 3)}</td><td>${fmt(s.ops, 3)}</td>
      <td>${s['2b']}</td><td>${s['3b']}</td><td>${s.sb}</td>
      <td>${s.r}</td><td>${s.bb}</td><td>${s.k}</td>
      <td>${s.hb}</td><td>${s.s}</td>
      <td>${s.w}</td><td>${s.l}</td><td style="text-align:left">${s.note || ''}</td>
    </tr>`;
  }).join('');
}

function calcCareer() {
  const indiv = seasons.filter(s => s.team !== 'Total');
  const teams = {};
  indiv.forEach(s => {
    if (!teams[s.team]) teams[s.team] = { team: s.team, yearsSet: new Set(), g:0, h:0, ab:0, hr:0, rbi:0, '3b':0, '2b':0, sb:0, at:0, s:0, r:0, k:0, bb:0, hb:0, w:0, l:0 };
    const t = teams[s.team];
    t.yearsSet.add(s.year);
    ['g','h','ab','hr','rbi','3b','2b','sb','at','s','r','k','bb','hb','w','l'].forEach(k => t[k] += s[k] || 0);
  });
  return Object.values(teams).map(t => {
    t.years = t.yearsSet.size;
    t.avg = t.ab ? t.h / t.ab : 0;
    t.obp = (t.ab + t.bb + t.hb) ? (t.h + t.bb + t.hb) / (t.ab + t.bb + t.hb) : 0;
    const tb = t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr;
    t.slg = t.ab ? tb / t.ab : 0;
    t.ops = t.obp + t.slg;
    t.sbPct = t.at ? (t.sb / t.at) * 100 : null;
    delete t.yearsSet;
    return t;
  });
}

function renderCareer() {
  const data = calcCareer();
  const tbody = document.querySelector('#careerTable tbody');
  tbody.innerHTML = data.map(t => `<tr>
    <td>${t.team}</td><td>${t.years}</td><td>${t.g}</td>
    <td>${fmt(t.avg, 3)}</td><td>${t.h}</td><td>${t.ab}</td>
    <td>${t.hr}</td><td>${t.rbi}</td><td>${fmt(t.obp, 3)}</td>
    <td>${fmt(t.slg, 3)}</td><td>${fmt(t.ops, 3)}</td>
    <td>${t['2b']}</td><td>${t['3b']}</td><td>${t.sb}</td>
    <td>${t.r}</td><td>${t.bb}</td><td>${t.k}</td>
    <td>${t.hb}</td><td>${t.s}</td>
    <td>${t.w}</td><td>${t.l}</td>
  </tr>`).join('');
}

function renderTotals() {
  const indiv = seasons.filter(s => s.team !== 'Total');
  const t = { g:0, h:0, ab:0, hr:0, rbi:0, '3b':0, '2b':0, sb:0, at:0, s:0, r:0, k:0, bb:0, hb:0, w:0, l:0 };
  const yearsSet = new Set();
  indiv.forEach(s => {
    yearsSet.add(s.year);
    Object.keys(t).forEach(k => t[k] += s[k] || 0);
  });
  t.avg = t.ab ? t.h / t.ab : 0;
  t.obp = (t.ab + t.bb + t.hb) ? (t.h + t.bb + t.hb) / (t.ab + t.bb + t.hb) : 0;
  const tb = t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr;
  t.slg = t.ab ? tb / t.ab : 0;
  t.ops = t.obp + t.slg;

  const cards = [
    ['Years', yearsSet.size], ['Games', t.g], ['AVG', t.avg.toFixed(3)],
    ['Hits', t.h], ['AB', t.ab], ['HR', t.hr], ['RBI', t.rbi],
    ['OBP', t.obp.toFixed(3)], ['SLG', t.slg.toFixed(3)], ['OPS', t.ops.toFixed(3)],
    ['2B', t['2b']], ['3B', t['3b']], ['SB', t.sb], ['Runs', t.r],
    ['BB', t.bb], ['K', t.k], ['HBP', t.hb], ['SAC', t.s],
    ['Wins', t.w], ['Losses', t.l]
  ];

  document.getElementById('totalsCard').innerHTML = cards.map(([label, val]) =>
    `<div class="stat-card"><div class="label">${label}</div><div class="value">${val}</div></div>`
  ).join('');
}

function sortTable(col, tableId) {
  if (sortCol === col) sortAsc = !sortAsc;
  else { sortCol = col; sortAsc = true; }

  const table = document.getElementById(tableId);
  table.querySelectorAll('th').forEach(th => th.classList.remove('sort-asc', 'sort-desc'));
  const th = table.querySelector(`th[data-col="${col}"]`);
  if (th) th.classList.add(sortAsc ? 'sort-asc' : 'sort-desc');

  if (tableId === 'seasonTable') {
    const data = getFiltered().sort((a, b) => {
      const av = a[col] ?? '', bv = b[col] ?? '';
      const cmp = typeof av === 'string' ? av.localeCompare(bv) : av - bv;
      return sortAsc ? cmp : -cmp;
    });
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    renderSeasons();
  }
}

init();
