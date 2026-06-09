# KCMSBL Baseball Stats

Static web app for displaying KCMSBL league statistics. Hosted on GitHub Pages.

## Rules

**When adding game logs: collect ALL data before committing.** Don't commit partial entries. For each game, get:
- Date
- Team (Federal Blues or CH A's)
- Opponent
- Field
- Result (W/L + score)
- Full batting line: AB, H, 2B, 3B, HR, RBI, R, BB, K, HBP, SB, SAC
- Pitching (if applicable): IP, H, ER, K, BB

Ask for everything upfront. One commit with complete data.

## Structure

- `index.html` — Main entry point
- `js/` — JavaScript for stats rendering/filtering
- `css/` — Styling
- `data/` — Stats data (JSON/CSV)
- `gamelogs/` — Individual game log data
- `royals/` — Team-specific stat pages

## Workflow

Stats data is updated in `data/` and `gamelogs/`, then the static site renders it client-side. See `STATS_WORKFLOW.md` for the data update process.

## Tech Stack

HTML, CSS, vanilla JavaScript. No build step — static files served directly via GitHub Pages.
