import { useCallback, useEffect, useMemo, useState } from 'react'
import { QUARTER_ACHIEVEMENT_ID, quarterClaimStorageKey } from '../lib/seasonJourney'

function readClaims(storageKey: string): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((x): x is string => typeof x === 'string'))
  } catch {
    return new Set()
  }
}

function writeClaims(storageKey: string, claims: Set<string>): void {
  window.localStorage.setItem(storageKey, JSON.stringify([...claims]))
}

export function useSeasonClaims(playerName: string | null, seasonId: string) {
  const storageKey = useMemo(
    () => quarterClaimStorageKey(playerName, seasonId),
    [playerName, seasonId],
  )

  const [claimedKeys, setClaimedKeys] = useState<Set<string>>(() => readClaims(storageKey))

  useEffect(() => {
    setClaimedKeys(readClaims(storageKey))
  }, [storageKey])

  const claimQuarter = useCallback(
    (quarterKey: string) => {
      const id = `${quarterKey}:${QUARTER_ACHIEVEMENT_ID}`
      setClaimedKeys((prev) => {
        if (prev.has(id)) return prev
        const next = new Set(prev)
        next.add(id)
        writeClaims(storageKey, next)
        return next
      })
    },
    [storageKey],
  )

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
