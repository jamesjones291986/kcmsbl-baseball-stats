# Stats Update Workflow

## Adding a New Game

Only one file needs updating: the game log. Batting **and** pitching season
totals for years in `GAME_YEARS` are auto-computed from the game log at load
time — do **not** edit `pitching.json` for those years (it is ignored for them).

### `data/personal/games/2026.json` (game log)

Add a new entry with this format:

```json
{
  "date": "YYYY-MM-DD",
  "team": "Federal Blues",
  "opponent": "Ducks",
  "field": "Royal",
  "time": "7:15pm",
  "result": "W 9-2",
  "ab": 3,
  "h": 0,
  "2b": 0,
  "3b": 0,
  "hr": 0,
  "rbi": 0,
  "r": 0,
  "bb": 1,
  "k": 0,
  "hb": 0,
  "sb": 0,
  "s": 0,
  "pitching": { "ip": 2, "h": 2, "er": 0, "k": 4 }
}
```

- Include `"pitching"` object only if pitched that game
- Pitching fields: `ip`, `h`, `er`, `r`, `bb`, `k`. Add `gs: 1` if started,
  and `w: 1` / `l: 1` / `s: 1` for a decision. These are summed per team by the
  app to produce season pitching lines (G, IP, ERA, WHIP, W-L-S, GS, etc.).
- `ip` uses baseball notation: `5.1` = 5⅓ innings, `5.2` = 5⅔ innings.
- `s` (top level) = sacrifice; `hb` = hit by pitch
- `time` = game start time (e.g. "6:30pm", "8:45pm") — used for time-of-day splits
- The app auto-computes batting **and** pitching season totals from game logs
  for years in `GAME_YEARS`. A new team name simply appears as its own line.

### `data/personal/pitching.json` — historical only

This file holds pitching stats for seasons **before** `GAME_YEARS` (pre-2022).
Rows whose year is in `GAME_YEARS` are filtered out at load time and replaced by
values computed from the game log, so editing them has no effect. Only touch
this file to correct historical (pre-`GAME_YEARS`) seasons.

## What's Automatic vs Manual

| Data | Source | Auto? |
|------|--------|-------|
| Batting season stats (`GAME_YEARS`) | Computed from game logs | ✅ Yes |
| Batting career/totals | Computed from all seasons | ✅ Yes |
| Pitching season stats (`GAME_YEARS`) | Computed from game logs | ✅ Yes |
| Pitching career/totals | Computed from all seasons | ✅ Yes |
| Batting/pitching before `GAME_YEARS` | `seasons.json` / `pitching.json` | ❌ Manual |

## Key Details

- `seasons.json` / `pitching.json` — historical seasons. Rows for years in
  `GAME_YEARS` are replaced by game-log totals at load time.
- All settings live in `js/config.js`: `GAME_YEARS`, `GAME_LOG_YEARS`, `WS_YEARS`,
  `BIRTH_YEAR` (ages are computed as year − BIRTH_YEAR), `ERA_INNINGS` (7), and
  `SEASON_NOTES` for game-log years.
- All stat math is in `js/stats.js` and shared by every page. Stored AVG/OBP/SLG/OPS,
  ERA and WHIP values are ignored; the pages recompute them from the counts.
- ERA is per 7 innings everywhere, including the World Series pages.
- OBP = (H + BB + HBP) / (AB + BB + HBP + SF). Add `sf` to a game when a sacrifice was a fly.
- Innings are always baseball notation (5.1 = 5⅓), in game logs and season files alike.
- Results are our score first: "W 9-2", "L 3-5".
- Teams: "Federal Blues", "CH A's", etc. Use exact team name strings.
- Fields: "Royal", "Fenway", etc.

## Starting a New Season

1. Create `data/personal/games/YYYY.json` (empty array `[]`)
2. Add the year to `GAME_YEARS` and `GAME_LOG_YEARS` in `js/config.js`
3. For a World Series year, add `data/royals/games/YYYY.json` and the year to `WS_YEARS`

That's it — batting and pitching lines (including new teams) are generated from
the game log automatically.
