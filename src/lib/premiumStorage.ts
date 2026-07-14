import type { PremiumPlan } from './premiumPricing'

const STORAGE_KEY = 'badminton-premium:v1'

export type StoredPremiumState = {
  playerName: string
  beNumber: string
  receiptEmail: string
  plan: PremiumPlan
  subscribedAt: string
}

export function loadPremiumState(): StoredPremiumState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredPremiumState>
    if (
      typeof parsed.playerName !== 'string' ||
      typeof parsed.beNumber !== 'string' ||
      typeof parsed.receiptEmail !== 'string' ||
      (parsed.plan !== 'monthly' && parsed.plan !== 'yearly') ||
      typeof parsed.subscribedAt !== 'string'
    ) {
      return null
    }
    return {
      playerName: parsed.playerName,
      beNumber: parsed.beNumber,
      receiptEmail: parsed.receiptEmail,
      plan: parsed.plan,
      subscribedAt: parsed.subscribedAt,
    }
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
