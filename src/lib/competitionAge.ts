import type { SpreadsheetRow } from '../types/dataset'

const AGE_GROUP_HEADER_ALIASES = ['Age Group', 'Age'] as const
const SUB_AGE_GROUP_HEADER_ALIASES = ['Sub Age Group', 'subage'] as const

const TITLECASE_EXCEPTIONS = new Set(['u', 'o'])

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

export function normalizeCompetitionAgeToken(value: string | null): string | null {
  if (!value) return null
  const compact = normalizeWhitespace(value)
  if (!compact) return null

  const upper = compact.toUpperCase()
  if (/^U\d+$/.test(upper) || /^O\d+$/.test(upper)) return upper

  return compact
    .toLowerCase()
    .split(' ')
    .map((token) =>
      TITLECASE_EXCEPTIONS.has(token) ? token.toUpperCase() : token[0].toUpperCase() + token.slice(1),
    )
    .join(' ')
}

function readAliasedString(
  row: SpreadsheetRow,
  headers: readonly string[],
): string | null {
  for (const header of headers) {
    const value = row[header]
    if (value == null) continue
    const normalized = normalizeCompetitionAgeToken(String(value))
    if (normalized) return normalized
  }
  return null
}

export function readCompetitionAgeGroup(row: SpreadsheetRow): string | null {
  return readAliasedString(row, AGE_GROUP_HEADER_ALIASES)
}

export function readCompetitionSubAgeGroup(row: SpreadsheetRow): string | null {
  return readAliasedString(row, SUB_AGE_GROUP_HEADER_ALIASES)
}

const AGE_GROUP_PRIORITY = new Map([
  ['Junior', 0],
  ['Senior', 1],
  ['Masters', 2],
  ['Other', 3],
])

const TOP_LEVEL_VALUES = new Set(['Junior', 'Senior', 'Masters', 'Other'])

function compareSubAge(valueA: string, valueB: string): number {
  const upperA = valueA.toUpperCase()
  const upperB = valueB.toUpperCase()
  const uMatchA = /^U(\d+)$/.exec(upperA)
  const uMatchB = /^U(\d+)$/.exec(upperB)
  if (uMatchA && uMatchB) return Number(uMatchA[1]) - Number(uMatchB[1])
  if (uMatchA) return -1
  if (uMatchB) return 1

  if (valueA === 'Senior' && valueB !== 'Senior') return -1
  if (valueB === 'Senior' && valueA !== 'Senior') return 1
  if (valueA === 'Masters' && valueB !== 'Masters') return -1
  if (valueB === 'Masters' && valueA !== 'Masters') return 1

  const oMatchA = /^O(\d+)$/.exec(upperA)
  const oMatchB = /^O(\d+)$/.exec(upperB)
  if (oMatchA && oMatchB) return Number(oMatchA[1]) - Number(oMatchB[1])
  if (oMatchA) return -1
  if (oMatchB) return 1

  if (valueA === 'Other' && valueB !== 'Other') return -1
  if (valueB === 'Other' && valueA !== 'Other') return 1

  return valueA.localeCompare(valueB)
}

export function sortCompetitionAgeGroups(values: string[]): string[] {
  return [...values].sort((a, b) => {
    const rankA = AGE_GROUP_PRIORITY.get(a) ?? Number.POSITIVE_INFINITY
    const rankB = AGE_GROUP_PRIORITY.get(b) ?? Number.POSITIVE_INFINITY
    if (rankA !== rankB) return rankA - rankB
    return a.localeCompare(b)
  })
}

export function sortCompetitionSubAgeGroups(values: string[]): string[] {
  return [...values].sort(compareSubAge)
}

export function buildCombinedCompetitionAgeValues(
  ageGroups: string[],
  subAges: string[],
): string[] {
  const topLevel = sortCompetitionAgeGroups(ageGroups)
  const topLevelSet = new Set(topLevel)
  const subAgeOnly = subAges.filter((value) => !topLevelSet.has(value) && !TOP_LEVEL_VALUES.has(value))
  return [...topLevel, ...sortCompetitionSubAgeGroups(subAgeOnly)]
}
