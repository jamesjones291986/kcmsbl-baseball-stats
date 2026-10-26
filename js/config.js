// Shared config — update once, applies everywhere.

// Ages are derived from this rather than stored per season (age = year - BIRTH_YEAR).
const BIRTH_YEAR = 1986;

// KCMSBL games are 7 innings, so every ERA on the site is runs per 7 innings,
// including the World Series pages, to keep one scale everywhere.
const ERA_INNINGS = 7;

// Years whose SEASON TOTALS are computed from game logs instead of seasons.json
// and pitching.json. Only add a year here once the game log covers EVERY team
// played that year — the loader replaces all seasons.json rows for these years, so
// a partial log would hide the teams it is missing.
const GAME_YEARS = [2022, 2023, 2024, 2025, 2026];

// Years that have a game log file at all, used by the Game Logs and Splits pages.
// Safe to include partial years here: those pages only read game files and never
// touch season totals. 2020-2021 are CH A's only.
const GAME_LOG_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

// World Series years with full team box scores (data/royals/games/<year>.json).
const WS_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2026];

// Notes for game-log years. Earlier years keep their notes in seasons.json.
// Key is "year|team"; "year|Total" is the note on the combined row for that year.
const SEASON_NOTES = {
  '2022|WS Royals': 'Champions',
  '2022|Total': 'Champs - WS Royals',
  '2023|Federal Blues': 'Lost Champ',
  '2023|CH A\'s': 'Champs',
  '2023|Total': 'Champs - A\'s, LC - Blues',
  '2024|Federal Blues': 'Lost Champ',
  '2024|CH A\'s': 'Lost Champ',
  '2024|Total': 'LC - Blues/A\'s',
  '2025|Federal Blues': 'Lost Champ',
  '2025|CH A\'s': 'Lost Champ',
  '2025|Total': 'LC - Blues/A\'s',
  '2026|Federal Blues': 'Lost Champ',
  '2026|CH A\'s': 'Lost Champ',
  '2026|National Blues': 'Lost Champ',
  '2026|Total': 'LC - Blues/A\'s/National Blues',
};
