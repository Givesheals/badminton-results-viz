import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { getPlayerInitials } from '../../lib/getPlayerInitials'
import { usePremium } from '../../context/PremiumContext'
import { useTicketBuildVisibility } from '../../context/TicketBuildVisibilityContext'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  /** Screenshot stand-in for the production menu before someone has logged in. */
  loggedOut?: boolean
  onSignUpPremium: () => void
  onManageSubscription: () => void
  onOpenUserSettings: () => void
  onOpenNotifications: () => void
  onOpenTournamentPreview: () => void
  onOpenTournamentListings: () => void
  onOpenLiveFeed: () => void
  onOpenBeRanking: () => void
  onOpenDesignAssets: () => void
  onOpenAddNewData: () => void
  onOpenPremiumAnnouncement: () => void
}

function MenuDivider({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-px bg-[#E0E0E0] ${className}`} />
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8 text-white" fill="currentColor" aria-hidden>
      <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-4 0-7 2-7 4.5V20h14v-1.5C19 16 16 14 12 14z" />
    </svg>
  )
}

function BeNumberIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-7 w-7 text-[#5C3992]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="11" r="1.5" fill="currentColor" stroke="none" />
      <path d="M6.8 15.2c.4-1.3 1.3-1.9 2.2-1.9s1.8.6 2.2 1.9" strokeLinecap="round" />
      <path d="M14 10.5h4M14 13.5h4" strokeLinecap="round" />
    </svg>
  )
}

function InertLink({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
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
  loggedOut = false,
  onSignUpPremium,
  onManageSubscription,
  onOpenUserSettings,
  onOpenNotifications,
  onOpenTournamentPreview,
  onOpenTournamentListings,
  onOpenLiveFeed,
  onOpenBeRanking,
  onOpenDesignAssets,
  onOpenAddNewData,
  onOpenPremiumAnnouncement,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { premium, isSubscribed, isPremiumActive } = usePremium()
  const { ticketBuildVisible, toggleTicketBuildVisible } = useTicketBuildVisibility()
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
      <div className="fixed inset-0 z-[70] bg-ink-900/40" aria-hidden onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-sm flex-col bg-white shadow-xl outline-none"
      >
        <div className="flex items-center justify-between px-5 pb-3 pt-4">
          <img
            src={`${import.meta.env.BASE_URL}badminfo-logo-production.png`}
            alt=""
            draggable={false}
            className="h-9 w-auto"
          />
          <span id={titleId} className="sr-only">
            BADMINFO menu
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-xl leading-none text-[#808080] hover:bg-ink-50 hover:text-ink-700"
            aria-label="Close menu"
          >
            ✕
          </button>
        </div>

        <MenuDivider className="mx-5" />

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loggedOut ? (
            <>
              <div className="flex flex-col items-center pt-4 text-center">
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-[#5C3992]"
                  aria-hidden
                >
                  <PersonIcon />
                </div>
                <button
                  type="button"
                  className="mt-4 text-[28px] font-medium leading-tight text-[#5C3992]"
                  onClick={(event) => event.preventDefault()}
                >
                  Log in
                </button>
              </div>

              <button
                type="button"
                className="mb-6 mt-6 flex w-full items-center justify-center rounded-xl bg-[#5C3992] px-4 py-3 text-base font-semibold text-white"
                onClick={(event) => event.preventDefault()}
              >
                Get Premium
              </button>

              <MenuDivider />

              <section className="mt-5">
                <h3 className="mb-4 text-2xl font-semibold text-[#222]">Your Account</h3>
                <ul className="space-y-4">
                  <li>
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={(event) => event.preventDefault()}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#5C3992] text-sm font-semibold text-white">
                        SP
                      </span>
                      <span className="text-[26px] font-medium leading-tight text-[#5C3992]">
                        Profile &amp; Results
                      </span>
                    </button>
                  </li>
                  <li>
                    <button
                      type="button"
                      className="flex items-center gap-3 text-left"
                      onClick={(event) => event.preventDefault()}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center">
                        <BeNumberIcon />
                      </span>
                      <span className="text-[26px] font-medium leading-tight text-[#5C3992]">
                        Change BE Number
                      </span>
                    </button>
                  </li>
                </ul>
              </section>
            </>
          ) : (
            <>
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5C3992] text-[22px] font-semibold leading-none text-white"
              aria-hidden
            >
              {initials}
            </div>
            <p className="mt-2 text-sm font-medium text-[#222]">
              {playerName}
              {premium?.beNumber ? `: ${premium.beNumber}` : ''}
            </p>
            <button
              type="button"
              className="mt-2 text-[26px] font-medium leading-tight text-[#5C3992] hover:text-[#4A2D78]"
              onClick={(event) => event.preventDefault()}
            >
              Profile &amp; Results
            </button>
          </div>

          {!isSubscribed && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onSignUpPremium()
              }}
              className="mb-5 mt-4 flex w-full items-center justify-center rounded-xl bg-[#5C3992] px-4 py-3 text-base font-semibold text-white hover:bg-[#4A2D78]"
            >
              Get Premium
            </button>
          )}

          {isPremiumActive && (
            <div className="mb-5 mt-4 rounded-xl border border-court-200 bg-court-50 px-4 py-3 text-center text-sm text-court-700">
              Premium active
            </div>
          )}

          {isSubscribed && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onManageSubscription()
              }}
              className="mb-5 mt-4 w-full text-center text-sm font-medium text-[#5C3992] hover:text-[#4A2D78]"
            >
              Manage subscription
            </button>
          )}

          <MenuDivider />

          <section className="mt-5">
            <h3 className="mb-3 text-sm font-semibold text-ink-900">Your Account</h3>
            <ul className="space-y-3">
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenPremiumAnnouncement()
                  }}
                >
                  Premium announcement
                </button>
              </li>
              <li>
                <a
                  href="?preview=premium-banner"
                  className="text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                >
                  Premium banner
                </a>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenAddNewData()
                  }}
                >
                  Add new data
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenUserSettings()
                  }}
                >
                  User Settings
                </button>
              </li>
              <li>
                <InertLink>Favourites</InertLink>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenNotifications()
                  }}
                >
                  Notifications
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenTournamentPreview()
                  }}
                >
                  Tournament page preview
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenTournamentListings()
                  }}
                >
                  Tournament listings
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenLiveFeed()
                  }}
                >
                  Live Feed
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenBeRanking()
                  }}
                >
                  BE Ranking Automation
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={() => {
                    onClose()
                    onOpenDesignAssets()
                  }}
                >
                  Design Assets
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left text-base font-medium text-[#5C3992] hover:text-[#4A2D78]"
                  onClick={toggleTicketBuildVisible}
                >
                  {ticketBuildVisible ? 'Hide ticket build' : 'Show ticket build'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-left"
                  onClick={(event) => event.preventDefault()}
                >
                  <span className="text-base font-medium text-[#5C3992]">Change Postcode</span>
                  <span className="mt-0.5 block text-xs text-[#7A4D9A]">Current: CB2 9NF</span>
                </button>
              </li>
            </ul>
          </section>
            </>
          )}
        </div>
      </div>
    </>,
    document.body,
  )
}

function noop() {}

/** Open with ?preview=login-menu. Stays open so it can be screenshotted for a ticket. */
export function LoginMenuPreview() {
  return (
    <div className="min-h-screen bg-[#c8c8c8]">
      <UserMenuDrawer
        open
        loggedOut
        onClose={noop}
        playerName="Simon Parker"
        onSignUpPremium={noop}
        onManageSubscription={noop}
        onOpenUserSettings={noop}
        onOpenNotifications={noop}
        onOpenTournamentPreview={noop}
        onOpenTournamentListings={noop}
        onOpenLiveFeed={noop}
        onOpenBeRanking={noop}
        onOpenDesignAssets={noop}
        onOpenAddNewData={noop}
        onOpenPremiumAnnouncement={noop}
      />
    </div>
  )
}
