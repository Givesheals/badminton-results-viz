import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_BE_NUMBER_TAKEN, type PremiumPlan } from '../lib/premiumPricing'
import {
  clearPremiumState,
  loadPremiumState,
  savePremiumState,
  type StoredPremiumState,
} from '../lib/premiumStorage'

type BeNumberCheckResult =
  | { status: 'available' }
  | { status: 'taken_by_other' }
  | { status: 'owned_by_you' }

type PremiumContextValue = {
  premium: StoredPremiumState | null
  isSubscribed: boolean
  isPremiumActive: boolean
  checkBeNumber: (beNumber: string) => BeNumberCheckResult
  subscribe: (input: {
    playerName: string
    beNumber: string
    receiptEmail: string
    plan: PremiumPlan
  }) => void
  clearSubscription: () => void
}

const PremiumContext = createContext<PremiumContextValue | null>(null)

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [premium, setPremium] = useState<StoredPremiumState | null>(() => loadPremiumState())

  const persist = useCallback((next: StoredPremiumState | null) => {
    setPremium(next)
    if (next) savePremiumState(next)
    else clearPremiumState()
  }, [])

  const checkBeNumber = useCallback(
    (beNumber: string): BeNumberCheckResult => {
      const trimmed = beNumber.trim()
      if (trimmed === DEMO_BE_NUMBER_TAKEN) {
        return { status: 'taken_by_other' }
      }
      if (premium?.beNumber === trimmed) {
        return { status: 'owned_by_you' }
      }
      return { status: 'available' }
    },
    [premium],
  )

  const subscribe = useCallback(
    (input: {
      playerName: string
      beNumber: string
      receiptEmail: string
      plan: PremiumPlan
    }) => {
      const next: StoredPremiumState = {
        playerName: input.playerName,
        beNumber: input.beNumber.trim(),
        receiptEmail: input.receiptEmail.trim(),
        plan: input.plan,
        subscribedAt: new Date().toISOString(),
      }
      persist(next)
    },
    [persist],
  )

  const clearSubscription = useCallback(() => {
    persist(null)
  }, [persist])

  const isSubscribed = premium != null
  const isPremiumActive = isSubscribed

  const value = useMemo(
    () => ({
      premium,
      isSubscribed,
      isPremiumActive,
      checkBeNumber,
      subscribe,
      clearSubscription,
    }),
    [premium, isSubscribed, isPremiumActive, checkBeNumber, subscribe, clearSubscription],
  )

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
}

export function usePremium() {
  const ctx = useContext(PremiumContext)
  if (!ctx) {
    throw new Error('usePremium must be used within PremiumProvider')
  }
  return ctx
}
