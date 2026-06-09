import { competitiveMatches, isCompetitiveMatch } from './matchExclusions'
import {
  filterMatchesByResultsRange,
  formatPeriodLabel,
  periodKey,
  type ResultsTimeRange,
  type TimeGranularity,
} from './timePeriods'
import type { NormalizedMatch } from '../types/matchHistory'

export const MIN_WIN_RATE_MATCHES = 3

export type ResultsActivityRow = {
  period: string
  label: string
  matchCount: number
}

export type ResultsWinRateRow = {
  period: string
  label: string
  winPercent: number | null
  wins: number
  losses: number
  decidedMatches: number
  belowThreshold: boolean
}

export type ResultsOverTimeData = {
  activity: ResultsActivityRow[]
  winRate: ResultsWinRateRow[]
}

function roundPercent(numerator: number, denominator: number): number {
  return Math.round((numerator / denominator) * 1000) / 10
}

export function computeResultsOverTimeData(
  matches: NormalizedMatch[],
  options: {
    granularity: TimeGranularity
    range: ResultsTimeRange
  },
): ResultsOverTimeData {
  const competitive = competitiveMatches(matches)
  const ranged = filterMatchesByResultsRange(competitive, options.range)

  const activityBuckets = new Map<string, number>()
  const outcomeBuckets = new Map<string, { wins: number; losses: number }>()

  for (const match of ranged) {
    if (!isCompetitiveMatch(match)) continue

    const key = periodKey(match.date, options.granularity)
    if (!key) continue

    activityBuckets.set(key, (activityBuckets.get(key) ?? 0) + 1)

    if (match.outcome === 'win' || match.outcome === 'loss') {
      const bucket = outcomeBuckets.get(key) ?? { wins: 0, losses: 0 }
      if (match.outcome === 'win') bucket.wins += 1
      else bucket.losses += 1
      outcomeBuckets.set(key, bucket)
    }
  }

  const periods = [...new Set([...activityBuckets.keys(), ...outcomeBuckets.keys()])].sort(
    (a, b) => a.localeCompare(b),
  )

  const activity: ResultsActivityRow[] = periods.map((period) => ({
    period,
    label: formatPeriodLabel(period, options.granularity),
    matchCount: activityBuckets.get(period) ?? 0,
  }))

  const winRate: ResultsWinRateRow[] = periods.map((period) => {
    const { wins, losses } = outcomeBuckets.get(period) ?? { wins: 0, losses: 0 }
    const decidedMatches = wins + losses
    const belowThreshold = decidedMatches < MIN_WIN_RATE_MATCHES

    return {
      period,
      label: formatPeriodLabel(period, options.granularity),
      winPercent:
        belowThreshold || decidedMatches === 0
          ? null
          : roundPercent(wins, decidedMatches),
      wins,
      losses,
      decidedMatches,
      belowThreshold,
    }
  })

  return { activity, winRate }
}
