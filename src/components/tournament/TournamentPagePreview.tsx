import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  countDrawOpponentsWithNotes,
  getEntrantForCompetition,
  listActiveDrawScoutCompetitions,
} from '../../lib/drawScout'
import { getDrawScoutPreviewCompetitions } from '../../lib/drawScoutPreviewData'
import { mergeDrawScoutDisplayNotes } from '../../lib/drawScoutDemoNotes'
import {
  cambridgeTournamentPage,
  type TournamentPageVisibility,
} from '../../lib/tournamentPageMockData'
import { useOpponentNotes } from '../../hooks/useOpponentNotes'
import { DrawCompanionModal } from './DrawCompanionModal'
import { TournamentPageMock } from './TournamentPageMock'

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onSignUpPremium: () => void
}

const VISIBILITY_OPTIONS: { id: TournamentPageVisibility; label: string }[] = [
  { id: 'premium', label: 'Premium' },
  { id: 'gift', label: 'Gift' },
  { id: 'hidden', label: 'Hidden' },
]

export function TournamentPagePreview({
  open,
  onClose,
  playerName,
  onSignUpPremium,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const [visibility, setVisibility] = useState<TournamentPageVisibility>('premium')
  const [companionOpen, setCompanionOpen] = useState(false)
  const { allNotes } = useOpponentNotes(playerName)

  const noteCount = useMemo(() => {
    const comps = listActiveDrawScoutCompetitions(getDrawScoutPreviewCompetitions())
    const comp =
      comps.find((c) => c.slug === cambridgeTournamentPage.drawCompanionSlug) ?? comps[0]
    if (!comp) return 0
    const entrant = getEntrantForCompetition(comp, playerName)
    if (!entrant) return 0
    return countDrawOpponentsWithNotes(comp, entrant, mergeDrawScoutDisplayNotes(allNotes))
  }, [allNotes, playerName])

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !companionOpen) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, companionOpen])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) setCompanionOpen(false)
  }, [open])

  if (!open) return null

  return createPortal(
    <>
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="fixed inset-0 z-50 flex flex-col bg-ink-50 outline-none"
      >
        <header className="border-b border-ink-200 bg-white px-5 py-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 id={titleId} className="text-base font-semibold text-ink-900">
                Tournament page preview
              </h1>
              <p className="text-xs text-ink-500">
                Draw companion placement options — mock layout for Figma
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
              aria-label="Close tournament page preview"
            >
              ✕
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-ink-500">Visibility:</span>
            <div
              role="group"
              aria-label="Visitor visibility state"
              className="inline-flex rounded-lg border border-ink-200 bg-ink-50 p-0.5"
            >
              {VISIBILITY_OPTIONS.map((option) => {
                const selected = visibility === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setVisibility(option.id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      selected
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-ink-500 hover:text-ink-700'
                    }`}
                  >
                    {option.label}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <TournamentPageMock
            visibility={visibility}
            noteCount={noteCount}
            playerName={playerName}
            onOpenCompanion={() => {
              if (visibility === 'hidden') return
              setCompanionOpen(true)
            }}
            onSignUpPremium={() => {
              onClose()
              onSignUpPremium()
            }}
          />
        </div>
      </div>

      {/* Options A & C still open as a modal; Option B swaps page content instead */}
      <DrawCompanionModal
        open={companionOpen}
        onClose={() => setCompanionOpen(false)}
        visibility={visibility}
        playerName={playerName}
        onSignUpPremium={() => {
          setCompanionOpen(false)
          onClose()
          onSignUpPremium()
        }}
      />
    </>,
    document.body,
  )
}
