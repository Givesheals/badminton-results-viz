import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  planBillingDescription,
  planPriceGbp,
} from '../../lib/premiumPricing'
import { BeEmailVerification } from './BeEmailVerification'
import { PremiumSignupFlow } from './PremiumSignupFlow'
import { UserMenuDrawer } from './UserMenuDrawer'
import { getPlayerInitials } from '../../lib/getPlayerInitials'

type Props = {
  playerName: string
}

export function PremiumUserMenu({ playerName }: Props) {
  const { premium, isVerified, clearSubscription } = usePremium()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [manageOpen, setManageOpen] = useState(false)
  const [devCode, setDevCode] = useState<string | null>(null)

  const initials = getPlayerInitials(playerName)

  return (
    <>
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white shadow-sm ring-2 ring-brand-200 hover:bg-brand-700"
        aria-label={`Open account menu for ${playerName}`}
      >
        {initials}
      </button>

      <UserMenuDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        playerName={playerName}
        onSignUpPremium={() => setSignupOpen(true)}
        onVerifyEmail={() => setVerifyOpen(true)}
        onManageSubscription={() => setManageOpen(true)}
      />

      <PremiumSignupFlow
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        playerName={playerName}
        onOpenVerification={(code) => {
          setDevCode(code)
          setSignupOpen(false)
          setVerifyOpen(true)
        }}
      />

      <BeEmailVerification
        open={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        devCode={devCode}
      />

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Manage subscription"
        footer={
          <button
            type="button"
            onClick={() => setManageOpen(false)}
            className="rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Close
          </button>
        }
      >
        {premium ? (
          <div className="space-y-3 text-sm text-ink-700">
            <p>
              <span className="font-medium text-ink-900">Player:</span> {premium.playerName} (BE{' '}
              {premium.beNumber})
            </p>
            <p>
              <span className="font-medium text-ink-900">Plan:</span>{' '}
              {planBillingDescription(premium.plan)}
            </p>
            <p>
              <span className="font-medium text-ink-900">Receipt email:</span> {premium.receiptEmail}
            </p>
            <p>
              <span className="font-medium text-ink-900">Status:</span>{' '}
              {isVerified ? 'Verified' : 'Verification pending'}
            </p>
            <p>
              <span className="font-medium text-ink-900">Next billing:</span>{' '}
              {formatPriceGbp(planPriceGbp(premium.plan))}
            </p>
            {!isVerified && (
              <button
                type="button"
                onClick={() => {
                  setManageOpen(false)
                  setVerifyOpen(true)
                }}
                className="text-brand-700 hover:text-brand-600"
              >
                Verify Badminton England email →
              </button>
            )}
            <hr className="border-ink-100" />
            <button
              type="button"
              onClick={() => {
                clearSubscription()
                setManageOpen(false)
              }}
              className="text-sm text-loss-600 hover:text-loss-700"
            >
              Cancel subscription (prototype reset)
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-700">No active subscription.</p>
        )}
      </Modal>
    </>
  )
}
