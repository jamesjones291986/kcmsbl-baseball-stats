// Shared config — update once, applies everywhere

// Years whose SEASON TOTALS are computed from game logs instead of seasons.json
// and pitching.json. Only add a year here once the game log covers EVERY team
// played that year — the loader drops all seasons.json rows for these years, so
// a partial log would silently hide the teams it is missing.
const GAME_YEARS = [2022, 2023, 2024, 2025, 2026];

// Years that have a game log file at all, used by the Game Logs and Splits pages.
// Safe to include partial years here: those pages only read game files and never
// touch season totals, so extra years add browsable games without risk.
// 2020-2021 are CH A's only (Federal Blues / WS Royals game logs don't exist),
// which is why they appear here but not in GAME_YEARS above.
const GAME_LOG_YEARS = [2020, 2021, 2022, 2023, 2024, 2025, 2026];

// Notes for game-log years (not in seasons.json since those years are excluded)
const SEASON_NOTES = {
  '2024|Federal Blues': 'Lost Champ',
  '2024|CH A\'s': 'Lost Champ',
  '2024|Total': 'LC - Blues/A\'s',
  '2025|Federal Blues': 'Lost Champ',
  '2025|CH A\'s': 'Lost Champ',
  '2025|Total': 'LC - Blues/A\'s',
};
