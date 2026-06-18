/** Badminton season runs 1 Oct – 30 Sep. Season id e.g. `2025-26`. */

export const SEASON_START_MONTH = 9 // October (0-indexed)

export type SeasonBounds = {
  seasonId: string
  startYear: number
  /** ISO date yyyy-mm-dd */
  startDate: string
  /** ISO date yyyy-mm-dd */
  endDate: string
}

export type SeasonQuarterSlot = {
  quarter: 1 | 2 | 3 | 4
  key: string
  label: string
  shortLabel: string
  startDate: string
  endDate: string
}

const QUARTER_SHORT_LABELS = ['Sep–Nov', 'Dec–Feb', 'Mar–May', 'Jun–Aug'] as const

function parseIsoDate(isoDate: string): Date | null {
  const date = new Date(`${isoDate}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function lastDayOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex + 1, 0, 12, 0, 0, 0)
}

/** Calendar year that begins the season containing `date`. */
export function getSeasonStartYear(date: Date): number {
  return date.getMonth() >= SEASON_START_MONTH ? date.getFullYear() : date.getFullYear() - 1
}

export function formatSeasonId(startYear: number): string {
  const endSuffix = String((startYear + 1) % 100).padStart(2, '0')
  return `${startYear}-${endSuffix}`
}

export function parseSeasonId(seasonId: string): number | null {
  const match = /^(\d{4})-\d{2}$/.exec(seasonId.trim())
  if (!match) return null
  return Number(match[1])
}

export function getSeasonForDate(
  dateText: string,
  referenceDate = new Date(),
): string | null {
  const date = parseIsoDate(dateText)
  if (!date) return getSeasonForReferenceDate(referenceDate)
  return formatSeasonId(getSeasonStartYear(date))
}

export function getSeasonForReferenceDate(referenceDate = new Date()): string {
  return formatSeasonId(getSeasonStartYear(referenceDate))
}

export function getSeasonBounds(seasonId: string): SeasonBounds | null {
  const startYear = parseSeasonId(seasonId)
  if (startYear == null) return null

  const start = new Date(startYear, SEASON_START_MONTH, 1, 12, 0, 0, 0)
  const end = lastDayOfMonth(startYear + 1, SEASON_START_MONTH - 1)

  return {
    seasonId,
    startYear,
    startDate: toIsoDate(start),
    endDate: toIsoDate(end),
  }
}

export function formatSeasonTitle(seasonId: string): string {
  const startYear = parseSeasonId(seasonId)
  if (startYear == null) return seasonId
  const endYear = startYear + 1
  const endSuffix = String(endYear % 100).padStart(2, '0')
  return `Season ${startYear}/${endSuffix}`
}

export function formatSeasonRangeSubtitle(bounds: SeasonBounds): string {
  const start = parseIsoDate(bounds.startDate)
  const end = parseIsoDate(bounds.endDate)
  if (!start || !end) return `${bounds.startDate} – ${bounds.endDate}`

  const fmt = (d: Date) =>
    `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getFullYear()}`

  return `${fmt(start)} – ${fmt(end)}`
}

export function isDateInSeason(dateText: string, bounds: SeasonBounds): boolean {
  const date = parseIsoDate(dateText)
  const start = parseIsoDate(bounds.startDate)
  const end = parseIsoDate(bounds.endDate)
  if (!date || !start || !end) return false
  return date >= start && date <= end
}

export function filterMatchesInSeason<T extends { date: string }>(
  items: T[],
  bounds: SeasonBounds,
): T[] {
  return items.filter((item) => isDateInSeason(item.date, bounds))
}

/** Season quarter 1–4 for a date inside the season calendar. */
export function seasonQuarterNumber(date: Date): 1 | 2 | 3 | 4 {
  const month = date.getMonth()
  if (month >= 8 && month <= 10) return 1
  if (month === 11 || month <= 1) return 2
  if (month >= 2 && month <= 4) return 3
  return 4
}

export function seasonQuarterKey(seasonId: string, quarter: 1 | 2 | 3 | 4): string {
  return `${seasonId}-Q${quarter}`
}

export function formatSeasonQuarterLabel(seasonId: string, quarter: 1 | 2 | 3 | 4): string {
  const startYear = parseSeasonId(seasonId)
  if (startYear == null) return `Q${quarter}`
  const range = QUARTER_SHORT_LABELS[quarter - 1]
  const year = quarter === 1 ? startYear : startYear + 1
  return `Q${quarter} · ${range} ${year}`
}

export function getSeasonQuarterBounds(
  seasonId: string,
  quarter: 1 | 2 | 3 | 4,
): { startDate: string; endDate: string } | null {
  const startYear = parseSeasonId(seasonId)
  if (startYear == null) return null

  switch (quarter) {
    case 1:
      return {
        startDate: toIsoDate(new Date(startYear, 8, 1, 12, 0, 0, 0)),
        endDate: toIsoDate(lastDayOfMonth(startYear, 10)),
      }
    case 2:
      return {
        startDate: toIsoDate(new Date(startYear, 11, 1, 12, 0, 0, 0)),
        endDate: toIsoDate(lastDayOfMonth(startYear + 1, 1)),
      }
    case 3:
      return {
        startDate: toIsoDate(new Date(startYear + 1, 2, 1, 12, 0, 0, 0)),
        endDate: toIsoDate(lastDayOfMonth(startYear + 1, 4)),
      }
    case 4:
      return {
        startDate: toIsoDate(new Date(startYear + 1, 5, 1, 12, 0, 0, 0)),
        endDate: toIsoDate(lastDayOfMonth(startYear + 1, 7)),
      }
    default:
      return null
  }
}

function clipRangeToSeason(
  rangeStart: Date,
  rangeEnd: Date,
  seasonBounds: SeasonBounds,
): { startDate: string; endDate: string } | null {
  const seasonStart = parseIsoDate(seasonBounds.startDate)
  const seasonEnd = parseIsoDate(seasonBounds.endDate)
  if (!seasonStart || !seasonEnd) return null

  const start = rangeStart < seasonStart ? seasonStart : rangeStart
  const end = rangeEnd > seasonEnd ? seasonEnd : rangeEnd
  if (start > end) return null

  return { startDate: toIsoDate(start), endDate: toIsoDate(end) }
}

/** In-season date windows for a quarter (Q1 can appear at the start and end of the season). */
export function getInSeasonQuarterSegments(
  seasonId: string,
  quarter: 1 | 2 | 3 | 4,
): { startDate: string; endDate: string }[] {
  const startYear = parseSeasonId(seasonId)
  const seasonBounds = getSeasonBounds(seasonId)
  if (startYear == null || seasonBounds == null) return []

  const ranges: { start: Date; end: Date }[] = []

  switch (quarter) {
    case 1:
      ranges.push(
        { start: new Date(startYear, 8, 1, 12, 0, 0, 0), end: lastDayOfMonth(startYear, 10) },
        { start: new Date(startYear + 1, 8, 1, 12, 0, 0, 0), end: lastDayOfMonth(startYear + 1, 8) },
      )
      break
    case 2:
      ranges.push({
        start: new Date(startYear, 11, 1, 12, 0, 0, 0),
        end: lastDayOfMonth(startYear + 1, 1),
      })
      break
    case 3:
      ranges.push({
        start: new Date(startYear + 1, 2, 1, 12, 0, 0, 0),
        end: lastDayOfMonth(startYear + 1, 4),
      })
      break
    case 4:
      ranges.push({
        start: new Date(startYear + 1, 5, 1, 12, 0, 0, 0),
        end: lastDayOfMonth(startYear + 1, 7),
      })
      break
    default:
      break
  }

  return ranges
    .map((range) => clipRangeToSeason(range.start, range.end, seasonBounds))
    .filter((segment): segment is { startDate: string; endDate: string } => segment != null)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function listSeasonQuarters(seasonId: string): SeasonQuarterSlot[] {
  return ([1, 2, 3, 4] as const).map((quarter) => {
    const bounds = getSeasonQuarterBounds(seasonId, quarter)!
    return {
      quarter,
      key: seasonQuarterKey(seasonId, quarter),
      label: formatSeasonQuarterLabel(seasonId, quarter),
      shortLabel: `Q${quarter}`,
      startDate: bounds.startDate,
      endDate: bounds.endDate,
    }
  })
}

export function seasonQuarterKeyForDate(dateText: string, seasonId: string): string | null {
  const date = parseIsoDate(dateText)
  if (!date || !isDateInSeason(dateText, getSeasonBounds(seasonId)!)) return null
  const q = seasonQuarterNumber(date)
  return seasonQuarterKey(seasonId, q)
}

export type SeasonQuarterPhase = 'future' | 'active' | 'past'

export function getSeasonQuarterPhase(
  quarter: Pick<SeasonQuarterSlot, 'quarter' | 'startDate' | 'endDate' | 'key'>,
  referenceDate = new Date(),
): SeasonQuarterPhase {
  const ref = new Date(referenceDate)
  ref.setHours(12, 0, 0, 0)

  const seasonId = quarter.key.replace(/-Q\d$/, '')
  const segments = getInSeasonQuarterSegments(seasonId, quarter.quarter)
  const ranges =
    segments.length > 0
      ? segments
      : [{ startDate: quarter.startDate, endDate: quarter.endDate }]

  if (ranges.some((range) => {
    const start = parseIsoDate(range.startDate)
    const end = parseIsoDate(range.endDate)
    return start != null && end != null && ref >= start && ref <= end
  })) {
    return 'active'
  }

  const firstStart = parseIsoDate(ranges[0]!.startDate)
  const lastEnd = parseIsoDate(ranges[ranges.length - 1]!.endDate)
  if (!firstStart || !lastEnd) return 'past'

  if (ref < firstStart) return 'future'
  if (ref > lastEnd) return 'past'

  // Between non-contiguous segments for the same quarter (e.g. Q1 after Nov, before Sep).
  return 'past'
}

export function dateToSeasonMs(isoDate: string): number | null {
  const date = parseIsoDate(isoDate)
  return date ? date.getTime() : null
}
