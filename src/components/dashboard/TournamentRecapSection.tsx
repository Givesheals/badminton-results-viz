import { useEffect, useMemo, useState } from 'react'
import type { NormalizedMatch } from '../../types/matchHistory'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import { formatDisplayDate } from '../../lib/formatDate'
import { formatWholePercent } from '../../lib/formatNumbers'
import { listActiveDrawScoutCompetitions } from '../../lib/drawScout'
import { getDrawScoutPreviewCompetitions } from '../../lib/drawScoutPreviewData'
import { computeTournamentRecaps } from '../../lib/tournamentRecap'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'
import {
  DrawScoutCard,
  DrawScoutExploreModal,
  useDrawScoutVisibility,
} from '../notes/DrawScoutCard'
import { RecapCelebrationHero } from './recap/RecapCelebrationHero'
import { DisciplineRecapBlock } from './recap/DisciplineRecapBlock'
import { RecapSummaryCard } from './recap/RecapSummaryCard'
import { FreakFlagCards } from './recap/FreakFlagCards'
import { RecapEmojiInsightSection } from './recap/RecapEmojiInsightSection'
import { RecapRecordMilestoneCards } from './recap/RecapRecordMilestoneCards'
import { RecapTournamentNav } from './recap/RecapTournamentNav'

type Props = {
  allMatches: NormalizedMatch[]
  /** Optional starting tournament (0 = newest). Used by premium showcase recording. */
  initialIndex?: number
}

function formatDateRange(from: string, to: string): string {
  if (from === to || to === '—') return formatDisplayDate(from)
  return `${formatDisplayDate(from)} → ${formatDisplayDate(to)}`
}

export function TournamentRecapSection({ allMatches, initialIndex = 0 }: Props) {
  const { allNotes, playerName } = useOpponentNotesContext()
  const { hasActiveCompetitions } = useDrawScoutVisibility()
  const [exploreOpen, setExploreOpen] = useState(false)
  const [drawScoutForced, setDrawScoutForced] = useState(false)
  const [drawScoutSelection, setDrawScoutSelection] = useState<{
    competitionSlug: string
    playerName: string
  } | null>(null)

  const { recaps } = useMemo(
    () => computeTournamentRecaps(allMatches),
    [allMatches],
  )

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, recaps.length - 1)),
  )

  useEffect(() => {
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, recaps.length - 1)))
  }, [allMatches, initialIndex, recaps.length])

  useEffect(() => {
    if (index >= recaps.length) setIndex(Math.max(0, recaps.length - 1))
  }, [index, recaps.length])

  const drawScout = (
    <>
      <DrawScoutCard
        playerName={playerName ?? 'You'}
        allNotes={allNotes}
        allMatches={allMatches}
        forcedVisible={drawScoutForced}
        initialCompetitionSlug={drawScoutSelection?.competitionSlug ?? null}
        initialPlayerName={drawScoutSelection?.playerName ?? null}
      />
      <DrawScoutExploreModal
        open={exploreOpen}
        competitions={listActiveDrawScoutCompetitions(getDrawScoutPreviewCompetitions())}
        initialSlug={drawScoutSelection?.competitionSlug ?? null}
        youName={playerName ?? 'You'}
        onClose={() => setExploreOpen(false)}
        onConfirm={(competitionSlug, selectedPlayer) => {
          setDrawScoutForced(true)
          setDrawScoutSelection({ competitionSlug, playerName: selectedPlayer })
        }}
      />
    </>
  )

  const exploreButton = hasActiveCompetitions ? (
    <button
      type="button"
      onClick={() => setExploreOpen(true)}
      className="shrink-0 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
    >
      Explore a draw →
    </button>
  ) : null

  if (recaps.length === 0) {
    return (
      <div className="space-y-6">
        {drawScout}
        <section className="overflow-hidden rounded-2xl card-frame bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink-900">Tournament recap</h3>
              <p className="mt-2 text-sm text-ink-700">
                Upload your match history to see your latest tournament recap.
              </p>
            </div>
            {exploreButton}
          </div>
        </section>
      </div>
    )
  }

  const recap = recaps[index]!
  const positionLabel = `${index + 1} of ${recaps.length}`
  const canGoOlder = index < recaps.length - 1
  const canGoNewer = index > 0
  const goOlder = () => setIndex((i) => Math.min(i + 1, recaps.length - 1))
  const goNewer = () => setIndex((i) => Math.max(i - 1, 0))
  const navProps = {
    positionLabel,
    canGoOlder,
    canGoNewer,
    onOlder: goOlder,
    onNewer: goNewer,
  }

  return (
    <div className="space-y-6">
      {/* Upcoming / most recent draw — sits above past tournament recaps */}
      {drawScout}

      <section id="tournament-recap" className="overflow-hidden rounded-2xl card-frame bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-50 via-white to-court-50/40 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Tournament recap
            </p>
            {exploreButton}
          </div>

          {recaps.length > 1 && (
            <div className="mt-3 shrink-0">
              <RecapTournamentNav {...navProps} />
            </div>
          )}

          <div className={recaps.length > 1 ? 'mt-3' : 'mt-2'}>
            <div className="flex items-start gap-3">
              <h3 className="min-w-0 flex-1 text-xl font-semibold text-ink-900">
                {recap.competitionName}
              </h3>
              {recap.weekendWinPercent != null &&
                (recap.weekendWinPercent === 100 ? (
                  <div className="perfect-record-border">
                    <div className="perfect-record-inner px-3 py-2">
                      <p className="text-2xl font-bold tabular-nums text-court-800">
                        {formatWholePercent(recap.weekendWinPercent)}
                      </p>
                      <p className="text-xs font-medium text-court-700">all wins!</p>
                    </div>
                  </div>
                ) : (
                  <div className="shrink-0 rounded-xl bg-white/80 px-3 py-2 text-center shadow-sm ring-1 ring-ink-100">
                    <p className="text-2xl font-semibold tabular-nums text-court-700">
                      {formatWholePercent(recap.weekendWinPercent)}
                    </p>
                    <p className="text-xs text-ink-500">match wins</p>
                  </div>
                ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TournamentCategoryChip label={recap.tournamentCategoryLabel} />
              <span className="text-sm text-ink-600">
                {formatDateRange(recap.dateFrom, recap.dateTo)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-ink-100 px-4 py-4 sm:px-5 sm:py-5">
          <RecapCelebrationHero celebrations={recap.celebrations} />

          {recap.eventSummaries.length > 0 && (
            <div className="space-y-2">
              {recap.eventSummaries.map((card) => (
                <RecapSummaryCard key={card.id} card={card} />
              ))}
            </div>
          )}

          {recap.disciplines.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-ink-900">By discipline</h4>
              <div className="space-y-3">
                {recap.disciplines.map((d) => (
                  <DisciplineRecapBlock key={d.discipline} recap={d} />
                ))}
              </div>
            </div>
          )}

          <RecapEmojiInsightSection
            emojiInsights={recap.emojiInsights}
            otherEventInsights={recap.otherEventInsights}
          />

          <RecapRecordMilestoneCards milestones={recap.recordMilestones} />

          <FreakFlagCards flags={recap.freakFlags} />
        </div>

        {recaps.length > 1 && (
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-5">
            <RecapTournamentNav {...navProps} />
          </div>
        )}
      </section>
    </div>
  )
}
