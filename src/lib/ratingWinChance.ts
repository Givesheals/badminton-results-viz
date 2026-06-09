/**
 * Official rating-difference → favorite win chance (%).
 * See docs/rating-win-chance-table.md.
 */
export const FAVORITE_WIN_CHANCE_BY_RATING_DIFF: readonly number[] = [
  50, 50, 50.6, 51.2, 51.7, 52.3, 52.9, 53.4, 54, 54.6, 55.2, 55.7, 56.3, 56.9, 57.4, 58,
  58.5, 59.1, 59.7, 60.2, 60.8, 61.3, 61.9, 62.4, 62.9, 63.5, 64, 64.5, 65.1, 65.6, 66.1,
  66.6, 67.1, 67.6, 68.1, 68.6, 69.1, 69.6, 70.1, 70.6, 71.1, 71.5, 72, 72.5, 72.9, 73.4,
  73.8, 74.3, 74.7, 75.1, 75.6, 76, 76.4, 76.8, 77.2, 77.6, 78, 78.4, 78.8, 79.2, 79.6, 79.9,
  80.3, 80.7, 81, 81.4, 81.7, 82, 82.4, 82.7, 83, 83.4, 83.7, 84, 84.3, 84.6,
]

const TABLE_MAX_DIFF = FAVORITE_WIN_CHANCE_BY_RATING_DIFF.length - 1
const EXTRAPOLATION_SLOPE =
  FAVORITE_WIN_CHANCE_BY_RATING_DIFF[TABLE_MAX_DIFF]! -
  FAVORITE_WIN_CHANCE_BY_RATING_DIFF[TABLE_MAX_DIFF - 1]!
const FAVORITE_CHANCE_CAP = 99

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

/** Favorite's pre-match win chance (%) for an absolute rating difference. */
export function favoriteWinChancePercent(absRatingDiff: number): number {
  const diff = Math.max(0, Math.round(absRatingDiff))
  if (diff <= TABLE_MAX_DIFF) {
    return FAVORITE_WIN_CHANCE_BY_RATING_DIFF[diff]!
  }
  const atMax = FAVORITE_WIN_CHANCE_BY_RATING_DIFF[TABLE_MAX_DIFF]!
  const extrapolated = atMax + (diff - TABLE_MAX_DIFF) * EXTRAPOLATION_SLOPE
  return Math.min(FAVORITE_CHANCE_CAP, roundPercent(extrapolated))
}

/**
 * Our pre-match win chance (%) from rating gap (opponent − us).
 * Positive gap = we were the underdog.
 */
export function ourPreMatchWinChancePercent(ratingGap: number): number {
  const favorite = favoriteWinChancePercent(Math.abs(ratingGap))
  if (ratingGap >= 0) return roundPercent(100 - favorite)
  return roundPercent(favorite)
}

/** Clamp win chance for UI display (never 0%, never 100% for the shown side). */
export function clampDisplayWinChance(percent: number): number {
  return Math.max(1, Math.min(99, percent))
}

/** Whole-number percent for upset metric display. */
export function formatUpsetWinChanceDisplay(percent: number): string {
  return `${Math.round(percent)}%`
}
