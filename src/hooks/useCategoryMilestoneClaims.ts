import { useCallback, useMemo, useState } from 'react'
import {
  buildFrontierAutoClaims,
  categoryMilestoneCardKey,
  categoryMilestoneRoundKey,
} from '../lib/categoryMilestoneClaims'
import type { CategoryCompletionRow, ProgressionStage } from '../lib/tournamentProgression'

/** In-memory only — claims reset on page reload (prototype). */
export function useCategoryMilestoneClaims(rows: CategoryCompletionRow[]) {
  const frontierClaims = useMemo(() => buildFrontierAutoClaims(rows), [rows])
  const [manualClaims, setManualClaims] = useState<Set<string>>(() => new Set())

  const claimedKeys = useMemo(() => {
    const merged = new Set(frontierClaims)
    for (const key of manualClaims) merged.add(key)
    return merged
  }, [frontierClaims, manualClaims])

  const claimRound = useCallback((comboKey: string, stage: ProgressionStage) => {
    const id = categoryMilestoneRoundKey(comboKey, stage)
    setManualClaims((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const claimCard = useCallback((comboKey: string) => {
    const id = categoryMilestoneCardKey(comboKey)
    setManualClaims((prev) => {
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
