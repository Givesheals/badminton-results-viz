import type { SpreadsheetRow } from '../types/dataset'
import type { NormalizedMatch } from '../types/matchHistory'
import { isSinglesDiscipline } from './disciplineStyle'

/** Rating-point gap at which expected win chance is ~90% (logistic model). */
export const RATING_PROBABILITY_SCALE = 100

function parseRating(value: string | number | boolean | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

export function getPlayerRating(match: NormalizedMatch): number | null {
  return match.playerRating ?? parseRating(match.raw['Player Rating'])
}

export function getPartnerRating(match: NormalizedMatch): number | null {
  return parseRating(match.raw['Partner Rating'])
}

/**
 * Average opponent rating for the match (never summed).
 * Singles uses opponent 1 only; doubles/mixed averages both when present.
 */
export function getOpponentTeamRating(
  row: SpreadsheetRow,
  disciplineCode?: string,
): number | null {
  const r1 = parseRating(row['Opponent 1 Rating'])
  const r2 = parseRating(row['Opponent 2 Rating'])

  if (disciplineCode != null && isSinglesDiscipline(disciplineCode)) {
    return r1
  }

  if (r1 != null && r2 != null) return (r1 + r2) / 2
  if (r1 != null) return r1
  if (r2 != null) return r2
  return null
}

/** Average of player and partner ratings for doubles pairings. */
export function getOurTeamRating(match: NormalizedMatch): number | null {
  const player = getPlayerRating(match)
  if (player == null) return null
  const partner = getPartnerRating(match)
  if (partner == null) return player
  return (player + partner) / 2
}

/**
 * Expected match win probability from team rating gap (logistic / Elo-style).
 * Returns a value in (0, 1), or null when ratings are unavailable.
 */
export function expectedWinProbability(
  ourTeamRating: number,
  opponentTeamRating: number,
  scale = RATING_PROBABILITY_SCALE,
): number {
  const diff = ourTeamRating - opponentTeamRating
  return 1 / (1 + 10 ** (-diff / scale))
}

export function getMatchExpectedWinProbability(match: NormalizedMatch): number | null {
  const ourTeam = getOurTeamRating(match)
  const theirTeam = getOpponentTeamRating(match.raw, match.discipline)
  if (ourTeam == null || theirTeam == null) return null
  return expectedWinProbability(ourTeam, theirTeam)
}
