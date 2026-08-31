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

- `seasons.json` — historical batting (pre-2026). Years in `GAME_YEARS` are excluded from this file at load time.
- `GAME_YEARS` in `js/app.js` and `gamelogs/index.html` controls which years use game log aggregation.
- ERA uses 7 innings (not 9) since this is KCMSBL.
- Age for 2026 season: 40.
- Teams: "Federal Blues", "CH A's", etc. Use exact team name strings.
- Fields: "Royal", "Fenway", etc.

## Starting a New Season

1. Create `data/personal/games/YYYY.json` (empty array `[]`)
2. Add the year to `GAME_YEARS` in both `js/app.js` and `gamelogs/index.html`

That's it — batting and pitching lines (including new teams) are generated from
the game log automatically. No `pitching.json` setup is needed for the new year.
