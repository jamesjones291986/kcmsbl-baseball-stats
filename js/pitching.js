// pitching.js — dedicated pitching page logic
let pitching = [];

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

function renderPitchingHero() {
  const currentYear = GAME_YEARS[GAME_YEARS.length - 1];
  const current = pitching.filter(s => s.year === currentYear && s.team !== 'Total');
  const t = { g:0, w:0, l:0, s:0, ip:0, er:0, r:0, k:0, bb:0, h:0 };
  current.forEach(s => { Object.keys(t).forEach(k => t[k] += s[k] || 0); });
  t.era = t.ip ? (t.er * 7) / t.ip : 0;
  t.whip = t.ip ? (t.bb + t.h) / t.ip : 0;

  const cards = [
    [`${currentYear} Season`, `${t.g} G`], ['ERA', t.era.toFixed(2)],
    ['W-L', `${t.w}-${t.l}`], ['S', t.s], ['WHIP', t.whip.toFixed(2)],
    ['IP', fmtIP(t.ip)], ['K', t.k], ['BB', t.bb], ['H', t.h]
  ];
  document.getElementById('pitchingHeroCard').innerHTML = cards.map(([l, v]) =>
    `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`
  ).join('');
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

async function init() {
  const [pitchingRes, ...gameResults] = await Promise.all([
    fetch('data/personal/pitching.json').then(r => r.json()),
    ...GAME_YEARS.map(y => fetch(`data/personal/games/${y}.json`).then(r => r.ok ? r.json() : []).catch(() => []))
  ]);

  pitching = pitchingRes.filter(p => !GAME_YEARS.includes(p.year));
  GAME_YEARS.forEach((y, i) => {
    pitching.push(...aggregatePitching(gameResults[i], y));
  });

  renderPitchingHero();
  renderPitching();
  renderPitchingCareer();
  renderPitchingTotals();
  document.getElementById('hidePitchingTotals').addEventListener('change', renderPitching);
}

init();
