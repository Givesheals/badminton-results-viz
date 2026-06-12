import type { SeasonAccoladesData } from './seasonTrophyCabinet'

export const SHARE_ACCOLADE_LIMIT = 3
export const SHARE_ROW_LIMIT = 5
export const SHARE_PARTNER_LIMIT = 2

export function sliceAccoladesForShare(
  accolades: SeasonAccoladesData,
  limit: number = SHARE_ACCOLADE_LIMIT,
): SeasonAccoladesData {
  let remaining = limit

  const takeFrom = <T,>(items: T[]): T[] => {
    if (remaining <= 0) return []
    const slice = items.slice(0, remaining)
    remaining -= slice.length
    return slice
  }

  return {
    podium: {
      first: takeFrom(accolades.podium.first),
      second: takeFrom(accolades.podium.second),
      third: takeFrom(accolades.podium.third),
    },
    personalBests: takeFrom(accolades.personalBests),
    totalPodiumCount: accolades.totalPodiumCount,
  }
}

export function sliceRowsForShare<T>(rows: T[], limit: number = SHARE_ROW_LIMIT): T[] {
  return rows.slice(0, limit)
}
