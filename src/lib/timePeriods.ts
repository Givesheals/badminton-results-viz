/** Calendar quarter key, e.g. `2025-Q1`. */
export function quarterKey(dateText: string): string | null {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return null
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${date.getFullYear()}-Q${quarter}`
}

/** Calendar year key, e.g. `2025`. */
export function yearKey(dateText: string): string | null {
  const date = new Date(dateText)
  if (Number.isNaN(date.getTime())) return null
  return String(date.getFullYear())
}

export type TimeGranularity = 'year' | 'quarter'

export type ResultsTimeRange = 'all' | '2y' | '5y'

const QUARTER_RANGE_LABELS = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'] as const

const AUTO_YEAR_THRESHOLD_YEARS = 3

export function formatQuarterLabel(key: string): string {
  const match = /^(\d{4})-Q([1-4])$/.exec(key)
  if (!match) return key
  const year = match[1]
  const quarter = Number(match[2])
  return `${QUARTER_RANGE_LABELS[quarter - 1]} ${year}`
}

export function formatYearLabel(key: string): string {
  return key
}

export function periodKey(dateText: string, granularity: TimeGranularity): string | null {
  return granularity === 'year' ? yearKey(dateText) : quarterKey(dateText)
}

export function formatPeriodLabel(key: string, granularity: TimeGranularity): string {
  return granularity === 'year' ? formatYearLabel(key) : formatQuarterLabel(key)
}

export function inferDefaultGranularity(
  dateTexts: string[],
): TimeGranularity {
  const times = dateTexts
    .map((d) => new Date(d).getTime())
    .filter((t) => !Number.isNaN(t))

  if (times.length === 0) return 'quarter'

  const min = Math.min(...times)
  const max = Math.max(...times)
  const spanYears = (max - min) / (365.25 * 24 * 60 * 60 * 1000)

  return spanYears > AUTO_YEAR_THRESHOLD_YEARS ? 'year' : 'quarter'
}

export function filterMatchesByResultsRange<T extends { date: string }>(
  items: T[],
  range: ResultsTimeRange,
  referenceDate = new Date(),
): T[] {
  if (range === 'all') return items

  const months = range === '2y' ? 24 : 60
  const cutoff = new Date(referenceDate)
  cutoff.setMonth(cutoff.getMonth() - months)
  cutoff.setHours(0, 0, 0, 0)

  return items.filter((item) => {
    const date = new Date(item.date)
    if (Number.isNaN(date.getTime())) return false
    return date >= cutoff
  })
}
