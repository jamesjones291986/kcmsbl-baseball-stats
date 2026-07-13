let seasons = [];
let pitching = [];
let sortCol = 'year';
let sortAsc = true;

// GAME_YEARS loaded from js/config.js

function aggregateGames(games, year) {
  const teams = {};
  games.forEach(g => {
    if (!teams[g.team]) teams[g.team] = { year, team: g.team, age: 40, g:0, h:0, ab:0, hr:0, rbi:0, '2b':0, '3b':0, sb:0, at:0, s:0, r:0, k:0, bb:0, hb:0, w:0, l:0, note:'', additional:'' };
    const t = teams[g.team];
    t.g++;
    ['h','ab','hr','rbi','2b','3b','sb','s','r','k','bb','hb'].forEach(k => t[k] += g[k] || 0);
    if (g.result) {
      if (g.result.startsWith('W')) t.w++;
      else if (g.result.startsWith('L')) t.l++;
    }
  });
  const rows = Object.values(teams).map(t => {
    t.avg = t.ab ? t.h / t.ab : 0;
    t.obp = (t.ab + t.bb + t.hb) ? (t.h + t.bb + t.hb) / (t.ab + t.bb + t.hb) : 0;
    const tb = t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr;
    t.slg = t.ab ? tb / t.ab : 0;
    t.ops = t.obp + t.slg;
    return t;
  });
  if (rows.length > 1) {
    const total = { year, team: 'Total', age: rows[0].age, g:0, h:0, ab:0, hr:0, rbi:0, '2b':0, '3b':0, sb:0, at:0, s:0, r:0, k:0, bb:0, hb:0, w:0, l:0, note:'', additional:'' };
    rows.forEach(r => ['g','h','ab','hr','rbi','2b','3b','sb','at','s','r','k','bb','hb','w','l'].forEach(k => total[k] += r[k]));
    total.avg = total.ab ? total.h / total.ab : 0;
    total.obp = (total.ab + total.bb + total.hb) ? (total.h + total.bb + total.hb) / (total.ab + total.bb + total.hb) : 0;
    const tb = total.h + total['2b'] + 2 * total['3b'] + 3 * total.hr;
    total.slg = total.ab ? tb / total.ab : 0;
    total.ops = total.obp + total.slg;
    rows.push(total);
  }
  return rows;
}

function aggregatePitching(games, year) {
  const teams = {};
  games.forEach(g => {
    if (!g.pitching) return;
    const p = g.pitching;
    if (!teams[g.team]) teams[g.team] = { year, team: g.team, age: 40, g:0, ip:0, h:0, er:0, r:0, k:0, bb:0, w:0, l:0, s:0, gs:0, cg:0, sho:0 };
    const t = teams[g.team];
    t.g++;
    t.ip += p.ip || 0;
    t.h += p.h || 0;
    t.r += p.r || 0;
    t.er += p.er || 0;
    t.k += p.k || 0;
    t.bb += p.bb || 0;
    if (p.w) t.w++;
    if (p.l) t.l++;
    if (p.s) t.s++;
    if (p.gs) t.gs++;
  });
  const rows = Object.values(teams).map(t => {
    t.era = t.ip > 0 ? +((t.er / (t.ip / 7)).toFixed(2)) : 0;
    t.whip = t.ip > 0 ? +(((t.h + t.bb) / t.ip).toFixed(2)) : 0;
    return t;
  });
  if (rows.length > 1) {
    const total = { year, team: 'Total', age: rows[0].age, g:0, ip:0, h:0, er:0, r:0, k:0, bb:0, w:0, l:0, s:0, gs:0, cg:0, sho:0 };
    rows.forEach(r => ['g','ip','h','er','r','k','bb','w','l','s','gs','cg','sho'].forEach(k => total[k] += r[k]));
    total.era = total.ip > 0 ? +((total.er / (total.ip / 7)).toFixed(2)) : 0;
    total.whip = total.ip > 0 ? +(((total.h + total.bb) / total.ip).toFixed(2)) : 0;
    rows.push(total);
  }
  return rows;
}

async function init() {
  const [seasonsRes, pitchingRes] = await Promise.all([
    fetch('data/personal/seasons.json'),
    fetch('data/personal/pitching.json')
  ]);
  seasons = (await seasonsRes.json()).filter(s => !GAME_YEARS.includes(s.year));
  pitching = (await pitchingRes.json()).filter(p => !GAME_YEARS.includes(p.year));

  const gameResults = await Promise.all(GAME_YEARS.map(y =>
    fetch(`data/personal/games/${y}.json`).then(r => r.ok ? r.json() : []).catch(() => [])
  ));
  GAME_YEARS.forEach((y, i) => {
    if (gameResults[i].length) {
      seasons.push(...aggregateGames(gameResults[i], y));
      pitching.push(...aggregatePitching(gameResults[i], y));
    }
  });
  seasons.sort((a, b) => a.year - b.year || (a.team === 'Total' ? 1 : b.team === 'Total' ? -1 : a.team.localeCompare(b.team)));
  populateFilters();
  renderSeasons();
  renderCareer();
  renderTotals();
  renderHero();

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
  const showAll = document.getElementById('hideTotals').checked;

  return seasons.filter(s => {
    if (year && s.year !== +year) return false;
    if (team && s.team !== team && s.team !== 'Total') return false;
    return true;
  });
}

let expandedYears = new Set();

function toggleYear(year) {
  if (expandedYears.has(year)) expandedYears.delete(year);
  else expandedYears.add(year);
  renderSeasons();
}

function fmt(val, decimals) {
  if (val == null) return '-';
  return decimals ? val.toFixed(3) : val;
}

function renderSeasons() {
  const data = getFiltered();
  const showAll = document.getElementById('hideTotals').checked;
  const tbody = document.querySelector('#seasonTable tbody');

  // Group by year
  const byYear = {};
  data.forEach(s => {
    if (!byYear[s.year]) byYear[s.year] = { total: null, teams: [] };
    if (s.team === 'Total') byYear[s.year].total = s;
    else byYear[s.year].teams.push(s);
  });

  let html = '';
  Object.keys(byYear).sort((a, b) => a - b).forEach(year => {
    const { total, teams } = byYear[year];
    const hasMultipleTeams = teams.length > 1 && total;
    const expanded = expandedYears.has(+year) || showAll;

    if (hasMultipleTeams && !expanded) {
      // Show only the total row, clickable to expand
      const cls = ['total-row', 'expandable'];
      if (total.note && total.note.toLowerCase().includes('champ') && !total.note.toLowerCase().includes('lost')) cls.push('champ-row');
      html += `<tr class="${cls.join(' ')}" onclick="toggleYear(${year})" style="cursor:pointer">
        <td>▶ ${total.year}</td><td>${total.team}</td><td>${total.age}</td>
        <td>${total.g}</td><td>${fmt(total.avg, 3)}</td><td>${total.h}</td>
        <td>${total.ab}</td><td>${total.hr}</td><td>${total.rbi}</td>
        <td>${fmt(total.obp, 3)}</td><td>${fmt(total.slg, 3)}</td><td>${fmt(total.ops, 3)}</td>
        <td>${total['2b']}</td><td>${total['3b']}</td><td>${total.sb}</td>
        <td>${total.r}</td><td>${total.bb}</td><td>${total.k}</td>
        <td>${total.hb}</td><td>${total.s}</td>
        <td>${total.w}</td><td>${total.l}</td><td style="text-align:left">${total.note || ''}</td>
      </tr>`;
    } else if (hasMultipleTeams && expanded) {
      // Show total row (expanded indicator) then team rows
      const cls = ['total-row', 'expandable'];
      if (total.note && total.note.toLowerCase().includes('champ') && !total.note.toLowerCase().includes('lost')) cls.push('champ-row');
      html += `<tr class="${cls.join(' ')}" onclick="toggleYear(${year})" style="cursor:pointer">
        <td>▼ ${total.year}</td><td>${total.team}</td><td>${total.age}</td>
        <td>${total.g}</td><td>${fmt(total.avg, 3)}</td><td>${total.h}</td>
        <td>${total.ab}</td><td>${total.hr}</td><td>${total.rbi}</td>
        <td>${fmt(total.obp, 3)}</td><td>${fmt(total.slg, 3)}</td><td>${fmt(total.ops, 3)}</td>
        <td>${total['2b']}</td><td>${total['3b']}</td><td>${total.sb}</td>
        <td>${total.r}</td><td>${total.bb}</td><td>${total.k}</td>
        <td>${total.hb}</td><td>${total.s}</td>
        <td>${total.w}</td><td>${total.l}</td><td style="text-align:left">${total.note || ''}</td>
      </tr>`;
      teams.forEach(s => {
        const tcls = [];
        if (s.note && s.note.toLowerCase().includes('champ') && !s.note.toLowerCase().includes('lost')) tcls.push('champ-row');
        html += `<tr class="${tcls.join(' ')}" style="background:#1a1a2e">
          <td></td><td>${s.team}</td><td>${s.age}</td>
          <td>${s.g}</td><td>${fmt(s.avg, 3)}</td><td>${s.h}</td>
          <td>${s.ab}</td><td>${s.hr}</td><td>${s.rbi}</td>
          <td>${fmt(s.obp, 3)}</td><td>${fmt(s.slg, 3)}</td><td>${fmt(s.ops, 3)}</td>
          <td>${s['2b']}</td><td>${s['3b']}</td><td>${s.sb}</td>
          <td>${s.r}</td><td>${s.bb}</td><td>${s.k}</td>
          <td>${s.hb}</td><td>${s.s}</td>
          <td>${s.w}</td><td>${s.l}</td><td style="text-align:left">${s.note || ''}</td>
        </tr>`;
      });
    } else {
      // Single team year — just show the team row
      teams.forEach(s => {
        const cls = [];
        if (s.note && s.note.toLowerCase().includes('champ') && !s.note.toLowerCase().includes('lost')) cls.push('champ-row');
        html += `<tr class="${cls.join(' ')}">
          <td>${s.year}</td><td>${s.team}</td><td>${s.age}</td>
          <td>${s.g}</td><td>${fmt(s.avg, 3)}</td><td>${s.h}</td>
          <td>${s.ab}</td><td>${s.hr}</td><td>${s.rbi}</td>
          <td>${fmt(s.obp, 3)}</td><td>${fmt(s.slg, 3)}</td><td>${fmt(s.ops, 3)}</td>
          <td>${s['2b']}</td><td>${s['3b']}</td><td>${s.sb}</td>
          <td>${s.r}</td><td>${s.bb}</td><td>${s.k}</td>
          <td>${s.hb}</td><td>${s.s}</td>
          <td>${s.w}</td><td>${s.l}</td><td style="text-align:left">${s.note || ''}</td>
        </tr>`;
      });
    }
  });
  tbody.innerHTML = html;
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

function fmtIP(ip) {
  const whole = Math.floor(ip);
  const frac = Math.round((ip - whole) * 10);
  if (frac === 3) return whole + '.1';
  if (frac === 7) return whole + '.2';
  return ip % 1 === 0 ? whole + '.0' : ip.toFixed(1);
}

let expandedPitchingYears = new Set();

function togglePitchingYear(year) {
  if (expandedPitchingYears.has(year)) expandedPitchingYears.delete(year);
  else expandedPitchingYears.add(year);
  renderPitching();
}

function renderPitching() {
  const showAll = document.getElementById('hidePitchingTotals').checked;
  const tbody = document.querySelector('#pitchingTable tbody');

  const byYear = {};
  pitching.forEach(s => {
    if (!byYear[s.year]) byYear[s.year] = { total: null, teams: [] };
    if (s.team === 'Total') byYear[s.year].total = s;
    else byYear[s.year].teams.push(s);
  });

  let html = '';
  Object.keys(byYear).sort((a, b) => a - b).forEach(year => {
    const { total, teams } = byYear[year];
    const hasMultipleTeams = teams.length > 1 && total;
    const expanded = expandedPitchingYears.has(+year) || showAll;

    const renderRow = (s, prefix, clickable) => {
      const cls = clickable ? 'total-row expandable' : '';
      const style = clickable ? 'cursor:pointer' : (!prefix ? 'background:#1a1a2e' : '');
      const onclick = clickable ? `onclick="togglePitchingYear(${year})"` : '';
      return `<tr class="${cls}" style="${style}" ${onclick}>
        <td>${prefix || ''}${prefix ? ' ' + s.year : s.year}</td><td>${s.team}</td><td>${s.age}</td>
        <td>${s.g}</td><td>${s.era.toFixed(2)}</td><td>${s.w}</td>
        <td>${s.l}</td><td>${s.s}</td><td>${s.whip.toFixed(2)}</td>
        <td>${fmtIP(s.ip)}</td><td>${s.gs}</td><td>${s.cg}</td>
        <td>${s.sho}</td><td>${s.er}</td><td>${s.r}</td>
        <td>${s.k}</td><td>${s.bb}</td><td>${s.h}</td>
      </tr>`;
    };

    if (hasMultipleTeams && !expanded) {
      html += renderRow(total, '▶', true);
    } else if (hasMultipleTeams && expanded) {
      html += renderRow(total, '▼', true);
      teams.forEach(s => { html += renderRow(s, '', false); });
    } else {
      teams.forEach(s => { html += renderRow(s, '', false); });
    }
  });
  tbody.innerHTML = html;
}

function renderPitchingCareer() {
  const indiv = pitching.filter(s => s.team !== 'Total');
  const teams = {};
  indiv.forEach(s => {
    if (!teams[s.team]) teams[s.team] = { team: s.team, yearsSet: new Set(), g:0, w:0, l:0, s:0, ip:0, gs:0, cg:0, sho:0, er:0, r:0, k:0, bb:0, h:0 };
    const t = teams[s.team];
    t.yearsSet.add(s.year);
    ['g','w','l','s','ip','gs','cg','sho','er','r','k','bb','h'].forEach(k => t[k] += s[k] || 0);
  });
  const data = Object.values(teams).map(t => {
    t.years = t.yearsSet.size;
    t.era = t.ip ? (t.er * 7) / t.ip : 0;
    t.whip = t.ip ? (t.bb + t.h) / t.ip : 0;
    delete t.yearsSet;
    return t;
  });
  const tbody = document.querySelector('#pitchingCareerTable tbody');
  tbody.innerHTML = data.map(t => `<tr>
    <td>${t.team}</td><td>${t.years}</td><td>${t.g}</td>
    <td>${t.era.toFixed(2)}</td><td>${t.w}</td><td>${t.l}</td>
    <td>${t.s}</td><td>${t.whip.toFixed(2)}</td><td>${fmtIP(t.ip)}</td>
    <td>${t.gs}</td><td>${t.cg}</td><td>${t.sho}</td>
    <td>${t.er}</td><td>${t.r}</td><td>${t.k}</td><td>${t.bb}</td><td>${t.h}</td>
  </tr>`).join('');
}

function renderPitchingTotals() {
  const indiv = pitching.filter(s => s.team !== 'Total');
  const t = { g:0, w:0, l:0, s:0, ip:0, gs:0, cg:0, sho:0, er:0, r:0, k:0, bb:0, h:0 };
  const yearsSet = new Set();
  indiv.forEach(s => {
    yearsSet.add(s.year);
    Object.keys(t).forEach(k => t[k] += s[k] || 0);
  });
  t.era = t.ip ? (t.er * 7) / t.ip : 0;
  t.whip = t.ip ? (t.bb + t.h) / t.ip : 0;

  const cards = [
    ['Years', yearsSet.size], ['Games', t.g], ['ERA', t.era.toFixed(2)],
    ['W', t.w], ['L', t.l], ['S', t.s], ['WHIP', t.whip.toFixed(2)],
    ['IP', fmtIP(t.ip)], ['GS', t.gs], ['CG', t.cg], ['SHO', t.sho],
    ['ER', t.er], ['R', t.r], ['K', t.k], ['BB', t.bb], ['H', t.h]
  ];

  document.getElementById('pitchingTotalsCard').innerHTML = cards.map(([label, val]) =>
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

function renderHero() {
  // Show current season stats (most recent GAME_YEAR) in the hero card
  const currentYear = GAME_YEARS[GAME_YEARS.length - 1];
  const currentSeasons = seasons.filter(s => s.year === currentYear && s.team !== 'Total');
  const t = { g:0, h:0, ab:0, hr:0, rbi:0, '3b':0, '2b':0, sb:0, r:0, k:0, bb:0, hb:0 };
  currentSeasons.forEach(s => { Object.keys(t).forEach(k => t[k] += s[k] || 0); });
  t.avg = t.ab ? t.h / t.ab : 0;
  t.obp = (t.ab + t.bb + t.hb) ? (t.h + t.bb + t.hb) / (t.ab + t.bb + t.hb) : 0;
  const tb = t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr;
  t.slg = t.ab ? tb / t.ab : 0;
  t.ops = t.obp + t.slg;

  const cards = [
    [`${currentYear} Season`, `${t.g} G`], ['AVG', t.avg.toFixed(3)],
    ['OPS', t.ops.toFixed(3)], ['Hits', t.h], ['HR', t.hr],
    ['RBI', t.rbi], ['Runs', t.r], ['2B', t['2b']], ['SB', t.sb]
  ];
  document.getElementById('heroCard').innerHTML = cards.map(([l, v]) =>
    `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`
  ).join('');
}

init();

// Pitching is now on its own page (pitching.html)
