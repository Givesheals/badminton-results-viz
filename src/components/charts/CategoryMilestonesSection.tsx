import { useEffect, useMemo, useState } from 'react'
import { categoryMilestonesInfo } from '../../content/sectionInfo'
import { useDashboardNavigation } from '../../context/DashboardNavigationContext'
import { useCategoryMilestoneClaims } from '../../hooks/useCategoryMilestoneClaims'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { useShareCapture } from '../../hooks/useShareCapture'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import { competitiveMatches } from '../../lib/matchExclusions'
import { matchesForDisciplineFamily } from '../../lib/partnerTournamentHistory'
import {
  CATEGORY_MILESTONE_SECTION_ID,
  categoryMilestoneRowId,
  comboKeyFromRow,
} from '../../lib/categoryMilestoneClaims'
import {
  categoryCompletionAgeKey,
  computeCategoryMilestones,
  groupCategoryCompletionsByAge,
  pickDefaultVisibleAgeLabels,
} from '../../lib/tournamentProgression'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { FilterSelect } from '../filters/FilterSelect'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'
import { TournamentCategoryCompletion } from './TournamentCategoryCompletion'

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
  /** Cap how many category cards render (premium showcase). */
  maxMilestoneCards?: number
}

type DisciplineFamilyFilter = 'all' | DisciplineFamily

const DISCIPLINE_FAMILY_OPTIONS = [
  { value: 'singles', label: 'Singles' },
  { value: 'doubles', label: 'Doubles' },
  { value: 'mixed', label: 'Mixed' },
] as const

export function CategoryMilestonesSection({
  allMatches,
  filterOptions,
  importedAt,
  maxMilestoneCards,
}: Props) {
  const [showAllAges, setShowAllAges] = useState(false)
  const [disciplineFamily, setDisciplineFamily] = useState<DisciplineFamilyFilter>('all')
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  const { milestoneTarget, clearMilestoneTarget } = useDashboardNavigation()
  const [highlightTarget, setHighlightTarget] = useState(milestoneTarget)

  const milestoneRows = useMemo(
    () => computeCategoryMilestones(competitiveMatches(allMatches)),
    [allMatches],
  )

  const { claimedKeys, claimRound, claimCard, isRoundClaimed, isCardClaimed } =
    useCategoryMilestoneClaims(milestoneRows)

  useResetFiltersOnImport(importedAt, setFilters)

  useEffect(() => {
    setDisciplineFamily('all')
    setShowAllAges(false)
  }, [importedAt])

  useEffect(() => {
    setShowAllAges(false)
  }, [filters, disciplineFamily])

  useEffect(() => {
    if (milestoneTarget == null) return
    setHighlightTarget(milestoneTarget)
  }, [milestoneTarget])

  const hasAnyMilestones = milestoneRows.length > 0

  const timeFilteredMatches = useSectionMatches(allMatches, filters)
  const matches = useMemo(() => {
    if (disciplineFamily === 'all') return timeFilteredMatches
    return matchesForDisciplineFamily(timeFilteredMatches, disciplineFamily)
  }, [timeFilteredMatches, disciplineFamily])

  const ageGroups = useMemo(() => {
    const rows = computeCategoryMilestones(competitiveMatches(matches))
    return groupCategoryCompletionsByAge(rows)
  }, [matches])

  const visibleAgeGroups = useMemo(() => {
    const base = (() => {
      if (showAllAges) return ageGroups
      const visibleKeys = new Set(pickDefaultVisibleAgeLabels(ageGroups))
      return ageGroups.filter((group) => visibleKeys.has(categoryCompletionAgeKey(group.ageLabel)))
    })()

    if (maxMilestoneCards == null || maxMilestoneCards <= 0) return base

    let remaining = maxMilestoneCards
    const limited: typeof base = []
    for (const group of base) {
      if (remaining <= 0) break
      const rows = group.rows.slice(0, remaining)
      remaining -= rows.length
      if (rows.length > 0) limited.push({ ...group, rows })
    }
    return limited
  }, [ageGroups, showAllAges, maxMilestoneCards])

  const hiddenAgeGroupCount = ageGroups.length - visibleAgeGroups.length

  const defaultAgeGroups = useMemo(() => {
    const visibleKeys = new Set(pickDefaultVisibleAgeLabels(ageGroups))
    return ageGroups.filter((group) => visibleKeys.has(categoryCompletionAgeKey(group.ageLabel)))
  }, [ageGroups])

  useEffect(() => {
    if (milestoneTarget == null) return

    const targetRow = ageGroups
      .flatMap((group) => group.rows)
      .find(
        (row) =>
          comboKeyFromRow(row.tournamentCategoryLabel, row.competitionAgeLabel) ===
          milestoneTarget.comboKey,
      )

    if (targetRow == null) return

    const targetAgeKey = categoryCompletionAgeKey(targetRow.competitionAgeLabel)
    const visibleKeys = new Set(pickDefaultVisibleAgeLabels(ageGroups))
    if (!visibleKeys.has(targetAgeKey)) {
      setShowAllAges(true)
    }
  }, [ageGroups, milestoneTarget])

  useEffect(() => {
    if (milestoneTarget == null) return

    const rowId = categoryMilestoneRowId(milestoneTarget.comboKey)
    const scrollToRow = () => {
      document.getElementById(rowId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(scrollToRow)
    })
  }, [milestoneTarget, visibleAgeGroups, showAllAges])

  const {
    shareRef,
    share: shareSection,
    sharing: isSharing,
    status: shareStatus,
  } = useShareCapture({
    filename: 'badminton-category-milestones.png',
    title: 'Category milestones',
  })

  const shareAgeGroups = isSharing ? defaultAgeGroups : visibleAgeGroups

  const activeFilterCount =
    countActiveSectionFilters(filters, ['time']) + (disciplineFamily !== 'all' ? 1 : 0)

  const claimsApi = useMemo(
    () => ({
      isRoundClaimed,
      isCardClaimed,
      onClaimRound: claimRound,
      onClaimCard: claimCard,
    }),
    [claimCard, claimRound, isCardClaimed, isRoundClaimed],
  )

  if (!hasAnyMilestones) {
    return null
  }

  return (
    <article
      id={CATEGORY_MILESTONE_SECTION_ID}
      className="scroll-mt-6 rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5"
    >
      <SectionHeaderWithFilters
        bordered
        title={
          <SectionHeading
            info={categoryMilestonesInfo}
            infoLabel="About Category milestones"
          >
            <h3 className="font-medium text-ink-900">Category milestones</h3>
          </SectionHeading>
        }
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        titleActions={
          <ShareButton
            onClick={() => void shareSection()}
            status={shareStatus}
            disabled={ageGroups.length === 0}
          />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:category-milestones"
            activeCount={activeFilterCount}
            onReset={() => {
              setFilters(DEFAULT_MATCH_FILTERS)
              setDisciplineFamily('all')
              setShowAllAges(false)
            }}
          >
            <div className="flex flex-wrap items-end gap-3">
              <FilterSelect
                id="category-milestones-discipline"
                label="Discipline"
                labelVisibility="visible"
                value={disciplineFamily === 'all' ? '' : disciplineFamily}
                allLabel="All disciplines"
                options={[...DISCIPLINE_FAMILY_OPTIONS]}
                onChange={(value) =>
                  setDisciplineFamily((value || 'all') as DisciplineFamilyFilter)
                }
              />
              <SectionFilterBar
                fields={['time']}
                filters={filters}
                options={filterOptions}
                onChange={setFilters}
                idPrefix="category-milestones"
                className="contents"
              />
            </div>
          </CollapsibleFilters>
        }
      />

      {ageGroups.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-700">
          No classified tournament milestones in this selection.
        </p>
      ) : (
        <div ref={shareRef} data-share-root>
          <TournamentCategoryCompletion
            ageGroups={shareAgeGroups}
            claims={claimsApi}
            claimedKeys={claimedKeys}
            highlightTarget={highlightTarget}
            onHighlightComplete={() => {
              setHighlightTarget(null)
              clearMilestoneTarget()
            }}
          />

          {!showAllAges && hiddenAgeGroupCount > 0 && maxMilestoneCards == null ? (
            <button
              type="button"
              onClick={() => setShowAllAges(true)}
              data-share-exclude
              className="mt-3 w-full rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              Show earlier age groups ({hiddenAgeGroupCount})
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
