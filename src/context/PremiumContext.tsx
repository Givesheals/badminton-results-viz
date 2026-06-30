import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DEMO_BE_NUMBER_TAKEN, PREMIUM_VERIFICATION_GRACE_DAYS, type PremiumPlan } from '../lib/premiumPricing'
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
  isVerified: boolean
  isPremiumActive: boolean
  isWithinGracePeriod: boolean
  checkBeNumber: (beNumber: string) => BeNumberCheckResult
  subscribe: (input: {
    playerName: string
    beNumber: string
    receiptEmail: string
    plan: PremiumPlan
  }) => string
  verifyEmail: (code: string) => boolean
  clearSubscription: () => void
}

const PremiumContext = createContext<PremiumContextValue | null>(null)

function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function addDays(iso: string, days: number): string {
  const date = new Date(iso)
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

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
    }): string => {
      const subscribedAt = new Date().toISOString()
      const verificationCode = generateVerificationCode()
      const next: StoredPremiumState = {
        playerName: input.playerName,
        beNumber: input.beNumber.trim(),
        receiptEmail: input.receiptEmail.trim(),
        plan: input.plan,
        subscribedAt,
        verificationCode,
        verifiedAt: null,
        verificationDeadline: addDays(subscribedAt, PREMIUM_VERIFICATION_GRACE_DAYS),
      }
      persist(next)
      return verificationCode
    },
    [persist],
  )

  const verifyEmail = useCallback(
    (code: string): boolean => {
      if (!premium || premium.verifiedAt) return false
      if (code.trim() !== premium.verificationCode) return false
      const next: StoredPremiumState = {
        ...premium,
        verifiedAt: new Date().toISOString(),
      }
      persist(next)
      return true
    },
    [premium, persist],
  )

  const clearSubscription = useCallback(() => {
    persist(null)
  }, [persist])

  const isSubscribed = premium != null
  const isVerified = premium?.verifiedAt != null
  const isWithinGracePeriod =
    premium != null && new Date() <= new Date(premium.verificationDeadline)
  const isPremiumActive = isSubscribed && (isVerified || isWithinGracePeriod)

  const value = useMemo(
    () => ({
      premium,
      isSubscribed,
      isVerified,
      isPremiumActive,
      isWithinGracePeriod,
      checkBeNumber,
      subscribe,
      verifyEmail,
      clearSubscription,
    }),
    [
      premium,
      isSubscribed,
      isVerified,
      isPremiumActive,
      isWithinGracePeriod,
      checkBeNumber,
      subscribe,
      verifyEmail,
      clearSubscription,
    ],
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
