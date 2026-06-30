import type { PremiumPlan } from './premiumPricing'

const STORAGE_KEY = 'badminton-premium:v1'

export type StoredPremiumState = {
  playerName: string
  beNumber: string
  receiptEmail: string
  plan: PremiumPlan
  subscribedAt: string
  verificationCode: string
  verifiedAt: string | null
  verificationDeadline: string
}

export function loadPremiumState(): StoredPremiumState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredPremiumState
  } catch {
    return null
  }
}

export function savePremiumState(state: StoredPremiumState): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function clearPremiumState(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
