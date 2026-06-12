import type { NormalizedMatch } from '../types/matchHistory'
import { getPlayerRating } from './ratings'
import { getMatchRound, parseRoundToStage, STAGE_RANK } from './tournamentProgression'

function matchStageRank(match: NormalizedMatch): number {
  const stage = parseRoundToStage(getMatchRound(match))
  return stage != null ? STAGE_RANK[stage] : 0
}

/**
 * Order matches as played: date, then tournament round depth, then pre-match
 * player rating (earlier matches tend to have lower ratings within a day).
 * Upload row order is not assumed to be chronological.
 */
export function compareMatchesChronologically(
  a: NormalizedMatch,
  b: NormalizedMatch,
): number {
  const byDate = a.date.localeCompare(b.date)
  if (byDate !== 0) return byDate

  const stageA = matchStageRank(a)
  const stageB = matchStageRank(b)
  if (stageA !== stageB) return stageA - stageB

  const ratingA = getPlayerRating(a)
  const ratingB = getPlayerRating(b)
  if (ratingA != null && ratingB != null && ratingA !== ratingB) {
    return ratingA - ratingB
  }

  return a.opponents.localeCompare(b.opponents)
}

export function sortMatchesChronologically(matches: NormalizedMatch[]): NormalizedMatch[] {
  return [...matches].sort(compareMatchesChronologically)
}
