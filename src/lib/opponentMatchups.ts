import type { NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch } from './matchExclusions'
import { getOpponentAppearances } from './matchTeams'
import { getPlayerRating, RATING_PROBABILITY_SCALE } from './ratings'

export type OpponentH2HRow = {
  opponentName: string
  wins: number
  losses: number
  games: number
  lossPercent: number
  ratedUpsetWins: number
  /** Mean opponent-minus-player rating on wins where they were rated higher (favourite opponents panel). */
  avgRatingGap: number | null
  /** Mean absolute pre-match rating gap on rated losses (nemesis proximity). */
  avgLossRatingGap: number | null
  /** Composite sort key for nemesis ranking. */
  nemesisScore: number
}

export const DEFAULT_MIN_MEETINGS = 3
export const DEFAULT_MIN_SCALP_WINS = 2
/** Default list depth for nemesis/favourite-opponent panels and recap milestones. */
export const OPPONENT_MATCHUP_TOP_N = 5
/** Rating-gap scale for nemesis proximity multiplier (see partner chemistry logistic scale). */
export const NEMESIS_PROXIMITY_SCALE = RATING_PROBABILITY_SCALE / 2

function opponentNamesInMatches(matches: NormalizedMatch[]): Set<string> {
  const names = new Set<string>()
  for (const match of matches) {
    if (!isCompetitiveMatch(match)) continue
    for (const { name } of getOpponentAppearances(match.raw)) {
      names.add(name)
    }
  }
  return names
}

/**
 * Opponents newly in the top-N nemesis or favourite-opponent lists after this weekend
 * (same rules as {@link computeOpponentMatchups}).
 */
export function detectOpponentMatchupRecapMilestones(
  weekendMatches: NormalizedMatch[],
  priorMatches: NormalizedMatch[],
  minMeetings: number = DEFAULT_MIN_MEETINGS,
  minScalpWins: number = DEFAULT_MIN_SCALP_WINS,
  topN: number = OPPONENT_MATCHUP_TOP_N,
): OpponentMatchupRecapMilestone[] {
  const allMatches = [...priorMatches, ...weekendMatches]
  const prior = computeOpponentMatchups(priorMatches, minMeetings, minScalpWins)
  const all = computeOpponentMatchups(allMatches, minMeetings, minScalpWins)
  const weekendOpponents = opponentNamesInMatches(weekendMatches)

  const milestones: OpponentMatchupRecapMilestone[] = []

  const priorNemesisNames = new Set(
    prior.nemeses.slice(0, topN).map((r) => r.opponentName),
  )
  all.nemeses.slice(0, topN).forEach((row, index) => {
    if (!weekendOpponents.has(row.opponentName)) return
    if (priorNemesisNames.has(row.opponentName)) return
    milestones.push({
      kind: 'nemesis',
      rank: index + 1,
      opponentName: row.opponentName,
    })
  })

  const priorScalpNames = new Set(
    prior.scalps.slice(0, topN).map((r) => r.opponentName),
  )
  all.scalps.slice(0, topN).forEach((row, index) => {
    if (!weekendOpponents.has(row.opponentName)) return
    if (priorScalpNames.has(row.opponentName)) return
    milestones.push({
      kind: 'scalp',
      rank: index + 1,
      opponentName: row.opponentName,
    })
  })

  return milestones
}

export type OpponentMatchupRecapMilestone = {
  kind: 'nemesis' | 'scalp'
  rank: number
  opponentName: string
}

export type OpponentMatchupsResult = {
  nemeses: OpponentH2HRow[]
  scalps: OpponentH2HRow[]
  hiddenBelowThresholdCount: number
  totalOpponentCount: number
  competitiveMatchCount: number
}

type OpponentAccumulator = {
  opponentName: string
  wins: number
  losses: number
  ratedUpsetWins: number
  ratedUpsetGapSum: number
  ratedLossCount: number
  ratedLossGapSum: number
}

function matchIncludesOpponent(match: NormalizedMatch, opponentName: string): boolean {
  return getOpponentAppearances(match.raw).some((a) => a.name === opponentName)
}

/** Competitive win/loss meetings vs a named opponent (newest first). */
export function getHeadToHeadMatches(
  matches: NormalizedMatch[],
  opponentName: string,
): NormalizedMatch[] {
  return matches
    .filter(
      (m) =>
        isCompetitiveMatch(m) &&
        (m.outcome === 'win' || m.outcome === 'loss') &&
        matchIncludesOpponent(m, opponentName),
    )
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Nemesis composite score; exported for tests. */
export function computeNemesisScore(
  row: Pick<OpponentH2HRow, 'losses' | 'games' | 'avgLossRatingGap'>,
  applyProximity: boolean,
): number {
  const lossRatio = row.games > 0 ? row.losses / row.games : 0
  const baseScore = row.losses * lossRatio
  const proximity =
    applyProximity && row.avgLossRatingGap != null
      ? Math.exp(-row.avgLossRatingGap / NEMESIS_PROXIMITY_SCALE)
      : 1
  return baseScore * proximity
}

function toRow(acc: OpponentAccumulator): Omit<OpponentH2HRow, 'nemesisScore'> {
  const games = acc.wins + acc.losses
  const lossPercent = games > 0 ? Math.round((acc.losses / games) * 100) : 0
  const avgRatingGap =
    acc.ratedUpsetWins > 0
      ? Math.round(acc.ratedUpsetGapSum / acc.ratedUpsetWins)
      : null
  const avgLossRatingGap =
    acc.ratedLossCount > 0
      ? Math.round(acc.ratedLossGapSum / acc.ratedLossCount)
      : null

  return {
    opponentName: acc.opponentName,
    wins: acc.wins,
    losses: acc.losses,
    games,
    lossPercent,
    ratedUpsetWins: acc.ratedUpsetWins,
    avgRatingGap,
    avgLossRatingGap,
  }
}

export function computeOpponentMatchups(
  matches: NormalizedMatch[],
  minMeetings: number,
  minScalpWins: number,
  nemesisRatingProximity: boolean = true,
): OpponentMatchupsResult {
  const competitive = matches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      (m.outcome === 'win' || m.outcome === 'loss'),
  )

  const byOpponent = new Map<string, OpponentAccumulator>()

  for (const match of competitive) {
    const appearances = getOpponentAppearances(match.raw)
    if (appearances.length === 0) continue

    const playerRating = getPlayerRating(match)

    for (const { name, rating } of appearances) {
      let acc = byOpponent.get(name)
      if (!acc) {
        acc = {
          opponentName: name,
          wins: 0,
          losses: 0,
          ratedUpsetWins: 0,
          ratedUpsetGapSum: 0,
          ratedLossCount: 0,
          ratedLossGapSum: 0,
        }
        byOpponent.set(name, acc)
      }

      if (match.outcome === 'win') {
        acc.wins += 1
        if (
          playerRating != null &&
          rating != null &&
          rating > playerRating
        ) {
          acc.ratedUpsetWins += 1
          acc.ratedUpsetGapSum += rating - playerRating
        }
      } else {
        acc.losses += 1
        if (playerRating != null && rating != null) {
          acc.ratedLossCount += 1
          acc.ratedLossGapSum += Math.abs(rating - playerRating)
        }
      }
    }
  }

  const allRows = [...byOpponent.values()].map((acc) => {
    const base = toRow(acc)
    return { ...base, nemesisScore: 0 }
  })
  const qualifying = allRows.filter((row) => row.games >= minMeetings)

  const nemesisEligible = qualifying.filter((row) => row.losses > row.wins)
  const applyProximity =
    nemesisRatingProximity && nemesisEligible.length >= OPPONENT_MATCHUP_TOP_N

  const nemeses = nemesisEligible
    .map((row) => ({
      ...row,
      nemesisScore: computeNemesisScore(row, applyProximity),
    }))
    .sort((a, b) => {
      if (b.nemesisScore !== a.nemesisScore) return b.nemesisScore - a.nemesisScore
      if (b.losses !== a.losses) return b.losses - a.losses
      if (b.lossPercent !== a.lossPercent) return b.lossPercent - a.lossPercent
      return b.games - a.games
    })

  const scalps = qualifying
    .filter(
      (row) =>
        row.ratedUpsetWins >= minScalpWins &&
        row.avgRatingGap != null &&
        row.wins >= row.losses,
    )
    .sort((a, b) => {
      const gapA = a.avgRatingGap!
      const gapB = b.avgRatingGap!
      if (gapB !== gapA) return gapB - gapA
      if (b.ratedUpsetWins !== a.ratedUpsetWins) {
        return b.ratedUpsetWins - a.ratedUpsetWins
      }
      return b.games - a.games
    })

  return {
    nemeses,
    scalps,
    hiddenBelowThresholdCount: allRows.length - qualifying.length,
    totalOpponentCount: allRows.length,
    competitiveMatchCount: competitive.length,
  }
}
