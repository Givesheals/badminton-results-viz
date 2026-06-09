import { useMemo } from 'react'
import { filterMatches } from '../lib/filterMatches'
import type { MatchFilters } from '../types/filters'
import type { NormalizedMatch } from '../types/matchHistory'

export function useSectionMatches(
  allMatches: NormalizedMatch[],
  filters: MatchFilters,
): NormalizedMatch[] {
  return useMemo(
    () => filterMatches(allMatches, filters),
    [allMatches, filters],
  )
}
