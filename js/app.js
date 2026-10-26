// Hitting page.

// [key, label, isExtra]. Extra columns hide until "More stats" is on.
const SEASON_COLS = [
  ['year', 'Year'], ['team', 'Team'], ['age', 'Age', 1], ['g', 'G'], ['ab', 'AB'], ['r', 'R'],
  ['h', 'H'], ['2b', '2B', 1], ['3b', '3B', 1], ['hr', 'HR'], ['rbi', 'RBI'], ['bb', 'BB'],
  ['k', 'K'], ['hb', 'HBP', 1], ['sb', 'SB', 1], ['s', 'SAC', 1], ['avg', 'AVG'], ['obp', 'OBP'],
  ['slg', 'SLG'], ['ops', 'OPS'], ['w', 'W', 1], ['l', 'L', 1], ['note', 'Note'],
];
const CAREER_COLS = [['team', 'Team'], ['years', 'Yrs'], ...SEASON_COLS.slice(3, -1)];
const RATE_KEYS = new Set(['avg', 'obp', 'slg', 'ops']);

let teamSeasons = [];          // one row per team per year
let totalNotes = {};           // year -> note for the combined row
const expanded = new Set();
let expandAll = false;
const seasonSort = { col: 'year', dir: 'asc' };
const careerSort = { col: 'g', dir: 'desc' };

function cell(col, row) {
  const [key, , extra] = col;
  let v = row[key];
  if (RATE_KEYS.has(key)) v = fmtAvg(v);
  else if (key === 'note') v = esc(v || '');
  else if (key === 'team' || key === 'year') v = esc(v);
  else v = num(v);
  const cls = [extra ? 'x' : '', key === 'note' ? 'note' : '', RATE_KEYS.has(key) ? 'rate' : ''].filter(Boolean).join(' ');
  return `<td${cls ? ` class="${cls}"` : ''}>${v}</td>`;
}
function head(cols, sortable = true) {
  return '<tr>' + cols.map(([key, label, extra]) =>
    `<th${sortable && key !== 'note' ? ` data-col="${key}"` : ''}${extra ? ' class="x"' : ''}>${label}</th>`).join('') + '</tr>';
}

// Game-log years: one row per team, summed from that year's games.
function aggregateGames(games, year) {
  const byTeam = {};
  games.forEach(g => (byTeam[g.team] = byTeam[g.team] || []).push(g));
  return Object.entries(byTeam).map(([team, gs]) => {
    const t = sumBatting(gs.map(g => ({ ...g, g: 1, w: resultLetter(g.result) === 'W' ? 1 : 0, l: resultLetter(g.result) === 'L' ? 1 : 0 })),
      { year, team, age: ageFor(year) });
    t.note = SEASON_NOTES[`${year}|${team}`] || '';
    return t;
  });
}

async function init() {
  setupMoreToggle();
  let stored;
  try { stored = await loadJSON('data/personal/seasons.json'); }
  catch (e) { showError('Could not load season stats: ' + e.message); return; }

  const logs = await Promise.all(GAME_YEARS.map(y => tryLoadJSON(`data/personal/games/${y}.json`)));
  const fromLogs = new Set();
  logs.forEach((res, i) => {
    const y = GAME_YEARS[i];
    if (res.data && res.data.length) { teamSeasons.push(...aggregateGames(res.data, y)); fromLogs.add(y); }
    else if (res.error) showError(`Could not load the ${y} game log (${res.error}). Showing stored ${y} totals instead.`);
  });

  // Stored rows: rates are recomputed from the counts so every year uses one formula.
  stored.forEach(r => {
    if (fromLogs.has(r.year)) return;
    if (r.team === 'Total') { totalNotes[r.year] = r.note || ''; return; }
    teamSeasons.push(withRates({ ...r, sf: r.sf || 0 }));
  });
  GAME_YEARS.forEach(y => { if (SEASON_NOTES[`${y}|Total`]) totalNotes[y] = SEASON_NOTES[`${y}|Total`]; });

  populateFilters();
  bindSort(document.querySelector('#seasonTable thead'), seasonSort, renderSeasons);
  bindSort(document.querySelector('#careerTable thead'), careerSort, renderCareer);
  ['yearFilter', 'teamFilter'].forEach(id => document.getElementById(id).addEventListener('change', renderSeasons));
  document.getElementById('expandAll').addEventListener('click', e => {
    expandAll = !expandAll;
    e.target.setAttribute('aria-pressed', String(expandAll));
    e.target.textContent = expandAll ? 'Collapse years' : 'Expand all years';
    renderSeasons();
  });
  document.querySelector('#seasonTable tbody').addEventListener('click', e => {
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

function populateFilters() {
  const years = [...new Set(teamSeasons.map(s => s.year))].sort((a, b) => a - b);
  const teams = [...new Set(teamSeasons.map(s => s.team))].sort();
  const add = (id, vals) => { const sel = document.getElementById(id); vals.forEach(v => sel.add(new Option(v, v))); };
  add('yearFilter', years); add('teamFilter', teams);
}

// One combined line per year; years with several teams list them and can expand.
function yearRows(rows) {
  const byYear = {};
  rows.forEach(r => (byYear[r.year] = byYear[r.year] || []).push(r));
  return Object.entries(byYear).map(([year, teams]) => {
    year = +year;
    teams.sort((a, b) => b.g - a.g);
    if (teams.length === 1) return { ...teams[0], teams };
    const t = sumBatting(teams, { year, age: teams[0].age });
    t.team = teams.map(x => x.team).join(', ');
    t.note = totalNotes[year] || '';
    t.teams = teams;
    return t;
  });
}

function seasonRow(r, opts = {}) {
  const cls = [isChamp(r.note) ? 'champ-row' : '', opts.sub ? 'sub-row' : ''].filter(Boolean).join(' ');
  const cells = SEASON_COLS.map(col => {
    if (col[0] === 'year') {
      if (opts.sub) return '<td></td>';
      if (opts.expandable) {
        const open = opts.open;
        return `<td><button class="expand" data-year="${r.year}" aria-expanded="${open}" aria-label="${open ? 'Hide' : 'Show'} ${r.year} teams">${open ? '▾' : '▸'}</button>${r.year}</td>`;
      }
    }
    if (col[0] === 'team' && r.teams && r.teams.length > 2) {
      // Long team lists push the table wide; show two and a count, all on hover.
      const names = r.teams.map(t => t.team);
      return `<td title="${esc(names.join(', '))}">${esc(names.slice(0, 2).join(', '))} <span class="more-teams">+${names.length - 2}</span></td>`;
    }
    return cell(col, r);
  }).join('');
  return `<tr${cls ? ` class="${cls}"` : ''}>${cells}</tr>`;
}

function renderSeasons() {
  const year = +document.getElementById('yearFilter').value || null;
  const team = document.getElementById('teamFilter').value;
  const rows = teamSeasons.filter(s => (!year || s.year === year) && (!team || s.team === team));
  const thead = document.querySelector('#seasonTable thead');
  thead.innerHTML = head(SEASON_COLS);
  markSort(thead, seasonSort);

  let html = '';
  if (seasonSort.col === 'year' && !team) {
    // Grouped view: one line per year, expandable to its teams.
    sortRows(yearRows(rows), seasonSort).forEach(y => {
      const multi = y.teams.length > 1;
      const open = multi && (expandAll || year != null || expanded.has(y.year));
      html += seasonRow(y, { expandable: multi, open });
      if (open) y.teams.forEach(t => html += seasonRow(t, { sub: true }));
    });
  } else {
    // Sorted by a stat, or one team picked: every team-season stands on its own.
    sortRows(rows.slice(), seasonSort).forEach(r => html += seasonRow(r));
  }
  document.querySelector('#seasonTable tbody').innerHTML =
    html || `<tr><td colspan="${SEASON_COLS.length}" class="empty">No seasons match.</td></tr>`;
}

function renderCareer() {
  const byTeam = {};
  teamSeasons.forEach(s => (byTeam[s.team] = byTeam[s.team] || []).push(s));
  const rows = Object.entries(byTeam).map(([team, ss]) =>
    sumBatting(ss, { team, years: new Set(ss.map(s => s.year)).size }));
  const thead = document.querySelector('#careerTable thead');
  thead.innerHTML = head(CAREER_COLS);
  markSort(thead, careerSort);
  document.querySelector('#careerTable tbody').innerHTML =
    sortRows(rows, careerSort).map(r => `<tr>${CAREER_COLS.map(c => cell(c, r)).join('')}</tr>`).join('');
  const total = sumBatting(teamSeasons, { team: 'Career', years: new Set(teamSeasons.map(s => s.year)).size });
  document.querySelector('#careerTable tfoot').innerHTML =
    `<tr class="total-row">${CAREER_COLS.map(c => cell(c, total)).join('')}</tr>`;
}

function renderHero() {
  const year = Math.max(...teamSeasons.map(s => s.year));
  const t = sumBatting(teamSeasons.filter(s => s.year === year));
  document.getElementById('heroTitle').textContent = `${year} season`;
  document.getElementById('heroCard').innerHTML = [
    ['Games', t.g], ['AVG', fmtAvg(t.avg)], ['OBP', fmtAvg(t.obp)], ['SLG', fmtAvg(t.slg)],
    ['HR', t.hr], ['RBI', t.rbi], ['Runs', t.r],
  ].map(([l, v]) => `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');
}

init();
