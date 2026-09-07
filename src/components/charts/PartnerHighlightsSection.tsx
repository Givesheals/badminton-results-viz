import { useEffect, useMemo, useState } from 'react'
import { filterMatches } from '../../lib/filterMatches'
import {
  computePartnerAchievements,
  partnerCompetitionFilterOptions,
  partnerFilterOptions,
} from '../../lib/partnerAchievements'
import { matchesForDisciplineFamily } from '../../lib/partnerTournamentHistory'
import {
  fullPartnerHighlightsBuildFeatures,
  getPartnerHighlightsBuildFeatures,
  PARTNER_HIGHLIGHTS_BUILD_STAGE_META,
  PARTNER_HIGHLIGHTS_BUILD_STAGES,
  type PartnerHighlightsBuildStage,
} from '../../lib/partnerHighlightsBuildStage'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { partnerHighlightsInfo } from '../../content/sectionInfo'
import { SectionHeading } from '../ui/SectionHeading'
import { PartnerHighlightsFamilyBlock } from './PartnerHighlightsFamilyBlock'

const DEFAULT_SHOW_DOUBLES = 2
const DEFAULT_SHOW_MIXED = 2

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
  /**
   * Progressive build stage for ticket screenshots.
   * When null/omitted with picker enabled, local state defaults to 7 (full).
   * When picker is hidden and stage is omitted, full features are always shown.
   */
  buildStage?: PartnerHighlightsBuildStage | null
  /** Show the ticket build stage chips above the card. Default true. */
  showBuildStagePicker?: boolean
}

function partnerInFamily(
  data: { partners: { partnerName: string }[] },
  partnerName: string,
): boolean {
  if (!partnerName) return false
  return data.partners.some((row) => row.partnerName === partnerName)
}

function matchesForFamily(
  allMatches: NormalizedMatch[],
  family: 'doubles' | 'mixed',
  time: string,
  competition: string,
  competitionAge: string,
): NormalizedMatch[] {
  const timeFiltered = filterMatches(allMatches, {
    ...DEFAULT_MATCH_FILTERS,
    time,
    competitionAge,
  })
  const familyMatches = matchesForDisciplineFamily(timeFiltered, family)
  if (!competition) return familyMatches
  return familyMatches.filter((match) => match.tournamentCategory === competition)
}

export function PartnerHighlightsSection({
  allMatches,
  filterOptions,
  importedAt,
  buildStage: buildStageProp = null,
  showBuildStagePicker = true,
}: Props) {
  const [localBuildStage, setLocalBuildStage] =
    useState<PartnerHighlightsBuildStage>(7)

  const buildStage =
    buildStageProp != null
      ? buildStageProp
      : showBuildStagePicker
        ? localBuildStage
        : null

  const features =
    buildStage != null
      ? getPartnerHighlightsBuildFeatures(buildStage)
      : fullPartnerHighlightsBuildFeatures()

  /** Before the Filters ticket, keep All time so screenshots are not filter-scoped. */
  const useUnfilteredDataset = buildStage != null && !features.showFilters
  const [highlightDoublesTime, setHighlightDoublesTime] = useState(
    DEFAULT_MATCH_FILTERS.time,
  )
  const [highlightMixedTime, setHighlightMixedTime] = useState(DEFAULT_MATCH_FILTERS.time)
  const [highlightDoublesPartner, setHighlightDoublesPartner] = useState('')
  const [highlightMixedPartner, setHighlightMixedPartner] = useState('')
  const [highlightDoublesCompetition, setHighlightDoublesCompetition] = useState('')
  const [highlightMixedCompetition, setHighlightMixedCompetition] = useState('')
  const [highlightDoublesCompetitionAge, setHighlightDoublesCompetitionAge] = useState('')
  const [highlightMixedCompetitionAge, setHighlightMixedCompetitionAge] = useState('')

  useEffect(() => {
    setHighlightDoublesTime(DEFAULT_MATCH_FILTERS.time)
    setHighlightMixedTime(DEFAULT_MATCH_FILTERS.time)
    setHighlightDoublesPartner('')
    setHighlightMixedPartner('')
    setHighlightDoublesCompetition('')
    setHighlightMixedCompetition('')
    setHighlightDoublesCompetitionAge('')
    setHighlightMixedCompetitionAge('')
  }, [importedAt, useUnfilteredDataset])

  const doublesBaseMatches = useMemo(
    () => matchesForDisciplineFamily(
      filterMatches(allMatches, { ...DEFAULT_MATCH_FILTERS, time: highlightDoublesTime }),
      'doubles',
    ),
    [allMatches, highlightDoublesTime],
  )
  const mixedBaseMatches = useMemo(
    () => matchesForDisciplineFamily(
      filterMatches(allMatches, { ...DEFAULT_MATCH_FILTERS, time: highlightMixedTime }),
      'mixed',
    ),
    [allMatches, highlightMixedTime],
  )

  const doublesMatches = useMemo(
    () =>
      matchesForFamily(
        allMatches,
        'doubles',
        highlightDoublesTime,
        highlightDoublesCompetition,
        highlightDoublesCompetitionAge,
      ),
    [
      allMatches,
      highlightDoublesTime,
      highlightDoublesCompetition,
      highlightDoublesCompetitionAge,
    ],
  )
  const mixedMatches = useMemo(
    () =>
      matchesForFamily(
        allMatches,
        'mixed',
        highlightMixedTime,
        highlightMixedCompetition,
        highlightMixedCompetitionAge,
      ),
    [
      allMatches,
      highlightMixedTime,
      highlightMixedCompetition,
      highlightMixedCompetitionAge,
    ],
  )

  const allTimeDoublesMatches = useMemo(
    () =>
      matchesForFamily(
        allMatches,
        'doubles',
        'all',
        highlightDoublesCompetition,
        highlightDoublesCompetitionAge,
      ),
    [
      allMatches,
      highlightDoublesCompetition,
      highlightDoublesCompetitionAge,
    ],
  )
  const allTimeMixedMatches = useMemo(
    () =>
      matchesForFamily(
        allMatches,
        'mixed',
        'all',
        highlightMixedCompetition,
        highlightMixedCompetitionAge,
      ),
    [
      allMatches,
      highlightMixedCompetition,
      highlightMixedCompetitionAge,
    ],
  )

  const timeRangeOptions = useMemo(
    () => filterOptions.timeRanges.filter((o) => o.value !== 'all'),
    [filterOptions.timeRanges],
  )

  const achievements = useMemo(
    () => ({
      doubles: computePartnerAchievements(doublesMatches).doubles,
      mixed: computePartnerAchievements(mixedMatches).mixed,
    }),
    [doublesMatches, mixedMatches],
  )

  const allTimeAchievements = useMemo(
    () => ({
      doubles: computePartnerAchievements(allTimeDoublesMatches).doubles,
      mixed: computePartnerAchievements(allTimeMixedMatches).mixed,
    }),
    [allTimeDoublesMatches, allTimeMixedMatches],
  )

  const doublesCompetitionOptions = useMemo(
    () => partnerCompetitionFilterOptions(doublesBaseMatches),
    [doublesBaseMatches],
  )
  const mixedCompetitionOptions = useMemo(
    () => partnerCompetitionFilterOptions(mixedBaseMatches),
    [mixedBaseMatches],
  )

  const doublesPartnerOptions = useMemo(
    () => partnerFilterOptions(achievements.doubles),
    [achievements.doubles],
  )
  const mixedPartnerOptions = useMemo(
    () => partnerFilterOptions(achievements.mixed),
    [achievements.mixed],
  )

  useEffect(() => {
    if (
      highlightDoublesPartner &&
      !doublesPartnerOptions.some((o) => o.value === highlightDoublesPartner)
    ) {
      setHighlightDoublesPartner('')
    }
  }, [highlightDoublesPartner, doublesPartnerOptions])

  useEffect(() => {
    if (
      highlightMixedPartner &&
      !mixedPartnerOptions.some((o) => o.value === highlightMixedPartner)
    ) {
      setHighlightMixedPartner('')
    }
  }, [highlightMixedPartner, mixedPartnerOptions])

  useEffect(() => {
    if (
      highlightDoublesCompetition &&
      !doublesCompetitionOptions.some((o) => o.value === highlightDoublesCompetition)
    ) {
      setHighlightDoublesCompetition('')
    }
  }, [highlightDoublesCompetition, doublesCompetitionOptions])

  useEffect(() => {
    if (
      highlightMixedCompetition &&
      !mixedCompetitionOptions.some((o) => o.value === highlightMixedCompetition)
    ) {
      setHighlightMixedCompetition('')
    }
  }, [highlightMixedCompetition, mixedCompetitionOptions])

  const hasPlayedDoubles = useMemo(
    () => matchesForDisciplineFamily(allMatches, 'doubles').length > 0,
    [allMatches],
  )
  const hasPlayedMixed = useMemo(
    () => matchesForDisciplineFamily(allMatches, 'mixed').length > 0,
    [allMatches],
  )

  const showDoublesSection = features.showDisciplines && hasPlayedDoubles
  const showMixedSection = features.showDisciplines && hasPlayedMixed

  const isBrowsingOnePartner =
    highlightDoublesPartner.length > 0 || highlightMixedPartner.length > 0

  const showEmptyMessage =
    features.showDisciplines &&
    !showDoublesSection &&
    !showMixedSection &&
    !isBrowsingOnePartner

  const activeStage = buildStage ?? 7
  const showShare = !showBuildStagePicker

  return (
    <div className="space-y-3">
      {showBuildStagePicker && (
        <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
            <div
              role="group"
              aria-label="Tournament partners ticket build stage"
              className="flex flex-wrap gap-1"
            >
              {PARTNER_HIGHLIGHTS_BUILD_STAGES.map((ticketStage) => {
                const selected = activeStage === ticketStage
                const meta = PARTNER_HIGHLIGHTS_BUILD_STAGE_META[ticketStage]
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
            {PARTNER_HIGHLIGHTS_BUILD_STAGE_META[activeStage].summary}
          </p>
        </div>
      )}

      <article className="rounded-2xl card-frame bg-white p-4 shadow-sm">
        <SectionHeading
          info={features.showInfo ? partnerHighlightsInfo : undefined}
          infoLabel="About Tournament partners"
        >
          <h3 className="font-medium text-ink-900">Tournament partners</h3>
        </SectionHeading>

        {showEmptyMessage ? (
          <p className="mt-4 flex min-h-32 items-center justify-center text-sm text-ink-700">
            No doubles or mixed matches with a partner in the current selection.
          </p>
        ) : showDoublesSection || showMixedSection ? (
          <div className="mt-4 grid gap-6">
            {showDoublesSection ? (
              <section
                className={`rounded-xl border-l-4 p-4 ${getDisciplineStyle('WD').rowBgClass} ${getDisciplineStyle('WD').borderClass}`}
              >
                <PartnerHighlightsFamilyBlock
                  family="doubles"
                  title="Doubles"
                  data={achievements.doubles}
                  familyMatches={doublesMatches}
                  initialVisibleCount={DEFAULT_SHOW_DOUBLES}
                  partnerOptions={doublesPartnerOptions}
                  selectedPartner={highlightDoublesPartner}
                  onSelectedPartnerChange={setHighlightDoublesPartner}
                  time={highlightDoublesTime}
                  onTimeChange={setHighlightDoublesTime}
                  timeOptions={timeRangeOptions}
                  competition={highlightDoublesCompetition}
                  onCompetitionChange={setHighlightDoublesCompetition}
                  competitionOptions={doublesCompetitionOptions}
                  competitionAge={highlightDoublesCompetitionAge}
                  onCompetitionAgeChange={setHighlightDoublesCompetitionAge}
                  competitionAgeOptions={filterOptions.competitionAges}
                  partnerInPeriod={partnerInFamily(
                    achievements.doubles,
                    highlightDoublesPartner,
                  )}
                  partnerHasDataAllTime={partnerInFamily(
                    allTimeAchievements.doubles,
                    highlightDoublesPartner,
                  )}
                  features={features}
                  showShare={showShare}
                />
              </section>
            ) : null}
            {showMixedSection ? (
              <section
                className={`rounded-xl border-l-4 p-4 ${getDisciplineStyle('XD').rowBgClass} ${getDisciplineStyle('XD').borderClass}`}
              >
                <PartnerHighlightsFamilyBlock
                  family="mixed"
                  title="Mixed"
                  data={achievements.mixed}
                  familyMatches={mixedMatches}
                  initialVisibleCount={DEFAULT_SHOW_MIXED}
                  partnerOptions={mixedPartnerOptions}
                  selectedPartner={highlightMixedPartner}
                  onSelectedPartnerChange={setHighlightMixedPartner}
                  time={highlightMixedTime}
                  onTimeChange={setHighlightMixedTime}
                  timeOptions={timeRangeOptions}
                  competition={highlightMixedCompetition}
                  onCompetitionChange={setHighlightMixedCompetition}
                  competitionOptions={mixedCompetitionOptions}
                  competitionAge={highlightMixedCompetitionAge}
                  onCompetitionAgeChange={setHighlightMixedCompetitionAge}
                  competitionAgeOptions={filterOptions.competitionAges}
                  partnerInPeriod={partnerInFamily(
                    achievements.mixed,
                    highlightMixedPartner,
                  )}
                  partnerHasDataAllTime={partnerInFamily(
                    allTimeAchievements.mixed,
                    highlightMixedPartner,
                  )}
                  features={features}
                  showShare={showShare}
                />
              </section>
            ) : null}
          </div>
        ) : null}
      </article>
    </div>
  )
}
