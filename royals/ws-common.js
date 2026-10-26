// World Series helpers shared by index.html and player.html. Stat math (innings,
// ERA, OBP, formatting, sorting) comes from ../js/stats.js; years from ../js/config.js.

const OUR_TEAMS = ['Kansas City Royals', 'Kansas City Blues'];

// Loads every WS box-score file. A missing file is reported rather than skipped silently.
async function loadSeasons() {
  const results = await Promise.all(WS_YEARS.map(y => tryLoadJSON(`../data/royals/games/${y}.json`)));
  results.forEach((r, i) => { if (r.error) showError(`Could not load the ${WS_YEARS[i]} World Series box scores (${r.error}).`); });
  return results.map(r => r.data).filter(Boolean);
}

function ourSide(g) { return OUR_TEAMS.includes(g.home) ? 'home' : 'away'; }
function opponentOf(g) { return ourSide(g) === 'home' ? g.away : g.home; }

// Notes list players by full name, with "(n)" when it happened more than once:
// "sb": ["Kevin Sears", "Ricardo Garcia (2)"]. Count one player's entries for a key.
function noteCount(g, key, name) {
  let n = 0;
  ((g.notes && g.notes[key]) || []).forEach(e => {
    const m = /^(.*?)\s*(?:\((\d+)\))?$/.exec(e);
    if (m[1] === name) n += m[2] ? +m[2] : 1;
  });
  return n;
}

// Links. Box scores are keyed by date + time because two games can share a date.
function playerUrl(name, season) {
  return 'player.html?name=' + encodeURIComponent(name) + (season ? '&season=' + season : '');
}
function boxUrl(season, date, time) {
  return 'index.html?season=' + season + '&date=' + date + '&time=' + encodeURIComponent(time);
}
function playerLink(name, season) {
  return `<a class="player-link" href="${esc(playerUrl(name, season))}">${esc(name)}</a>`;
}
