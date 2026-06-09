import { useEffect, useMemo, useState } from 'react'
import { filterMatches } from '../../lib/filterMatches'
import {
  computePartnerAchievements,
  partnerCompetitionFilterOptions,
  partnerFilterOptions,
} from '../../lib/partnerAchievements'
import { matchesForDisciplineFamily } from '../../lib/partnerTournamentHistory'
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
}: Props) {
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
  }, [importedAt])

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

  const hasAnyData =
    achievements.doubles.totalPartnerCount > 0 ||
    achievements.mixed.totalPartnerCount > 0

  const isBrowsingOnePartner =
    highlightDoublesPartner.length > 0 || highlightMixedPartner.length > 0

  return (
    <article className="rounded-2xl card-frame bg-white p-4 shadow-sm">
      <SectionHeading
        info={partnerHighlightsInfo}
        infoLabel="About Tournament partners"
      >
        <h3 className="font-medium text-ink-900">Tournament partners</h3>
      </SectionHeading>

      {!hasAnyData && !isBrowsingOnePartner ? (
        <p className="mt-4 flex min-h-32 items-center justify-center text-sm text-ink-700">
          No doubles or mixed matches with a partner in the current selection.
        </p>
      ) : (
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
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
            />
          </section>
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
            />
          </section>
        </div>
      )}
    </article>
  )
}
