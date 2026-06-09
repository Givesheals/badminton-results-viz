import { useEffect } from 'react'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../types/filters'

export function useResetFiltersOnImport(
  importedAt: string | undefined,
  setFilters: (filters: MatchFilters) => void,
) {
  useEffect(() => {
    setFilters(DEFAULT_MATCH_FILTERS)
  }, [importedAt, setFilters])
}
