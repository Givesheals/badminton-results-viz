export type MatchFilters = {
  /** Raw tournament category value; empty string = all. */
  competition: string
  /** Discipline code (WD, XD, WS); empty = all. */
  discipline: string
  /** Partner name, `__singles__` for no partner, empty = all. */
  partner: string
  /** `all`, `12m`, `6m`, `3m`, or a year e.g. `2025`. */
  time: string
  /** Competition-level age filter; empty = all. */
  competitionAge: string
}

export const DEFAULT_MATCH_FILTERS: MatchFilters = {
  competition: '',
  discipline: '',
  partner: '',
  time: 'all',
  competitionAge: '',
}

export type FilterOption = {
  value: string
  label: string
}

export type FilterOptions = {
  competitions: FilterOption[]
  disciplines: FilterOption[]
  partners: FilterOption[]
  timeRanges: FilterOption[]
  competitionAges: FilterOption[]
}
