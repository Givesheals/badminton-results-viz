import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef } from 'react'
import { useDataset } from '../../context/DatasetContext'
import { useOpponentNotes } from '../../hooks/useOpponentNotes'
import { normalizeDataset } from '../../lib/matchHistory'
import {
  cambridgeTournamentPage,
  type TournamentPageVisibility,
} from '../../lib/tournamentPageMockData'
import { DrawScoutCard } from '../notes/DrawScoutCard'

type Props = {
  open: boolean
  onClose: () => void
  visibility: TournamentPageVisibility
  playerName: string
  onSignUpPremium?: () => void
}

/**
 * Matches the live Badminfo modal shell: dimmed backdrop, centred white panel,
 * title + ✕ header, scroll body, purple Close footer.
 */
export function DrawCompanionModal({
  open,
  onClose,
  visibility,
  playerName,
  onSignUpPremium,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const { dataset } = useDataset()
  const { allNotes } = useOpponentNotes(playerName)

  const allMatches = useMemo(
    () => (dataset ? normalizeDataset(dataset) : []),
    [dataset],
  )

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

  const isGift = visibility === 'gift'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        aria-hidden
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed left-1/2 top-1/2 z-[61] flex max-h-[min(90vh,720px)] w-[min(100vw-1.5rem,36rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-ink-200 bg-white shadow-xl outline-none"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onClose()
          }
        }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-ink-200 px-4 py-3">
          <div className="min-w-0">
            <h2 id={titleId} className="text-base font-semibold text-ink-800">
              Draw companion
            </h2>
            <p className="truncate text-xs text-ink-500">{cambridgeTournamentPage.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 p-1 text-ink-400 hover:text-ink-700"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-3">
            {isGift && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-brand-200 bg-brand-50/50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-900">Enjoy this one-off gift</p>
                  <p className="text-xs text-ink-600">
                    Unlock with Premium for your next tournament.
                  </p>
                </div>
                {onSignUpPremium && (
                  <button
                    type="button"
                    onClick={onSignUpPremium}
                    className="shrink-0 bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                  >
                    Unlock Premium
                  </button>
                )}
              </div>
            )}

            <DrawScoutCard
              playerName={playerName}
              allNotes={isGift ? [] : allNotes}
              allMatches={allMatches}
              forcedVisible
              disableNotes={isGift}
              initialCompetitionSlug={cambridgeTournamentPage.drawCompanionSlug}
              initialPlayerName={playerName}
            />
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-ink-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Close
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}
