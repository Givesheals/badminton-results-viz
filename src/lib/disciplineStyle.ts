/** Visual family for match discipline codes (singles / doubles / mixed). */
export type DisciplineFamily = 'singles' | 'doubles' | 'mixed' | 'unknown'

export type DisciplineStyle = {
  family: DisciplineFamily
  chipLabel: string
  chipClass: string
  borderClass: string
  rowBgClass: string
}

const SINGLES_CODES = new Set(['MS', 'WS', 'OS'])
const DOUBLES_CODES = new Set(['MD', 'WD', 'OD'])
const MIXED_CODES = new Set(['XD'])

export function isSinglesDiscipline(code: string): boolean {
  return SINGLES_CODES.has(code.trim().toUpperCase())
}

export function isDoublesDiscipline(code: string): boolean {
  return DOUBLES_CODES.has(code.trim().toUpperCase())
}

export function getDisciplineFamily(code: string): DisciplineFamily {
  const key = code.trim().toUpperCase()
  if (MIXED_CODES.has(key)) return 'mixed'
  if (SINGLES_CODES.has(key)) return 'singles'
  if (DOUBLES_CODES.has(key)) return 'doubles'
  return 'unknown'
}

export type SelectableDisciplineFamily = Exclude<DisciplineFamily, 'unknown'>

export const SELECTABLE_DISCIPLINE_FAMILIES: SelectableDisciplineFamily[] = [
  'singles',
  'doubles',
  'mixed',
]

export const DISCIPLINE_FAMILY_LABELS: Record<SelectableDisciplineFamily, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed: 'Mixed',
}

/** Representative code per family for styling helpers. */
export const DISCIPLINE_FAMILY_REPRESENTATIVE: Record<SelectableDisciplineFamily, string> = {
  singles: 'MS',
  doubles: 'MD',
  mixed: 'XD',
}

export function getDisciplineFamilyStyle(family: SelectableDisciplineFamily) {
  return FAMILY_STYLES[family]
}

const FAMILY_STYLES: Record<
  DisciplineFamily,
  Pick<DisciplineStyle, 'chipClass' | 'borderClass' | 'rowBgClass'>
> = {
  singles: {
    chipClass: 'bg-discipline-singles text-white',
    borderClass: 'border-l-discipline-singles',
    rowBgClass: 'bg-discipline-singles-soft',
  },
  doubles: {
    chipClass: 'bg-discipline-doubles text-white',
    borderClass: 'border-l-discipline-doubles',
    rowBgClass: 'bg-discipline-doubles-soft',
  },
  mixed: {
    chipClass: 'bg-discipline-mixed text-white',
    borderClass: 'border-l-discipline-mixed',
    rowBgClass: 'bg-discipline-mixed-soft',
  },
  unknown: {
    chipClass: 'bg-ink-100 text-ink-700',
    borderClass: 'border-l-ink-200',
    rowBgClass: 'bg-ink-50/40',
  },
}

export function getDisciplineStyle(code: string): DisciplineStyle {
  const key = code.trim().toUpperCase()
  const family = getDisciplineFamily(key)
  const base = FAMILY_STYLES[family]
  return {
    family,
    chipLabel: key || '?',
    ...base,
  }
}
