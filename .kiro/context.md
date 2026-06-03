# KCMSBL Baseball Stats

Static web app for displaying KCMSBL league statistics. Hosted on GitHub Pages.

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
