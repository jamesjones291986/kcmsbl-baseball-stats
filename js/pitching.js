// Pitching page.

const P_COLS = [
  ['year', 'Year'], ['team', 'Team'], ['age', 'Age', 1], ['g', 'G'], ['gs', 'GS'], ['w', 'W'],
  ['l', 'L'], ['s', 'SV'], ['ip', 'IP'], ['h', 'H'], ['r', 'R'], ['er', 'ER'], ['bb', 'BB'],
  ['k', 'K'], ['era', 'ERA'], ['whip', 'WHIP'], ['cg', 'CG', 1], ['sho', 'SHO', 1],
];
const P_CAREER_COLS = [['team', 'Team'], ['years', 'Yrs'], ...P_COLS.slice(3)];

let teamSeasons = [];
const expanded = new Set();
let expandAll = false;
const seasonSort = { col: 'year', dir: 'asc' };
const careerSort = { col: 'ip', dir: 'desc' };

function pcell([key, , extra], row) {
  let v = row[key];
  if (key === 'era' || key === 'whip') v = fmtRate(v);
  else if (key === 'ip') v = fmtOuts(row.outs);
  else if (key === 'team' || key === 'year') v = esc(v);
  else v = num(v);
  return `<td${extra ? ' class="x"' : ''}>${v}</td>`;
}
function phead(cols) {
  return '<tr>' + cols.map(([key, label, extra]) => `<th data-col="${key}"${extra ? ' class="x"' : ''}>${label}</th>`).join('') + '</tr>';
}

function aggregatePitching(games, year) {
  const byTeam = {};
  games.filter(g => g.pitching).forEach(g => (byTeam[g.team] = byTeam[g.team] || []).push({ ...g.pitching, g: 1 }));
  return Object.entries(byTeam).map(([team, lines]) => sumPitching(lines, { year, team, age: ageFor(year) }));
}

async function init() {
  setupMoreToggle();
  let stored;
  try { stored = await loadJSON('data/personal/pitching.json'); }
  catch (e) { showError('Could not load pitching stats: ' + e.message); return; }

  const logs = await Promise.all(GAME_YEARS.map(y => tryLoadJSON(`data/personal/games/${y}.json`)));
  const fromLogs = new Set();
  logs.forEach((res, i) => {
    const y = GAME_YEARS[i];
    if (res.data && res.data.length) { teamSeasons.push(...aggregatePitching(res.data, y)); fromLogs.add(y); }
    else if (res.error) showError(`Could not load the ${y} game log (${res.error}). Showing stored ${y} totals instead.`);
  });
  // Stored ERA/WHIP/IP totals are ignored; everything is recomputed from the counts.
  stored.forEach(r => {
    if (fromLogs.has(r.year) || r.team === 'Total') return;
    teamSeasons.push(sumPitching([r], { year: r.year, team: r.team, age: r.age }));
  });

  bindSort(document.querySelector('#pitchingTable thead'), seasonSort, renderSeasons);
  bindSort(document.querySelector('#pitchingCareerTable thead'), careerSort, renderCareer);
  document.getElementById('expandAll').addEventListener('click', e => {
    expandAll = !expandAll;
    e.target.setAttribute('aria-pressed', String(expandAll));
    e.target.textContent = expandAll ? 'Collapse years' : 'Expand all years';
    renderSeasons();
  });
  document.querySelector('#pitchingTable tbody').addEventListener('click', e => {
    const btn = e.target.closest('button.expand');
    if (!btn) return;
    const y = +btn.dataset.year;
    expanded.has(y) ? expanded.delete(y) : expanded.add(y);
    renderSeasons();
  });

  renderHero();
  renderSeasons();
  renderCareer();
}

function yearRows() {
  const byYear = {};
  teamSeasons.forEach(r => (byYear[r.year] = byYear[r.year] || []).push(r));
  return Object.entries(byYear).map(([year, teams]) => {
    year = +year;
    teams.sort((a, b) => b.outs - a.outs);
    if (teams.length === 1) return { ...teams[0], teams };
    const t = sumPitching(teams, { year, age: teams[0].age });
    t.team = teams.map(x => x.team).join(', ');
    t.teams = teams;
    return t;
  });
}

function row(r, opts = {}) {
  const cells = P_COLS.map(col => {
    if (col[0] === 'year') {
      if (opts.sub) return '<td></td>';
      if (opts.expandable) return `<td><button class="expand" data-year="${r.year}" aria-expanded="${opts.open}" aria-label="${opts.open ? 'Hide' : 'Show'} ${r.year} teams">${opts.open ? '▾' : '▸'}</button>${r.year}</td>`;
    }
    if (col[0] === 'team' && r.teams && r.teams.length > 2) {
      const names = r.teams.map(t => t.team);
      return `<td title="${esc(names.join(', '))}">${esc(names.slice(0, 2).join(', '))} <span class="more-teams">+${names.length - 2}</span></td>`;
    }
    return pcell(col, r);
  }).join('');
  return `<tr${opts.sub ? ' class="sub-row"' : ''}>${cells}</tr>`;
}

function renderSeasons() {
  const thead = document.querySelector('#pitchingTable thead');
  thead.innerHTML = phead(P_COLS);
  markSort(thead, seasonSort);
  let html = '';
  if (seasonSort.col === 'year') {
    sortRows(yearRows(), seasonSort).forEach(y => {
      const multi = y.teams.length > 1, open = multi && (expandAll || expanded.has(y.year));
      html += row(y, { expandable: multi, open });
      if (open) y.teams.forEach(t => html += row(t, { sub: true }));
    });
  } else {
    sortRows(teamSeasons.slice(), seasonSort).forEach(r => html += row(r));
  }
  document.querySelector('#pitchingTable tbody').innerHTML = html;
}

function renderCareer() {
  const byTeam = {};
  teamSeasons.forEach(s => (byTeam[s.team] = byTeam[s.team] || []).push(s));
  const rows = Object.entries(byTeam).map(([team, ss]) => sumPitching(ss, { team, years: new Set(ss.map(s => s.year)).size }));
  const thead = document.querySelector('#pitchingCareerTable thead');
  thead.innerHTML = phead(P_CAREER_COLS);
  markSort(thead, careerSort);
  document.querySelector('#pitchingCareerTable tbody').innerHTML =
    sortRows(rows, careerSort).map(r => `<tr>${P_CAREER_COLS.map(c => pcell(c, r)).join('')}</tr>`).join('');
  const total = sumPitching(teamSeasons, { team: 'Career', years: new Set(teamSeasons.map(s => s.year)).size });
  document.querySelector('#pitchingCareerTable tfoot').innerHTML =
    `<tr class="total-row">${P_CAREER_COLS.map(c => pcell(c, total)).join('')}</tr>`;
}

function renderHero() {
  const year = Math.max(...teamSeasons.map(s => s.year));
  const t = sumPitching(teamSeasons.filter(s => s.year === year));
  document.getElementById('heroTitle').textContent = `${year} season`;
  document.getElementById('heroCard').innerHTML = [
    ['Games', t.g], ['W-L', `${t.w}-${t.l}`], ['ERA', fmtRate(t.era)], ['WHIP', fmtRate(t.whip)],
    ['IP', fmtOuts(t.outs)], ['K', t.k], ['BB', t.bb],
  ].map(([l, v]) => `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
}

init();
