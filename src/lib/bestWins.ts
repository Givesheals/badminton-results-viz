import type { NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch, matchHasNonScoreFinish } from './matchExclusions'
import { hasPlayedGameScores } from './matchScores'
import { ourPreMatchWinChancePercent } from './ratingWinChance'
import {
  getMatchExpectedWinProbability,
  getOpponentTeamRating,
  getOurTeamRating,
} from './ratings'

export type BestWinRow = {
  match: NormalizedMatch
  ourTeamRating: number
  opponentTeamRating: number
  /** Opponent minus our team rating; positive means you were the underdog. */
  ratingGap: number
  /** Our pre-match win chance from the official rating-difference table (%). */
  preMatchWinChancePercent: number
  expectedWinPercent: number | null
}

export type BestWinsResult = {
  byOpponentStrength: BestWinRow[]
  byUpset: BestWinRow[]
  ratedWinCount: number
  unratedWinCount: number
}

function roundRating(value: number): number {
  return Math.round(value)
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

function isBestWinEligible(match: NormalizedMatch): boolean {
  return (
    isCompetitiveMatch(match) &&
    match.outcome === 'win' &&
    hasPlayedGameScores(match) &&
    !matchHasNonScoreFinish(match)
  )
}

export function buildBestWinRow(match: NormalizedMatch): BestWinRow | null {
  const ourTeamRating = getOurTeamRating(match)
  const opponentTeamRating = getOpponentTeamRating(match.raw, match.discipline)
  if (ourTeamRating == null || opponentTeamRating == null) return null

  const expected = getMatchExpectedWinProbability(match)
  const ratingGap = roundRating(opponentTeamRating - ourTeamRating)

  return {
    match,
    ourTeamRating: roundRating(ourTeamRating),
    opponentTeamRating: roundRating(opponentTeamRating),
    ratingGap,
    preMatchWinChancePercent: ourPreMatchWinChancePercent(ratingGap),
    expectedWinPercent:
      expected != null ? roundPercent(expected * 100) : null,
  }
}

function compareByDateDesc(a: NormalizedMatch, b: NormalizedMatch): number {
  return b.date.localeCompare(a.date)
}

function sortByOpponentStrength(rows: BestWinRow[]): BestWinRow[] {
  return [...rows].sort((a, b) => {
    const byRating = b.opponentTeamRating - a.opponentTeamRating
    if (byRating !== 0) return byRating
    return compareByDateDesc(a.match, b.match)
  })
}

function sortByUpset(rows: BestWinRow[]): BestWinRow[] {
  return [...rows].sort((a, b) => {
    const byGap = b.ratingGap - a.ratingGap
    if (byGap !== 0) return byGap
    return compareByDateDesc(a.match, b.match)
  })
}

/**
 * Upset highlights for display: top `limit` by pre-match gap, skipping matches
 * already shown in the top `limit` of {@link sortByOpponentStrength} (strongest beaten).
 */
export function selectUpsetRowsExcludingStrength(
  byOpponentStrength: BestWinRow[],
  byUpset: BestWinRow[],
  limit: number,
): BestWinRow[] {
  if (limit <= 0) return []

  const excluded = new Set(
    byOpponentStrength.slice(0, limit).map(bestWinRowKey),
  )
  const rows: BestWinRow[] = []
  for (const row of byUpset) {
    if (excluded.has(bestWinRowKey(row))) continue
    rows.push(row)
    if (rows.length >= limit) break
  }
  return rows
}

/** Strongest rated opponent beaten in the given match set. */
export function findBestWinInMatches(matches: NormalizedMatch[]): BestWinRow | null {
  let best: BestWinRow | null = null
  for (const match of matches) {
    if (!isBestWinEligible(match)) continue
    const row = buildBestWinRow(match)
    if (row == null) continue
    if (best == null || row.opponentTeamRating > best.opponentTeamRating) {
      best = row
    }
  }
  return best
}

/** All-time ranks surfaced on the tournament recap (matches Best wins default list). */
export const BEST_WIN_RECAP_TOP_N = 5

export type BestWinMetricKind = 'strength' | 'upset'

export type BestWinRecapMilestone = {
  kind: BestWinMetricKind
  rank: number
  row: BestWinRow
}

/** Stable identity for a rated win row (matches Best wins list ordering). */
export function bestWinRowKey(row: BestWinRow): string {
  const m = row.match
  return `${m.competitionName}\0${m.date}\0${m.discipline}\0${m.opponents}`
}

/** 1-based rank in a sorted best-wins list, or null if absent. */
export function rankBestWinRow(
  row: BestWinRow,
  list: BestWinRow[],
): number | null {
  const key = bestWinRowKey(row)
  const index = list.findIndex((r) => bestWinRowKey(r) === key)
  return index >= 0 ? index + 1 : null
}

function isBetterBestWin(
  row: BestWinRow,
  other: BestWinRow,
  kind: BestWinMetricKind,
): boolean {
  return kind === 'strength'
    ? row.opponentTeamRating > other.opponentTeamRating
    : row.ratingGap > other.ratingGap
}

/**
 * Whether a weekend win newly holds this rank on the all-time list (same sort as Best wins).
 * Rank 1 = new personal best; deeper ranks = new slot or improved entry at that position.
 */
export function isBestWinRankMilestone(
  row: BestWinRow,
  rank: number,
  list: BestWinRow[],
  priorList: BestWinRow[],
  kind: BestWinMetricKind,
  topN: number = BEST_WIN_RECAP_TOP_N,
): boolean {
  if (rank > topN) return false

  const holder = list[rank - 1]
  if (holder == null || bestWinRowKey(holder) !== bestWinRowKey(row)) return false

  const priorRank = rankBestWinRow(row, priorList)
  if (priorRank != null && priorRank <= topN && rank >= priorRank) {
    return false
  }

  if (rank === 1) {
    const priorFirst = priorList[0]
    if (priorFirst == null) return true
    if (bestWinRowKey(priorFirst) === bestWinRowKey(row)) return false
    return isBetterBestWin(row, priorFirst, kind)
  }

  const priorAtRank = priorList[rank - 1]
  if (priorAtRank == null) {
    return (
      rank === priorList.length + 1 &&
      (rank === 1 || priorList.length >= 2)
    )
  }
  if (bestWinRowKey(priorAtRank) === bestWinRowKey(row)) return false
  return isBetterBestWin(row, priorAtRank, kind)
}

/**
 * Wins from `weekendMatches` that newly appear or move up in the all-time Best wins
 * lists (same sort rules as {@link computeBestWins}).
 */
export function detectBestWinRecapMilestones(
  weekendMatches: NormalizedMatch[],
  priorMatches: NormalizedMatch[],
): BestWinRecapMilestone[] {
  const allTime = computeBestWins([...priorMatches, ...weekendMatches])
  const priorTime = computeBestWins(priorMatches)

  const weekendRows: BestWinRow[] = []
  for (const match of weekendMatches) {
    if (!isBestWinEligible(match)) continue
    const row = buildBestWinRow(match)
    if (row != null) weekendRows.push(row)
  }
  if (weekendRows.length === 0) return []

  const milestones: BestWinRecapMilestone[] = []

  for (const kind of ['strength', 'upset'] as const) {
    const list =
      kind === 'strength'
        ? allTime.byOpponentStrength
        : selectUpsetRowsExcludingStrength(
            allTime.byOpponentStrength,
            allTime.byUpset,
            BEST_WIN_RECAP_TOP_N,
          )
    const priorList =
      kind === 'strength'
        ? priorTime.byOpponentStrength
        : selectUpsetRowsExcludingStrength(
            priorTime.byOpponentStrength,
            priorTime.byUpset,
            BEST_WIN_RECAP_TOP_N,
          )

    let best: BestWinRecapMilestone | null = null

    for (const row of weekendRows) {
      const rank = rankBestWinRow(row, list)
      if (rank == null) continue
      if (!isBestWinRankMilestone(row, rank, list, priorList, kind)) continue

      if (best == null || rank < best.rank) {
        best = { kind, rank, row }
      }
    }

    if (best != null) milestones.push(best)
  }

  return milestones
}

export function computeBestWins(matches: NormalizedMatch[]): BestWinsResult {
  let unratedWinCount = 0
  const ratedWins: BestWinRow[] = []

  for (const match of matches) {
    if (!isBestWinEligible(match)) continue

    const row = buildBestWinRow(match)
    if (row == null) {
      unratedWinCount += 1
      continue
    }
    ratedWins.push(row)
  }

  return {
    byOpponentStrength: sortByOpponentStrength(ratedWins),
    byUpset: sortByUpset(ratedWins),
    ratedWinCount: ratedWins.length,
    unratedWinCount,
  }
}
