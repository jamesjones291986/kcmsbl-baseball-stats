// Shared by the World Series page (index.html) and the player page (player.html).

const gameFiles = ['2019','2020','2021','2022','2023','2024','2026'];
const OUR_TEAMS = ['Kansas City Royals', 'Kansas City Blues'];

async function loadSeasons() {
  const results = await Promise.all(gameFiles.map(y =>
    fetch('../data/royals/games/' + y + '.json').then(r => r.ok ? r.json() : null).catch(() => null)));
  return results.filter(Boolean);
}

// Chronological sort key. Times are "9:00am"/"1:30pm" strings, which sort wrong as
// text ("1:30pm" < "9:00am"), so convert to minutes after midnight.
function gameKey(g) {
  const m = /^(\d+):(\d+)\s*(am|pm)$/i.exec((g.time || '').trim());
  let mins = 0;
  if (m) mins = (+m[1] % 12 + (m[3].toLowerCase() === 'pm' ? 12 : 0)) * 60 + +m[2];
  return g.date + ' ' + String(mins).padStart(4, '0');
}

// Which side of the box score is ours.
function ourSide(g) { return OUR_TEAMS.includes(g.home) ? 'home' : 'away'; }
function opponentOf(g) { return ourSide(g) === 'home' ? g.away : g.home; }

// Innings use baseball notation: 7.1 means 7 and one third, not 7.1 innings. Sum
// and divide in outs, or 7.1 + 0.2 comes out as 7.3 instead of 8.0.
function ipToOuts(ip) { const w = Math.trunc(ip); return w * 3 + Math.round((ip - w) * 10); }
function outsToIp(outs) { return Math.trunc(outs / 3) + (outs % 3) / 10; }

// ERA and WHIP divide by innings pitched, so a pitcher who recorded no outs has no
// defined rate. Returning 0 there would read as a perfect outing, which is the
// opposite of what happened. Infinity when runs/baserunners were allowed in zero
// innings, null when nothing at all happened (0/0 is undefined, not zero).
function rate(numerator, ip) {
  if (ip > 0) return numerator / ip;
  return numerator > 0 ? Infinity : null;
}
function fmtRate(v) {
  if (v == null) return '-';
  return Number.isFinite(v) ? v.toFixed(2) : 'INF';
}
function fmt3(v) { return v == null ? '-' : v.toFixed(3); }

// Infinity - Infinity is NaN, which makes a subtraction comparator misbehave, so
// compare with explicit operators and treat null as the bottom of the range.
function cmpVal(a, b) {
  const x = a == null ? -Infinity : a, y = b == null ? -Infinity : b;
  if (typeof x === 'string' || typeof y === 'string') return String(x).localeCompare(String(y));
  return x === y ? 0 : (x < y ? -1 : 1);
}

// Notes list players by full name, with "(n)" when it happened more than once:
// "sb": ["Kevin Sears", "Ricardo Garcia (2)"]. Count one player's entries for a key.
function noteCount(g, key, name) {
  const list = (g.notes && g.notes[key]) || [];
  let n = 0;
  list.forEach(e => {
    const m = /^(.*?)\s*(?:\((\d+)\))?$/.exec(e);
    if (m[1] === name) n += m[2] ? +m[2] : 1;
  });
  return n;
}

// OBP = (H + BB + HBP) / (AB + BB + HBP + SF). Sac flies count against it; bunts don't.
function obp(t) {
  const d = t.ab + t.bb + (t.hbp || 0) + (t.sf || 0);
  return d ? (t.h + t.bb + (t.hbp || 0)) / d : 0;
}
function slg(t) { return t.ab ? (t.h + t['2b'] + 2 * t['3b'] + 3 * t.hr) / t.ab : 0; }

// Links. Player pages take an optional season; box scores are keyed by date + time
// because two games can share a date.
function playerUrl(name, season) {
  return 'player.html?name=' + encodeURIComponent(name) + (season ? '&season=' + season : '');
}
function boxUrl(season, date, time) {
  return 'index.html?season=' + season + '&date=' + date + '&time=' + encodeURIComponent(time) + '#box';
}
function playerLink(name, season) {
  return `<a class="player-link" href="${playerUrl(name, season)}">${name}</a>`;
}
