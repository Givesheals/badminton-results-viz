import { useCallback, useState } from 'react'
import {
  categoryMilestoneCardKey,
  categoryMilestoneRoundKey,
} from '../lib/categoryMilestoneClaims'
import type { ProgressionStage } from '../lib/tournamentProgression'

/** In-memory only — claims reset on page reload (prototype). */
export function useCategoryMilestoneClaims(_playerName: string | null) {
  const [claimedKeys, setClaimedKeys] = useState<Set<string>>(() => new Set())

  const claimRound = useCallback((comboKey: string, stage: ProgressionStage) => {
    const id = categoryMilestoneRoundKey(comboKey, stage)
    setClaimedKeys((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const claimCard = useCallback((comboKey: string) => {
    const id = categoryMilestoneCardKey(comboKey)
    setClaimedKeys((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const isRoundClaimed = useCallback(
    (comboKey: string, stage: ProgressionStage) =>
      claimedKeys.has(categoryMilestoneRoundKey(comboKey, stage)),
    [claimedKeys],
  )

  const isCardClaimed = useCallback(
    (comboKey: string) => claimedKeys.has(categoryMilestoneCardKey(comboKey)),
    [claimedKeys],
  )

  return {
    claimedKeys,
    claimRound,
    claimCard,
    isRoundClaimed,
    isCardClaimed,
  }
}
