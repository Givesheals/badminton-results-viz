import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { usePremium } from '../../context/PremiumContext'
import {
  formatPriceGbp,
  planBillingDescription,
  planPriceGbp,
  type PremiumPlan,
} from '../../lib/premiumPricing'
import type { StoredPremiumState } from '../../lib/premiumStorage'
import { PremiumSignupFlow } from './PremiumSignupFlow'
import { PremiumWelcomeModal } from './PremiumWelcomeModal'
import { UserMenuDrawer } from './UserMenuDrawer'
import { UserSettingsPage } from './UserSettingsPage'
import { NotificationsPreview } from '../notifications/NotificationsPreview'
import { TournamentPagePreview } from '../tournament/TournamentPagePreview'
import { TournamentListingsPage } from '../tournament/TournamentListingsPage'
import { DesignAssetsPage } from '../design/DesignAssetsPage'
import { LiveFeedPage } from '../live-feed/LiveFeedPage'
import { getPlayerInitials } from '../../lib/getPlayerInitials'

type Props = {
  playerName: string
  onOpenAddNewData: () => void
}

export function PremiumUserMenu({ playerName, onOpenAddNewData }: Props) {
  const { premium, clearSubscription } = usePremium()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signupOpen, setSignupOpen] = useState(false)
  const [signupPlan, setSignupPlan] = useState<PremiumPlan>('yearly')
  const [manageOpen, setManageOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [tournamentPreviewOpen, setTournamentPreviewOpen] = useState(false)
  const [tournamentListingsOpen, setTournamentListingsOpen] = useState(false)
  const [liveFeedOpen, setLiveFeedOpen] = useState(false)
  const [designAssetsOpen, setDesignAssetsOpen] = useState(false)
  const [welcomeSubscription, setWelcomeSubscription] = useState<StoredPremiumState | null>(null)

  const initials = getPlayerInitials(playerName)

  function openSignup(plan: PremiumPlan = 'yearly') {
    setSignupPlan(plan)
    setSignupOpen(true)
  }

  function showWelcome(subscription: StoredPremiumState) {
    setWelcomeSubscription(subscription)
  }

  function openPlayerLab() {
    setWelcomeSubscription(null)
    setMenuOpen(false)
    setSettingsOpen(false)
    setNotificationsOpen(false)
    setTournamentPreviewOpen(false)
    setTournamentListingsOpen(false)
    setLiveFeedOpen(false)
    setDesignAssetsOpen(false)
    // Wait for the full-screen pages to unmount, then bring the Player Lab header into view.
    window.setTimeout(() => {
      const header = document.getElementById('dashboard-results-header')
      if (header) header.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 50)
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
        onOpenUserSettings={() => {
          setTournamentListingsOpen(false)
          setSettingsOpen(true)
        }}
        onOpenNotifications={() => {
          setTournamentListingsOpen(false)
          setNotificationsOpen(true)
        }}
        onOpenTournamentPreview={() => {
          setTournamentListingsOpen(false)
          setTournamentPreviewOpen(true)
        }}
        onOpenTournamentListings={() => setTournamentListingsOpen(true)}
        onOpenLiveFeed={() => {
          setTournamentListingsOpen(false)
          setLiveFeedOpen(true)
        }}
        onOpenDesignAssets={() => {
          setTournamentListingsOpen(false)
          setDesignAssetsOpen(true)
        }}
        onOpenAddNewData={() => {
          setTournamentListingsOpen(false)
          onOpenAddNewData()
        }}
      />

      <UserSettingsPage
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        playerName={playerName}
        onSignUpPremium={(plan) => openSignup(plan ?? 'yearly')}
        onManageSubscription={() => setManageOpen(true)}
        onShowWelcome={showWelcome}
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

      <TournamentListingsPage
        open={tournamentListingsOpen}
        onClose={() => setTournamentListingsOpen(false)}
        playerName={playerName}
        onOpenAccountMenu={() => setMenuOpen(true)}
        accountMenuOpen={menuOpen}
        onOpenTournament={() => setTournamentPreviewOpen(true)}
        tournamentPageOpen={tournamentPreviewOpen}
      />

      <LiveFeedPage open={liveFeedOpen} onClose={() => setLiveFeedOpen(false)} />

      <DesignAssetsPage open={designAssetsOpen} onClose={() => setDesignAssetsOpen(false)} />

      <PremiumSignupFlow
        open={signupOpen}
        onClose={() => setSignupOpen(false)}
        playerName={playerName}
        initialPlan={signupPlan}
        onSubscribed={showWelcome}
      />

      {welcomeSubscription ? (
        <PremiumWelcomeModal
          open
          onClose={() => setWelcomeSubscription(null)}
          playerName={welcomeSubscription.playerName}
          beNumber={welcomeSubscription.beNumber}
          plan={welcomeSubscription.plan}
          subscribedAt={welcomeSubscription.subscribedAt}
          receiptEmail={welcomeSubscription.receiptEmail}
          onOpenPlayerLab={openPlayerLab}
        />
      ) : null}

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
