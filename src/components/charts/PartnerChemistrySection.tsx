import { useMemo, useState } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { useShareCapture } from '../../hooks/useShareCapture'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import {
  computePartnerChemistry,
  type PartnerChemistryDisplayMode,
  type PartnerChemistryFilterMode,
} from '../../lib/partnerChemistry'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { partnerChemistryInfo } from '../../content/sectionInfo'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'
import { PartnerChemistryChart } from './PartnerChemistryChart'

const DEFAULT_MIN_THRESHOLD = 5

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
  /** Cap partners shown on the chart (premium showcase). */
  maxPartners?: number
  /** Optional starting minimum-matches threshold (premium showcase). */
  initialMinThreshold?: number
}

export function PartnerChemistrySection({
  allMatches,
  filterOptions,
  importedAt,
  maxPartners,
  initialMinThreshold = DEFAULT_MIN_THRESHOLD,
}: Props) {
  const fields = ['time'] as const
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  const [minThreshold, setMinThreshold] = useState(initialMinThreshold)
  const [filterMode, setFilterMode] = useState<PartnerChemistryFilterMode>('matches')
  const [displayMode, setDisplayMode] = useState<PartnerChemistryDisplayMode>('chemistry')

  useResetFiltersOnImport(importedAt, setFilters)

  const matches = useSectionMatches(allMatches, filters)

  const chemistry = useMemo(() => {
    const full = computePartnerChemistry(matches, minThreshold, filterMode, displayMode)
    if (maxPartners == null || maxPartners <= 0 || full.partners.length <= maxPartners) {
      return full
    }
    return {
      ...full,
      partners: full.partners.slice(0, maxPartners),
      hiddenCount: full.hiddenCount + (full.partners.length - maxPartners),
    }
  }, [matches, minThreshold, filterMode, displayMode, maxPartners])

  const thresholdLabel = filterMode === 'matches' ? 'matches' : 'competitions'
  const activeCount =
    countActiveSectionFilters(filters, [...fields]) +
    (filterMode !== 'matches' ? 1 : 0) +
    (minThreshold !== DEFAULT_MIN_THRESHOLD ? 1 : 0) +
    (displayMode !== 'chemistry' ? 1 : 0)

  const {
    shareRef,
    share: shareSection,
    status: shareStatus,
  } = useShareCapture({
    filename: 'badminton-partner-chemistry.png',
    title: 'Partner chemistry',
  })

  return (
    <article
      id="partner-chemistry"
      className="scroll-mt-6 rounded-2xl card-frame bg-white p-4 shadow-sm"
    >
      <SectionHeaderWithFilters
        title={
          <SectionHeading
            info={partnerChemistryInfo}
            infoLabel="About Partner chemistry"
          >
            <h3 className="font-medium text-ink-900">Partner chemistry</h3>
          </SectionHeading>
        }
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        titleActions={
          <ShareButton
            onClick={() => void shareSection()}
            status={shareStatus}
            disabled={chemistry.doublesMatchCount === 0}
          />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:partner-chemistry"
            activeCount={activeCount}
            onReset={() => {
              setFilters(DEFAULT_MATCH_FILTERS)
              setMinThreshold(initialMinThreshold)
              setFilterMode('matches')
              setDisplayMode('chemistry')
            }}
          >
            <fieldset className="flex flex-wrap items-end gap-3 text-sm">
              <legend className="sr-only">Partner chemistry filters</legend>
              <SectionFilterBar
                fields={[...fields]}
                filters={filters}
                options={filterOptions}
                onChange={setFilters}
                idPrefix="chemistry"
                className="contents"
              />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">Show</span>
                <select
                  value={displayMode}
                  onChange={(e) =>
                    setDisplayMode(e.target.value as PartnerChemistryDisplayMode)
                  }
                  className="w-full min-w-[9.5rem] appearance-none rounded-lg border border-ink-100 bg-white py-2 pl-3 pr-8 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="chemistry">Chemistry</option>
                  <option value="partnershipRating">Partnership rating</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">Count by</span>
                <select
                  value={filterMode}
                  onChange={(e) =>
                    setFilterMode(e.target.value as PartnerChemistryFilterMode)
                  }
                  className="w-full min-w-[9.5rem] appearance-none rounded-lg border border-ink-100 bg-white py-2 pl-3 pr-8 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="matches">Matches played</option>
                  <option value="competitions">Competitions</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">
                  Minimum {thresholdLabel}
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={minThreshold}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10)
                    if (Number.isFinite(next) && next >= 1) {
                      setMinThreshold(Math.min(99, next))
                    }
                  }}
                  className="w-20 rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
                />
              </label>
            </fieldset>
          </CollapsibleFilters>
        }
      />

      {chemistry.doublesMatchCount === 0 ? (
        <p className="mt-4 flex h-48 items-center justify-center text-sm text-ink-700">
          No doubles matches with a partner in the current selection.
        </p>
      ) : (
        <div ref={shareRef} data-share-root>
          <p className="mt-3 text-xs text-ink-500" data-share-exclude>
            Showing {chemistry.partners.length} of {chemistry.totalPartnerCount} partner
            {chemistry.totalPartnerCount === 1 ? '' : 's'}
            {chemistry.hiddenCount > 0 && (
              <>
                {' '}
                ({chemistry.hiddenCount} hidden below {minThreshold} {thresholdLabel})
              </>
            )}
          </p>
          <div className="mt-2">
            <PartnerChemistryChart data={chemistry.partners} displayMode={displayMode} />
          </div>
        </div>
      )}
    </article>
  )
}
