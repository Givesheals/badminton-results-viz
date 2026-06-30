import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BetaBadge } from '../ui/BetaBadge'
import { getPlayerInitials } from '../../lib/getPlayerInitials'
import { usePremium } from '../../context/PremiumContext'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onSignUpPremium: () => void
  onVerifyEmail: () => void
  onManageSubscription: () => void
}

function InertLink({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="text-left text-base font-medium text-brand-700 hover:text-brand-600"
      onClick={(event) => event.preventDefault()}
    >
      {children}
    </button>
  )
}

export function UserMenuDrawer({
  open,
  onClose,
  playerName,
  onSignUpPremium,
  onVerifyEmail,
  onManageSubscription,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { premium, isSubscribed, isVerified, isPremiumActive } = usePremium()
  const initials = getPlayerInitials(playerName)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div className="fixed inset-0 z-40 bg-ink-900/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden>
              🏸
            </span>
            <span id={titleId} className="text-lg font-bold italic text-brand-600">
              BADMINFO
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-xl font-semibold text-white"
              aria-hidden
            >
              {initials}
            </div>
            <p className="mt-3 text-sm text-ink-700">
              {playerName}
              {premium?.beNumber ? `: ${premium.beNumber}` : ''}
            </p>
            <InertLink>Profile &amp; Results</InertLink>
          </div>

          <hr className="my-6 border-ink-100" />

          {!isSubscribed && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onSignUpPremium()
              }}
              className="mb-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-base font-semibold text-white hover:bg-brand-700"
            >
              Sign up for Premium
              <BetaBadge />
            </button>
          )}

          {isSubscribed && !isVerified && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onVerifyEmail()
              }}
              className="mb-6 flex w-full flex-col items-center gap-1 rounded-xl border-2 border-brand-300 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800 hover:bg-brand-100"
            >
              <span>Confirm Badminton England email</span>
              <span className="text-xs font-normal text-brand-700">
                Enter the activation code we sent — required within 7 days
              </span>
            </button>
          )}

          {isPremiumActive && (
            <div className="mb-6 rounded-xl border border-court-200 bg-court-50 px-4 py-3 text-center text-sm text-court-700">
              Premium active
              {isVerified ? ' · Verified' : ' · Verification pending'}
            </div>
          )}

          {isSubscribed && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onManageSubscription()
              }}
              className="mb-6 w-full text-center text-sm font-medium text-brand-700 hover:text-brand-600"
            >
              Manage subscription
            </button>
          )}

          <section>
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Your Account</h3>
            <ul className="space-y-3">
              <li>
                <InertLink>User Settings</InertLink>
              </li>
              <li>
                <InertLink>Favourites</InertLink>
              </li>
              <li>
                <InertLink>Notifications</InertLink>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left"
                  onClick={(event) => event.preventDefault()}
                >
                  <span className="text-base font-medium text-brand-700">Change Postcode</span>
                  <span className="mt-0.5 block text-xs text-brand-500">Current: CB2 9NF</span>
                </button>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </>,
    document.body,
  )
}
