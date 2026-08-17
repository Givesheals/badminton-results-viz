import { useEffect, useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useShareCapture } from '../../hooks/useShareCapture'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import { competitiveMatches } from '../../lib/matchExclusions'
import {
  computeTournamentProgression,
  matchFiltersForPrimaryCombo,
} from '../../lib/tournamentProgression'
import {
  fullTournamentProgressionBuildFeatures,
  getTournamentProgressionBuildFeatures,
  TOURNAMENT_PROGRESSION_BUILD_STAGE_META,
  TOURNAMENT_PROGRESSION_BUILD_STAGES,
  type TournamentProgressionBuildStage,
} from '../../lib/tournamentProgressionBuildStage'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { TournamentProgressionAverage } from './TournamentProgressionAverage'
import { TournamentProgressionScope } from './TournamentProgressionScope'
import { tournamentProgressionInfo } from '../../content/sectionInfo'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'
import { TournamentProgressionChart } from './TournamentProgressionChart'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
  /**
   * Progressive build stage for ticket screenshots.
   * When null/omitted with picker enabled, local state defaults to 6 (full).
   * When picker is hidden and stage is omitted, full features are always shown.
   */
  buildStage?: TournamentProgressionBuildStage | null
  /** Show the ticket build stage chips above the card. Default true. */
  showBuildStagePicker?: boolean
}

export function TournamentProgressionSection({
  allMatches,
  filterOptions,
  importedAt,
  buildStage: buildStageProp = null,
  showBuildStagePicker = true,
}: Props) {
  const fields = ['time', 'competition', 'discipline', 'competitionAge'] as const

  const sectionDefaultFilters = useMemo(
    () =>
      matchFiltersForPrimaryCombo(
        computeTournamentProgression(competitiveMatches(allMatches)).primaryCombo,
      ),
    [allMatches],
  )

  const progressionFilterOptions = useMemo(
    () => ({
      ...filterOptions,
      competitions: filterOptions.competitions.filter(
        (option) => option.label.trim().toLowerCase() !== 'county',
      ),
    }),
    [filterOptions],
  )

  const [localBuildStage, setLocalBuildStage] =
    useState<TournamentProgressionBuildStage>(6)

  const buildStage =
    buildStageProp != null
      ? buildStageProp
      : showBuildStagePicker
        ? localBuildStage
        : null

  const features =
    buildStage != null
      ? getTournamentProgressionBuildFeatures(buildStage)
      : fullTournamentProgressionBuildFeatures()

  /** Before the Filters ticket, keep the full dataset so “N of N” is truthful. */
  const useUnfilteredDataset = buildStage != null && !features.showFilters

  const [filters, setFilters] = useState<MatchFilters>(() =>
    useUnfilteredDataset ? DEFAULT_MATCH_FILTERS : sectionDefaultFilters,
  )

  useEffect(() => {
    setFilters(useUnfilteredDataset ? DEFAULT_MATCH_FILTERS : sectionDefaultFilters)
  }, [importedAt, sectionDefaultFilters, useUnfilteredDataset])

  const matches = useSectionMatches(allMatches, filters)
  const progression = useMemo(
    () => computeTournamentProgression(competitiveMatches(matches)),
    [matches],
  )

  const {
    shareRef,
    share: shareSection,
    status: shareStatus,
  } = useShareCapture({
    filename: 'badminton-tournament-progression.png',
    title: 'Tournament progression',
  })

  const activeStage = buildStage ?? 6
  /** Share is outside the ticket story — only when the picker is off. */
  const showShare = !showBuildStagePicker

  const titleBlock = (
    <SectionHeading
      info={features.showInfo ? tournamentProgressionInfo : undefined}
      infoLabel="About Tournament progression"
    >
      <h3 className="font-medium text-ink-900">Tournament progression</h3>
    </SectionHeading>
  )

  const matchCount =
    features.showMatchCount ? (
      <FilterMatchCount
        filteredCount={matches.length}
        totalCount={allMatches.length}
        showWhenUnfiltered={useUnfilteredDataset}
      />
    ) : null

  const shareAction = showShare ? (
    <ShareButton
      onClick={() => void shareSection()}
      status={shareStatus}
      disabled={progression.tournamentCount === 0}
    />
  ) : null

  return (
    <div className="space-y-3">
      {showBuildStagePicker && (
        <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
            <div
              role="group"
              aria-label="Tournament progression ticket build stage"
              className="flex flex-wrap gap-1"
            >
              {TOURNAMENT_PROGRESSION_BUILD_STAGES.map((ticketStage) => {
                const selected = activeStage === ticketStage
                const meta = TOURNAMENT_PROGRESSION_BUILD_STAGE_META[ticketStage]
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
            {TOURNAMENT_PROGRESSION_BUILD_STAGE_META[activeStage].summary}
          </p>
        </div>
      )}

      <article className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
        {features.showFilters ? (
          <SectionHeaderWithFilters
            title={titleBlock}
            description={matchCount}
            titleActions={shareAction ?? undefined}
            filters={
              <CollapsibleFilters
                storageKey={showBuildStagePicker ? undefined : 'filters:tournament-progression'}
                defaultOpen={showBuildStagePicker}
                activeCount={countActiveSectionFilters(filters, [...fields])}
                onReset={() => setFilters(DEFAULT_MATCH_FILTERS)}
              >
                <SectionFilterBar
                  fields={[...fields]}
                  filters={filters}
                  options={progressionFilterOptions}
                  onChange={setFilters}
                  idPrefix="progression"
                />
              </CollapsibleFilters>
            }
          />
        ) : (
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-3">
              {titleBlock}
              {shareAction}
            </div>
            {matchCount}
          </div>
        )}

        <div ref={shareRef} data-share-root>
          {features.showFilters ? (
            <div className="border-b border-ink-100 py-3">
              <TournamentProgressionScope
                filters={filters}
                filterOptions={progressionFilterOptions}
                tournamentCount={progression.tournamentCount}
              />
            </div>
          ) : null}
          {features.showTypicalRun ? (
            <div
              className={
                features.showFilters
                  ? 'py-3'
                  : 'border-t border-ink-100 py-3'
              }
            >
              <TournamentProgressionAverage
                typicalLabel={progression.typicalLabel}
                typicalRank={progression.typicalRank}
                depthBarSegments={progression.depthBarSegments}
                knockoutOrBetterPercent={progression.knockoutOrBetterPercent}
                tournamentCount={progression.tournamentCount}
              />
            </div>
          ) : null}
          {features.showFinishDistribution ? (
            <div className="border-t border-ink-100 pt-4">
              <h4 className="text-sm font-medium text-ink-900">Finish distribution</h4>
              <div className="mt-2">
                <TournamentProgressionChart
                  data={progression.distribution}
                  tournamentCount={progression.tournamentCount}
                />
              </div>
            </div>
          ) : null}
        </div>
      </article>
    </div>
  )
}
