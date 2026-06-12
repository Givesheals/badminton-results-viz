/** Badminfo-style tournament level chips (Gold / Silver / Bronze / Copper / County). */
export type TournamentCategoryChipStyle = {
  label: string
  chipClass: string
}

const LEVEL_CHIP_TEXT = 'font-semibold text-level-medal-text'

const LEVEL_STYLES: Record<string, string> = {
  gold: 'bg-level-gold',
  silver: 'bg-level-silver',
  bronze: 'bg-level-bronze',
  copper: 'bg-level-copper',
}

const OTHER_CHIP_CLASS = 'bg-white font-semibold text-brand-700 ring-1 ring-inset ring-brand-200'

const LEVEL_CHART_COLORS: Record<string, string> = {
  gold: 'var(--color-level-gold)',
  silver: 'var(--color-level-silver)',
  bronze: 'var(--color-level-bronze)',
  copper: 'var(--color-level-copper)',
  county: 'var(--color-level-county)',
}

/** Fill colour for charts — matches tournament level chip colours. */
export function getTournamentLevelChartColor(label: string): string {
  const normalized = label.trim().toLowerCase()
  return LEVEL_CHART_COLORS[normalized] ?? 'var(--color-brand-400)'
}

export function tournamentLevelChartNeedsStroke(label: string): boolean {
  const normalized = label.trim().toLowerCase()
  return normalized === 'gold' || normalized === 'silver' || normalized === 'other'
}

export function getTournamentCategoryChipStyle(label: string): TournamentCategoryChipStyle | null {
  const normalized = label.trim().toLowerCase()
  if (normalized === '') return null

  if (normalized === 'county') {
    return {
      label: 'County',
      chipClass: 'bg-level-county font-semibold text-white',
    }
  }

  if (normalized === 'other' || LEVEL_STYLES[normalized] == null) {
    const displayLabel =
      normalized === 'other' ? 'Other' : label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()
    return {
      label: displayLabel,
      chipClass: OTHER_CHIP_CLASS,
    }
  }

  return {
    label: label.charAt(0).toUpperCase() + label.slice(1).toLowerCase(),
    chipClass: `${LEVEL_STYLES[normalized]} ${LEVEL_CHIP_TEXT}`,
  }
}
