# Stats Update Workflow

## Adding a New Game

Only two files need updating:

### 1. `data/personal/games/2026.json` (game log)

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
- `s` = sacrifice
- `hb` = hit by pitch
- `time` = game start time (e.g. "6:30pm", "8:45pm") — used for time-of-day splits
- The app auto-computes batting season totals from game logs for years in `GAME_YEARS`

### 2. `data/personal/pitching.json` (only if pitched)

Manually update the team line and Total line for the current year:
- Increment `g` (games)
- Add `ip`, `h`, `er`, `k`, `bb` to running totals
- Recalculate `era`: `(er * 7) / ip` (7-inning games)
- Recalculate `whip`: `(bb + h) / ip`
- Update `gs` only if started
- Update `w`/`l`/`s` for decisions

## What's Automatic vs Manual

| Data | Source | Auto? |
|------|--------|-------|
| Batting season stats | Computed from game logs | ✅ Yes |
| Batting career/totals | Computed from all seasons | ✅ Yes |
| Pitching season stats | `pitching.json` | ❌ Manual |
| Pitching career/totals | Computed from pitching.json | ✅ Yes |

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
3. Add initial pitching entries in `pitching.json` for each team
