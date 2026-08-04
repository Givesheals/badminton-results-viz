import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  planBillingDescription,
  planPriceGbp,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import { PremiumSignupFlow } from './PremiumSignupFlow'
import { UserMenuDrawer } from './UserMenuDrawer'
import { UserSettingsPage } from './UserSettingsPage'
import { NotificationsPreview } from '../notifications/NotificationsPreview'
import { TournamentPagePreview } from '../tournament/TournamentPagePreview'
import { getPlayerInitials } from '../../lib/getPlayerInitials'

type Props = {
  playerName: string
}

export function PremiumUserMenu({ playerName }: Props) {
  const { premium, clearSubscription } = usePremium()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [signupPlan, setSignupPlan] = useState<PremiumPlan>('yearly')
  const [manageOpen, setManageOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [tournamentPreviewOpen, setTournamentPreviewOpen] = useState(false)

  const initials = getPlayerInitials(playerName)

  function openSignup(plan: PremiumPlan = 'yearly') {
    setSignupPlan(plan)
    setSignupOpen(true)
  }

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
        onSignUpPremium={() => openSignup('yearly')}
        onManageSubscription={() => setManageOpen(true)}
        onOpenUserSettings={() => setSettingsOpen(true)}
        onOpenNotifications={() => setNotificationsOpen(true)}
        onOpenTournamentPreview={() => setTournamentPreviewOpen(true)}
      />

      <UserSettingsPage
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        playerName={playerName}
        onSignUpPremium={(plan) => openSignup(plan ?? 'yearly')}
        onManageSubscription={() => setManageOpen(true)}
      />

      <NotificationsPreview
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      <TournamentPagePreview
        open={tournamentPreviewOpen}
        onClose={() => setTournamentPreviewOpen(false)}
        playerName={playerName}
        onSignUpPremium={() => openSignup('yearly')}
      />

      <PremiumSignupFlow
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        playerName={playerName}
        initialPlan={signupPlan}
      />

      <Modal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        title="Stripe Customer Portal"
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
        <div className="space-y-3 text-sm text-ink-700">
          <p>
            In production this opens the{' '}
            <span className="font-medium text-ink-900">Stripe Customer Portal</span> in a new tab
            — change plan, update payment method, view invoices, or cancel.
          </p>
          {premium ? (
            <>
              <p className="rounded-lg border border-ink-100 bg-ink-50 px-3 py-2 text-xs text-ink-600">
                Prototype subscription: {premium.playerName} (BE {premium.beNumber}) ·{' '}
                {planBillingDescription(premium.plan)} · {formatPriceGbp(planPriceGbp(premium.plan))}
              </p>
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
            </>
          ) : (
            <p className="text-xs text-ink-500">
              No real subscription stored — you are viewing the subscribed demo layout.
            </p>
          )}
        </div>
      </Modal>
    </>
  )
}
