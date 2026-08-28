import { useEffect, useMemo, useState } from 'react'
import type { NormalizedMatch } from '../../types/matchHistory'
import { formatDisplayDate } from '../../lib/formatDate'
import { formatWholePercent } from '../../lib/formatNumbers'
import {
  fictionalCelebrationPresentation,
  insertFictionalTournamentRecap,
} from '../../lib/fictionalTournamentRecap'
import { computeTournamentRecaps, disciplineRecapKey } from '../../lib/tournamentRecap'
import {
  fullTournamentRecapBuildFeatures,
  getTournamentRecapBuildFeatures,
  TOURNAMENT_RECAP_BUILD_STAGE_META,
  TOURNAMENT_RECAP_BUILD_STAGES,
  type TournamentRecapBuildStage,
} from '../../lib/tournamentRecapBuildStage'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'
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
  /**
   * Progressive build stage for ticket screenshots.
   * When null/omitted with picker enabled, local state defaults to 10 (full).
   * When picker is hidden and stage is omitted, full features are always shown.
   */
  buildStage?: TournamentRecapBuildStage | null
  /** Show the ticket build stage chips above the card. Default true. */
  showBuildStagePicker?: boolean
  /**
   * Insert kitchen-sink fictional recaps as the fifth and sixth carousel cards.
   * Off for premium showcase recordings so a real weekend is used.
   */
  includeFictionalFeatureRecap?: boolean
}

function formatDateRange(from: string, to: string): string {
  if (from === to || to === '—') return formatDisplayDate(from)
  return `${formatDisplayDate(from)} → ${formatDisplayDate(to)}`
}

export function TournamentRecapSection({
  allMatches,
  initialIndex = 0,
  buildStage: buildStageProp = null,
  showBuildStagePicker = true,
  includeFictionalFeatureRecap = true,
}: Props) {
  const recaps = useMemo(() => {
    const computed = computeTournamentRecaps(allMatches).recaps
    if (!includeFictionalFeatureRecap || computed.length === 0) return computed
    return insertFictionalTournamentRecap(computed)
  }, [allMatches, includeFictionalFeatureRecap])

  const [index, setIndex] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, recaps.length - 1)),
  )
  const [localBuildStage, setLocalBuildStage] = useState<TournamentRecapBuildStage>(10)

  const buildStage =
    buildStageProp != null
      ? buildStageProp
      : showBuildStagePicker
        ? localBuildStage
        : null

  const featuresForStage =
    buildStage != null
      ? getTournamentRecapBuildFeatures(buildStage)
      : fullTournamentRecapBuildFeatures()

  useEffect(() => {
    setIndex(Math.min(Math.max(0, initialIndex), Math.max(0, recaps.length - 1)))
  }, [allMatches, initialIndex, recaps.length])

  useEffect(() => {
    if (index >= recaps.length) setIndex(Math.max(0, recaps.length - 1))
  }, [index, recaps.length])

  if (recaps.length === 0) {
    return (
      <section className="overflow-hidden rounded-2xl card-frame bg-gradient-to-br from-brand-50 to-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-ink-900">Tournament recap</h3>
        <p className="mt-2 text-sm text-ink-700">
          Upload your match history to see your latest tournament recap.
        </p>
      </section>
    )
  }

  const recap = recaps[index]!
  const celebrationPresentation = fictionalCelebrationPresentation(recap.key)
  const isFictionalFeatureRecap = celebrationPresentation != null
  const features = featuresForStage
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

  const activeStage = buildStage ?? 10
  const showBody =
    features.showPodium ||
    features.showDebutMilestones ||
    features.showPersonalBests ||
    features.showSeniorCountyDebut ||
    features.showEventSummaries ||
    features.showDisciplines ||
    features.showRecordMilestones ||
    features.showFreakFlags ||
    recap.emojiInsights.length > 0 ||
    recap.otherEventInsights.length > 0

  return (
    <div className="space-y-3">
      {showBuildStagePicker && (
        <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
            <div
              role="group"
              aria-label="Events recap ticket build stage"
              className="flex flex-wrap gap-1"
            >
              {TOURNAMENT_RECAP_BUILD_STAGES.map((ticketStage) => {
                const selected = activeStage === ticketStage
                const meta = TOURNAMENT_RECAP_BUILD_STAGE_META[ticketStage]
                return (
                  <button
                    key={ticketStage}
                    type="button"
                    title={meta.summary}
                    onClick={() => {
                      if (buildStageProp == null) setLocalBuildStage(ticketStage)
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      selected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {ticketStage}. {meta.shortLabel}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-500">
            {TOURNAMENT_RECAP_BUILD_STAGE_META[activeStage].summary}
          </p>
        </div>
      )}

      <section id="tournament-recap" className="overflow-hidden rounded-2xl card-frame bg-white shadow-sm">
        <div className="bg-gradient-to-br from-brand-50 via-white to-court-50/40 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
              Tournament recap
            </p>
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
              {features.showWinPercent &&
                recap.weekendWinPercent != null &&
                (recap.weekendWinPercent === 100 ? (
                  <div className="perfect-record-border">
                    <div className="perfect-record-inner px-3 py-2">
                      <p className="text-2xl font-bold tabular-nums text-court-800">
                        {formatWholePercent(recap.weekendWinPercent)}
                      </p>
                      <p className="text-xs font-medium text-court-700">wins</p>
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

        {showBody && (
          <div className="space-y-4 border-t border-ink-100 px-4 py-4 sm:px-5 sm:py-5">
            <RecapCelebrationHero
              key={recap.key}
              celebrations={recap.celebrations}
              features={features}
              startRevealed={buildStageProp != null || isFictionalFeatureRecap}
              expandAllCelebrations={celebrationPresentation === 'expanded'}
              compactAllCelebrations={celebrationPresentation === 'compact'}
            />

            {features.showEventSummaries && recap.eventSummaries.length > 0 && (
              <div className="space-y-2">
                {recap.eventSummaries.map((card) => (
                  <RecapSummaryCard key={card.id} card={card} />
                ))}
              </div>
            )}

            {features.showDisciplines && recap.disciplines.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-ink-900">By discipline</h4>
                <div className="space-y-3">
                  {recap.disciplines.map((d) => (
                    <DisciplineRecapBlock
                      key={disciplineRecapKey(d)}
                      recap={d}
                      showDisciplineCallouts={features.showDisciplineCallouts}
                      showMatchHighlights={features.showMatchHighlights}
                      showNotes={features.showNotes}
                    />
                  ))}
                </div>
              </div>
            )}

            <RecapEmojiInsightSection
              emojiInsights={recap.emojiInsights}
              otherEventInsights={recap.otherEventInsights}
            />

            {features.showRecordMilestones && (
              <RecapRecordMilestoneCards milestones={recap.recordMilestones} />
            )}

            {features.showFreakFlags && <FreakFlagCards flags={recap.freakFlags} />}
          </div>
        )}

        {recaps.length > 1 && (
          <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-3 sm:px-5">
            <RecapTournamentNav {...navProps} />
          </div>
        )}
      </section>
    </div>
  )
}
