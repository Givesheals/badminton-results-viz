import { useState } from 'react'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import type { PartnerAchievementsFamily } from '../../lib/partnerAchievements'
import type { FilterOption } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterSelect } from '../filters/FilterSelect'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { PartnerHighlightCard } from './PartnerHighlightCard'
import { PartnerTournamentHistoryPanel } from './PartnerTournamentHistoryPanel'

const SHOW_MORE_STEP = 3

type Props = {
  family: DisciplineFamily
  title: string
  data: PartnerAchievementsFamily
  familyMatches: NormalizedMatch[]
  initialVisibleCount: number
  partnerOptions: FilterOption[]
  selectedPartner: string
  onSelectedPartnerChange: (value: string) => void
  time: string
  onTimeChange: (value: string) => void
  timeOptions: FilterOption[]
  competition: string
  onCompetitionChange: (value: string) => void
  competitionOptions: FilterOption[]
  competitionAge: string
  onCompetitionAgeChange: (value: string) => void
  competitionAgeOptions: FilterOption[]
  partnerInPeriod: boolean
  partnerHasDataAllTime: boolean
}

export function PartnerHighlightsFamilyBlock({
  family,
  title,
  data,
  familyMatches,
  initialVisibleCount,
  partnerOptions,
  selectedPartner,
  onSelectedPartnerChange,
  time,
  onTimeChange,
  timeOptions,
  competition,
  onCompetitionChange,
  competitionOptions,
  competitionAge,
  onCompetitionAgeChange,
  competitionAgeOptions,
  partnerInPeriod,
  partnerHasDataAllTime,
}: Props) {
  const resetKey = `${initialVisibleCount}:${time}:${competition}:${competitionAge}:${selectedPartner}:${data.partners.length}`

  return (
    <PartnerHighlightsFamilyBlockBody
      key={resetKey}
      family={family}
      title={title}
      data={data}
      familyMatches={familyMatches}
      initialVisibleCount={initialVisibleCount}
      partnerOptions={partnerOptions}
      selectedPartner={selectedPartner}
      onSelectedPartnerChange={onSelectedPartnerChange}
      time={time}
      onTimeChange={onTimeChange}
      timeOptions={timeOptions}
      competition={competition}
      onCompetitionChange={onCompetitionChange}
      competitionOptions={competitionOptions}
      competitionAge={competitionAge}
      onCompetitionAgeChange={onCompetitionAgeChange}
      competitionAgeOptions={competitionAgeOptions}
      partnerInPeriod={partnerInPeriod}
      partnerHasDataAllTime={partnerHasDataAllTime}
    />
  )
}

function PartnerHighlightsFamilyBlockBody({
  family,
  title,
  data,
  familyMatches,
  initialVisibleCount,
  partnerOptions,
  selectedPartner,
  onSelectedPartnerChange,
  time,
  onTimeChange,
  timeOptions,
  competition,
  onCompetitionChange,
  competitionOptions,
  competitionAge,
  onCompetitionAgeChange,
  competitionAgeOptions,
  partnerInPeriod,
  partnerHasDataAllTime,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount)
  const disciplineCode = family === 'doubles' ? 'WD' : 'XD'
  const style = getDisciplineStyle(disciplineCode)
  const isSinglePartner = selectedPartner.length > 0
  const visible = isSinglePartner
    ? data.partners.filter((row) => row.partnerName === selectedPartner)
    : data.partners.slice(0, visibleCount)
  const hasPartners = data.totalPartnerCount > 0
  const remainingPartners = isSinglePartner
    ? 0
    : Math.max(0, data.partners.length - visible.length)

  const activeFilterCount =
    (time !== 'all' ? 1 : 0) +
    (competition ? 1 : 0) +
    (selectedPartner ? 1 : 0) +
    (competitionAge ? 1 : 0)

  return (
    <div className="space-y-3">
      <SectionHeaderWithFilters
        title={
          <h4
            className={`inline-block rounded-md px-2 py-0.5 text-sm font-medium ${style.chipClass}`}
          >
            {title}
          </h4>
        }
        filters={
          <CollapsibleFilters
            storageKey={`filters:partner-highlights-${family}`}
            activeCount={activeFilterCount}
            contentClassName="grid grid-cols-2 gap-3"
            onReset={() => {
              onTimeChange('all')
              onCompetitionChange('')
              onSelectedPartnerChange('')
              onCompetitionAgeChange('')
            }}
          >
            <FilterSelect
              id={`highlights-${family}-time`}
              label="Time"
              labelVisibility="visible"
              value={time === 'all' ? '' : time}
              allLabel="All time"
              options={timeOptions}
              onChange={(value) => onTimeChange(value || 'all')}
              className="min-w-0"
            />
            <FilterSelect
              id={`highlights-${family}-competition`}
              label="Competition"
              labelVisibility="visible"
              value={competition}
              allLabel="All competitions"
              options={competitionOptions}
              onChange={onCompetitionChange}
              className="min-w-0"
            />
            <FilterSelect
              id={`highlights-${family}-partner`}
              label="Partner"
              labelVisibility="visible"
              value={selectedPartner}
              allLabel="All partners"
              options={partnerOptions}
              onChange={onSelectedPartnerChange}
              className="min-w-0"
            />
            <FilterSelect
              id={`highlights-${family}-competition-age`}
              label="Competition age"
              labelVisibility="visible"
              value={competitionAge}
              allLabel="All ages"
              options={competitionAgeOptions}
              onChange={onCompetitionAgeChange}
              className="min-w-0"
            />
            {isSinglePartner ? (
              <div className="col-span-2">
                <button
                  type="button"
                  onClick={() => onSelectedPartnerChange('')}
                  className="text-sm font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  Show all partners
                </button>
              </div>
            ) : null}
          </CollapsibleFilters>
        }
      />

      {isSinglePartner && !partnerInPeriod ? (
        <PartnerPeriodEmptyState
          partnerName={selectedPartner}
          familyLabel={title.toLowerCase()}
          hasDataAllTime={partnerHasDataAllTime}
        />
      ) : !hasPartners ? (
        <p className="text-sm text-ink-600">
          No progression tournaments with a partner in this category yet.
        </p>
      ) : (
        <>
          <ul
            className={
              isSinglePartner ? 'max-w-md space-y-3' : 'grid gap-3 sm:grid-cols-2'
            }
          >
            {visible.map((row) => (
              <li key={row.partnerName}>
                <PartnerHighlightCard
                  row={row}
                  onSelect={
                    isSinglePartner
                      ? undefined
                      : () => onSelectedPartnerChange(row.partnerName)
                  }
                  isSelected={isSinglePartner}
                />
              </li>
            ))}
          </ul>

          {isSinglePartner && partnerInPeriod ? (
            <PartnerTournamentHistoryPanel
              matches={familyMatches}
              partnerName={selectedPartner}
              family={family}
              disciplineCode={disciplineCode}
            />
          ) : null}

          {!isSinglePartner ? (
            <div className="space-y-2 pt-1">
              {remainingPartners > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount((count) =>
                      Math.min(data.partners.length, count + SHOW_MORE_STEP),
                    )
                  }
                  className="w-full rounded-lg border border-brand-200 bg-white px-4 py-2.5 text-sm font-medium text-brand-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  Show more
                </button>
              ) : null}
              <PartnerHighlightsFooter
                total={data.partners.length}
                familyLabel={title.toLowerCase()}
                hasMoreToShow={remainingPartners > 0}
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function PartnerPeriodEmptyState({
  partnerName,
  familyLabel,
  hasDataAllTime,
}: {
  partnerName: string
  familyLabel: string
  hasDataAllTime: boolean
}) {
  if (hasDataAllTime) {
    return (
      <div className="rounded-xl card-frame bg-white p-4 text-sm text-ink-700 shadow-sm">
        <p className="font-medium text-ink-900">No {familyLabel} data in this period</p>
        <p className="mt-1">
          Nothing with {partnerName} in the time range you selected. Try{' '}
          <span className="font-medium text-ink-900">All time</span> or pick another
          period to see their highlights together.
        </p>
      </div>
    )
  }

  return (
    <p className="text-sm text-ink-600">
      No {familyLabel} progression data with {partnerName} in your results.
    </p>
  )
}

function PartnerHighlightsFooter({
  total,
  familyLabel,
  hasMoreToShow,
}: {
  total: number
  familyLabel: string
  hasMoreToShow: boolean
}) {
  if (hasMoreToShow || total === 0) return null

  return (
    <p className="text-xs text-ink-500">
      Showing all {total} {familyLabel} partners
    </p>
  )
}
