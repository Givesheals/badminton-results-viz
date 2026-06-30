import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, useState } from 'react'
import { usePremium } from '../../context/PremiumContext'
import { findBePlayerByNumber } from '../../data/bePlayerDirectory'
import { getMaskedBeEmail } from '../../lib/premiumBeLookup'
import { PREMIUM_VERIFICATION_GRACE_DAYS } from '../../lib/premiumPricing'

const BE_EMAIL_UPDATE_URL = 'https://www.badmintonengland.co.uk/'

type Props = {
  open: boolean
  onClose: () => void
  /** Shown in prototype dev helper when code is first generated at subscribe. */
  devCode?: string | null
}

export function BeEmailVerification({ open, onClose, devCode }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { premium, verifyEmail, isVerified } = usePremium()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setError(null)
    setSuccess(false)
  }, [open])

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

  if (!open || !premium) return null

  const maskedEmail =
    findBePlayerByNumber(premium.beNumber)?.maskedEmail ?? getMaskedBeEmail(premium.beNumber)
  const displayCode = devCode ?? premium.verificationCode

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (verifyEmail(code)) {
      setSuccess(true)
      setError(null)
    } else {
      setError('That code is incorrect. Please try again.')
    }
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60] bg-ink-900/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="card-frame fixed left-1/2 top-1/2 z-[70] flex max-h-[min(90vh,640px)] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-brand-200 outline-none"
      >
        <div className="border-b border-ink-100 px-4 py-3 sm:px-5">
          <h2 id={titleId} className="text-base font-semibold text-ink-900">
            Confirm your Badminton England email
          </h2>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {success || isVerified ? (
            <div className="space-y-3 text-sm text-ink-700">
              <p className="font-medium text-court-700">Email verified — premium is fully active.</p>
              <p>Thank you for confirming access to BE player {premium.beNumber}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-ink-700">
                We&apos;ve sent a 6-digit activation code to <strong>{maskedEmail}</strong> — the
                email address you registered with Badminton England. Enter the code below to confirm
                you have access to this player&apos;s account. You have{' '}
                <strong>{PREMIUM_VERIFICATION_GRACE_DAYS} days</strong> to complete this step and
                keep premium active.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block text-sm font-medium text-ink-900">
                  Activation code
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={(event) => {
                      setCode(event.target.value.replace(/\D/g, ''))
                      setError(null)
                    }}
                    className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-base tracking-widest text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
                    placeholder="000000"
                  />
                </label>
                {error && <p className="text-sm text-loss-600">{error}</p>}
                <button
                  type="submit"
                  disabled={code.length !== 6}
                  className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Verify and activate
                </button>
              </form>

              <div className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
                <p className="font-medium text-ink-700">Prototype helper</p>
                <p>
                  Demo code: <code className="font-mono text-brand-700">{displayCode}</code>
                </p>
              </div>

              <div className="border-t border-ink-100 pt-4">
                <p className="text-sm font-medium text-ink-900">Can&apos;t access that email?</p>
                <p className="mt-1 text-sm text-ink-600">
                  Premium stays active during the {PREMIUM_VERIFICATION_GRACE_DAYS}-day window. Update
                  your email with Badminton England, then return here to verify.
                </p>
                <a
                  href={BE_EMAIL_UPDATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm font-medium text-brand-700 hover:text-brand-600"
                >
                  Update your email with Badminton England →
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-ink-100 px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
