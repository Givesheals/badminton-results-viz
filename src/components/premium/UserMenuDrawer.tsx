import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BetaBadge } from '../ui/BetaBadge'
import { getPlayerInitials } from '../../lib/getPlayerInitials'
import { usePremium } from '../../context/PremiumContext'
import { useTicketBuildVisibility } from '../../context/TicketBuildVisibilityContext'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onSignUpPremium: () => void
  onManageSubscription: () => void
  onOpenUserSettings: () => void
  onOpenNotifications: () => void
  onOpenTournamentPreview: () => void
  onOpenTournamentListings: () => void
  onOpenLiveFeed: () => void
  onOpenBeRanking: () => void
  onOpenDesignAssets: () => void
  onOpenHeaderOptions: () => void
  onOpenAddNewData: () => void
}

function MenuDivider({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`h-px bg-[#E0E0E0] ${className}`} />
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
  onSignUpPremium,
  onManageSubscription,
  onOpenUserSettings,
  onOpenNotifications,
  onOpenTournamentPreview,
  onOpenTournamentListings,
  onOpenLiveFeed,
  onOpenBeRanking,
  onOpenDesignAssets,
  onOpenHeaderOptions,
  onOpenAddNewData,
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
              className="mb-5 mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5C3992] px-4 py-3 text-base font-semibold text-white hover:bg-[#4A2D78]"
            >
              Sign up for Premium
              <BetaBadge />
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
                  onClick={() => {
                    onClose()
                    onOpenHeaderOptions()
                  }}
                >
                  Player Lab header options
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
        </div>
      </div>
    </>,
    document.body,
  )
}
