import type { DisciplineFamily } from './disciplineStyle'
import { getDisciplineFamily } from './disciplineStyle'
import { isCompetitiveMatch } from './matchExclusions'
import { getPlayerRating } from './ratings'
import type { SeasonBounds } from './season'
import { dateToSeasonMs, filterMatchesInSeason } from './season'
import type { NormalizedMatch } from '../types/matchHistory'

export type SeasonRatingPoint = {
  date: string
  timestamp: number
  rating: number
  matchCount: number
  competitions: string[]
}

export type SeasonRatingSeries = {
  family: DisciplineFamily
  label: string
  color: string
  points: SeasonRatingPoint[]
}

const FAMILY_META: Record<
  Exclude<DisciplineFamily, 'unknown'>,
  { label: string; color: string }
> = {
  singles: { label: 'Singles', color: 'var(--color-discipline-singles)' },
  doubles: { label: 'Doubles', color: 'var(--color-discipline-doubles)' },
  mixed: { label: 'Mixed', color: 'var(--color-discipline-mixed)' },
}

const SERIES_FAMILIES: Exclude<DisciplineFamily, 'unknown'>[] = [
  'singles',
  'doubles',
  'mixed',
]

function sortByDateThenStable(a: NormalizedMatch, b: NormalizedMatch): number {
  const byDate = a.date.localeCompare(b.date)
  if (byDate !== 0) return byDate
  return a.competitionName.localeCompare(b.competitionName)
}

export function buildSeasonRatingSeries(
  matches: NormalizedMatch[],
  bounds: SeasonBounds,
  referenceDate = new Date(),
): SeasonRatingSeries[] {
  const refMs = referenceDate.getTime()
  const inSeason = filterMatchesInSeason(matches, bounds).filter((match) => {
    if (!isCompetitiveMatch(match)) return false
    const rating = getPlayerRating(match)
    if (rating == null) return false
    const ts = dateToSeasonMs(match.date)
    return ts != null && ts <= refMs
  })

  const byFamilyDate = new Map<string, NormalizedMatch[]>()

  for (const match of inSeason) {
    const family = getDisciplineFamily(match.discipline)
    if (family === 'unknown') continue
    const key = `${family}|${match.date}`
    const bucket = byFamilyDate.get(key) ?? []
    bucket.push(match)
    byFamilyDate.set(key, bucket)
  }

  const pointsByFamily = new Map<Exclude<DisciplineFamily, 'unknown'>, SeasonRatingPoint[]>()

  for (const [key, dayMatches] of byFamilyDate) {
    const [family] = key.split('|') as [Exclude<DisciplineFamily, 'unknown'>]
    const sorted = [...dayMatches].sort(sortByDateThenStable)
    const last = sorted[sorted.length - 1]!
    const rating = getPlayerRating(last)
    const ts = dateToSeasonMs(last.date)
    if (rating == null || ts == null) continue

    const competitions = [...new Set(sorted.map((m) => m.competitionName))]
    const point: SeasonRatingPoint = {
      date: last.date,
      timestamp: ts,
      rating,
      matchCount: sorted.length,
      competitions,
    }
    const list = pointsByFamily.get(family) ?? []
    list.push(point)
    pointsByFamily.set(family, list)
  }

  return SERIES_FAMILIES.map((family) => {
    const points = (pointsByFamily.get(family) ?? []).sort(
      (a, b) => a.timestamp - b.timestamp,
    )
    const meta = FAMILY_META[family]
    return {
      family,
      label: meta.label,
      color: meta.color,
      points,
    }
  })
}

export type SeasonRatingDelta = {
  family: DisciplineFamily
  label: string
  color: string
  delta: number | null
}

export function seasonRatingDeltas(series: SeasonRatingSeries[]): SeasonRatingDelta[] {
  return series.map((row) => {
    if (row.points.length < 2) {
      return { family: row.family, label: row.label, color: row.color, delta: null }
    }
    const delta =
      row.points[row.points.length - 1]!.rating - row.points[0]!.rating
    return { family: row.family, label: row.label, color: row.color, delta }
  })
}

export function formatSeasonRatingDelta(delta: number): string {
  const rounded = Math.round(delta)
  if (rounded > 0) return `+${rounded}`
  return String(rounded)
}

export type SeasonRatingDeltaTone = 'gain' | 'loss' | 'neutral'

export function seasonRatingDeltaTone(delta: number | null): SeasonRatingDeltaTone {
  if (delta == null) return 'neutral'
  const rounded = Math.round(delta)
  if (rounded > 0) return 'gain'
  if (rounded < 0) return 'loss'
  return 'neutral'
}

export function formatSeasonRatingDeltaInParens(delta: number | null): string {
  if (delta == null) return '(—)'
  const rounded = Math.round(delta)
  if (rounded > 0) return `(+${rounded})`
  if (rounded < 0) return `(${rounded})`
  return '(±0)'
}

export function ratingAxisDomainAndTicks(
  ratings: number[],
): { domain: [number, number]; ticks: number[] } {
  if (ratings.length === 0) {
    return { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] }
  }

  const min = Math.min(...ratings)
  const max = Math.max(...ratings)
  const pad = Math.max(20, Math.round((max - min) * 0.1) || 20)
  const rawMin = min - pad
  const rawMax = max + pad

  const domainMin = Math.floor(rawMin / 25) * 25
  const domainMax = Math.ceil(rawMax / 25) * 25

  const ticks: number[] = []
  for (let tick = domainMin; tick <= domainMax; tick += 25) {
    ticks.push(tick)
  }

  return {
    domain: [domainMin, domainMax],
    ticks: ticks.length > 0 ? ticks : [domainMin, domainMax],
  }
}
