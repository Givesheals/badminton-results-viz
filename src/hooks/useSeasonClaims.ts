import { useCallback, useState } from 'react'
import { QUARTER_ACHIEVEMENT_ID } from '../lib/seasonJourney'

/** In-memory only — claims reset on page reload (prototype). */
export function useSeasonClaims(_playerName: string | null, _seasonId: string) {
  const [claimedKeys, setClaimedKeys] = useState<Set<string>>(() => new Set())

  const claimQuarter = useCallback((quarterKey: string) => {
    const id = `${quarterKey}:${QUARTER_ACHIEVEMENT_ID}`
    setClaimedKeys((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const isQuarterClaimed = useCallback(
    (quarterKey: string) => claimedKeys.has(`${quarterKey}:${QUARTER_ACHIEVEMENT_ID}`),
    [claimedKeys],
  )

  return {
    claimedKeys,
    claimQuarter,
    isQuarterClaimed,
  }
}
