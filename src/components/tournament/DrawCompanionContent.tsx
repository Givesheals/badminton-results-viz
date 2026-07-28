import { useMemo } from 'react'
import { useDataset } from '../../context/DatasetContext'
import { useOpponentNotes } from '../../hooks/useOpponentNotes'
import { normalizeDataset } from '../../lib/matchHistory'
import {
  cambridgeTournamentPage,
  type TournamentPageVisibility,
} from '../../lib/tournamentPageMockData'
import { DrawScoutCard } from '../notes/DrawScoutCard'

type Props = {
  visibility: TournamentPageVisibility
  playerName: string
  onSignUpPremium?: () => void
}

/** Shared draw companion body (gift banner + scout card) for modal and inline Option B. */
export function DrawCompanionContent({
  visibility,
  playerName,
  onSignUpPremium,
}: Props) {
  const { dataset } = useDataset()
  const { allNotes } = useOpponentNotes(playerName)

  const allMatches = useMemo(
    () => (dataset ? normalizeDataset(dataset) : []),
    [dataset],
  )

  const isGift = visibility === 'gift'

  return (
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
  )
}
