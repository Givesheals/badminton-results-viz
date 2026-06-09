import type { MatchFilters } from '../types/filters'
import type { FilterField } from '../types/sectionFilters'

export function countActiveSectionFilters(filters: MatchFilters, fields: FilterField[]): number {
  return fields.reduce((count, field) => {
    if (field === 'time') {
      return count + (filters.time !== 'all' ? 1 : 0)
    }
    return count + (filters[field] ? 1 : 0)
  }, 0)
}
