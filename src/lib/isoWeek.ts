/** ISO 8601 week date: weeks start Monday, and week 1 contains the first Thursday. */

export type IsoWeek = {
  isoYear: number
  week: number
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Thursday of the ISO week that contains this local calendar day. */
function thursdayOfWeek(date: Date): Date {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum)
  return utc
}

export function isoWeekOf(date: Date): IsoWeek {
  const thursday = thursdayOfWeek(date)
  const isoYear = thursday.getUTCFullYear()
  const yearStart = new Date(Date.UTC(isoYear, 0, 1))
  const week = Math.ceil(((thursday.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { isoYear, week }
}

export function currentIsoWeek(now = new Date()): IsoWeek {
  return isoWeekOf(now)
}

/** ISO years have 53 weeks when 1 January is a Thursday, or a Wednesday in a leap year. */
export function weeksInIsoYear(isoYear: number): number {
  const jan1 = new Date(Date.UTC(isoYear, 0, 1)).getUTCDay()
  if (jan1 === 4 || (isLeapYear(isoYear) && jan1 === 3)) return 53
  return 52
}

export function isoWeekRange(isoYear: number, week: number): { start: Date; end: Date } {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  const start = new Date(jan4)
  start.setUTCDate(jan4.getUTCDate() - (jan4Day - 1) + (week - 1) * 7)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  return { start, end }
}

function formatWeekdayDate(date: Date): string {
  const weekday = WEEKDAYS[date.getUTCDay()]
  const month = MONTHS[date.getUTCMonth()]
  return `${weekday}, ${month} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

export function formatIsoWeekRangeLabel(isoYear: number, week: number): string {
  const { start, end } = isoWeekRange(isoYear, week)
  return `Week ${week} runs from ${formatWeekdayDate(start)} to ${formatWeekdayDate(end)}`
}

export function formatIsoWeekNumber(week: number): string {
  return String(week).padStart(2, '0')
}
