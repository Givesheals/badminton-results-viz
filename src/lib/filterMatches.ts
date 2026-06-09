import type { MatchFilters, FilterOptions } from '../types/filters'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  buildCombinedCompetitionAgeValues,
} from './competitionAge'
import { formatTournamentCategory } from './tournamentCategory'

export const SINGLES_PARTNER_VALUE = '__singles__'

function parseMatchDate(dateText: string): Date | null {
  const date = new Date(dateText)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isMatchInTimeRange(
  dateText: string,
  timeFilter: string,
  referenceDate = new Date(),
): boolean {
  if (timeFilter === 'all') return true

  const date = parseMatchDate(dateText)
  if (!date) return false

  if (/^\d{4}$/.test(timeFilter)) {
    return date.getFullYear() === Number(timeFilter)
  }

  const monthsMap: Record<string, number> = {
    '24m': 24,
    '12m': 12,
    '6m': 6,
    '3m': 3,
  }
  const months = monthsMap[timeFilter]
  if (months) {
    const cutoff = new Date(referenceDate)
    cutoff.setMonth(cutoff.getMonth() - months)
    cutoff.setHours(0, 0, 0, 0)
    return date >= cutoff
  }

  return true
}

export function filterMatches(
  matches: NormalizedMatch[],
  filters: MatchFilters,
  referenceDate = new Date(),
): NormalizedMatch[] {
  return matches.filter((match) => {
    if (filters.competition && match.tournamentCategory !== filters.competition) {
      return false
    }
    if (filters.discipline && match.discipline !== filters.discipline) {
      return false
    }
    if (filters.partner) {
      if (filters.partner === SINGLES_PARTNER_VALUE) {
        if (match.partnerName) return false
      } else if (match.partnerName !== filters.partner) {
        return false
      }
    }
    if (!isMatchInTimeRange(match.date, filters.time, referenceDate)) {
      return false
    }
    if (filters.competitionAge) {
      const isAgeMatch = match.competitionAgeGroup === filters.competitionAge
      const isSubAgeMatch = match.competitionSubAgeGroup === filters.competitionAge
      if (!isAgeMatch && !isSubAgeMatch) return false
    }
    return true
  })
}

export function buildFilterOptions(matches: NormalizedMatch[]): FilterOptions {
  const competitionMap = new Map<string, string>()
  const disciplineMap = new Map<string, string>()
  const partnerSet = new Set<string>()
  let hasSingles = false
  const years = new Set<number>()
  const competitionAgeGroupSet = new Set<string>()
  const competitionSubAgeGroupSet = new Set<string>()

  for (const match of matches) {
    const { value, label } = formatTournamentCategory(match.raw['Tournament Category'])
    competitionMap.set(value, label)

    disciplineMap.set(match.discipline, match.disciplineLabel)

    if (match.partnerName) {
      partnerSet.add(match.partnerName)
    } else {
      hasSingles = true
    }

    const date = parseMatchDate(match.date)
    if (date) years.add(date.getFullYear())
    if (match.competitionAgeGroup) competitionAgeGroupSet.add(match.competitionAgeGroup)
    if (match.competitionSubAgeGroup) {
      competitionSubAgeGroupSet.add(match.competitionSubAgeGroup)
    }
  }

  const competitions = [...competitionMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const disciplines = [...disciplineMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))

  const partners: FilterOptions['partners'] = [...partnerSet]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ value: name, label: name }))

  if (hasSingles) {
    partners.unshift({ value: SINGLES_PARTNER_VALUE, label: 'Singles (no partner)' })
  }

  const timeRanges: FilterOptions['timeRanges'] = [
    { value: 'all', label: 'All time' },
    { value: '24m', label: 'Last 24 months' },
    { value: '12m', label: 'Last 12 months' },
    { value: '6m', label: 'Last 6 months' },
    { value: '3m', label: 'Last 3 months' },
    ...[...years]
      .sort((a, b) => b - a)
      .map((year) => ({ value: String(year), label: String(year) })),
  ]

  const competitionAges: FilterOptions['competitionAges'] =
    buildCombinedCompetitionAgeValues(
      [...competitionAgeGroupSet],
      [...competitionSubAgeGroupSet],
    ).map((value) => ({
      value,
      label: value,
    }))

  return {
    competitions,
    disciplines,
    partners,
    timeRanges,
    competitionAges,
  }
}

export function hasActiveFilters(filters: MatchFilters): boolean {
  return Boolean(
    filters.competition ||
      filters.discipline ||
      filters.partner ||
      filters.time !== 'all' ||
      filters.competitionAge,
  )
}
