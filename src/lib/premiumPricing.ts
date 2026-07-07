export type PremiumPlan = 'monthly' | 'yearly'

export const PREMIUM_MONTHLY_PRICE_GBP = 6.99
export const PREMIUM_YEARLY_PRICE_GBP = 59.99
export const PREMIUM_YEARLY_SAVINGS_GBP = 23.89
export const PREMIUM_VERIFICATION_GRACE_DAYS = 7

/** Demo BE numbers that simulate "already subscribed by another account". */
export const DEMO_BE_NUMBER_TAKEN = '1000001'

export function formatPriceGbp(amount: number): string {
  return `£${amount.toFixed(2)}`
}

export function planLabel(plan: PremiumPlan): string {
  return plan === 'monthly' ? 'Monthly' : 'Yearly'
}

export function planPriceGbp(plan: PremiumPlan): number {
  return plan === 'monthly' ? PREMIUM_MONTHLY_PRICE_GBP : PREMIUM_YEARLY_PRICE_GBP
}

export function planBillingDescription(plan: PremiumPlan): string {
  if (plan === 'monthly') {
    return `${formatPriceGbp(PREMIUM_MONTHLY_PRICE_GBP)}/month`
  }
  return `${formatPriceGbp(PREMIUM_YEARLY_PRICE_GBP)}/year`
}
