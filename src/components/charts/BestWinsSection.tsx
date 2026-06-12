import { useMemo, useState, type ReactNode } from 'react'
import { useShareCapture } from '../../hooks/useShareCapture'
import type { NormalizedMatch } from '../../types/matchHistory'
import {
  computeBestWins,
  selectUpsetRows,
  type BestWinRow,
} from '../../lib/bestWins'
import {
  clampDisplayWinChance,
  formatUpsetWinChanceDisplay,
} from '../../lib/ratingWinChance'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { matchesForDisciplineFamily } from '../../lib/partnerTournamentHistory'
import { formatMatchStageLabel, getMatchRound } from '../../lib/tournamentProgression'
import { getTournamentCategoryChipStyle } from '../../lib/tournamentCategoryStyle'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'
import { biggestUpsetsInfo, strongestBeatenInfo } from '../../content/sectionInfo'
import { SHARE_ROW_LIMIT, sliceRowsForShare } from '../../lib/shareLimits'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'

const LIMIT_OPTIONS = [3, 5, 10] as const
const DEFAULT_LIMIT = 5

const FILTER_SELECT_CLASS =
  'min-w-[4.5rem] appearance-none rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-8 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

type BestWinsDisciplineFilter = 'all' | 'singles' | 'doubles' | 'mixed'

type Props = {
  allMatches: NormalizedMatch[]
}

export function BestWinsSection({ allMatches }: Props) {
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT)
  const [disciplineFilter, setDisciplineFilter] =
    useState<BestWinsDisciplineFilter>('all')
  const [excludeStrengthDuplicates, setExcludeStrengthDuplicates] = useState(true)

  const filteredMatches = useMemo(() => {
    if (disciplineFilter === 'all') return allMatches
    return matchesForDisciplineFamily(allMatches, disciplineFilter)
  }, [allMatches, disciplineFilter])

  const bestWins = useMemo(
    () => computeBestWins(filteredMatches),
    [filteredMatches],
  )

  const limitOptions: number[] = [...LIMIT_OPTIONS]
  if (bestWins.ratedWinCount > 10) {
    limitOptions.push(bestWins.ratedWinCount)
  }

  const strengthRows = bestWins.byOpponentStrength.slice(0, limit)
  const upsetRows = useMemo(
    () =>
      selectUpsetRows(bestWins.byOpponentStrength, bestWins.byUpset, limit, {
        excludeStrengthDuplicates,
      }),
    [
      bestWins.byOpponentStrength,
      bestWins.byUpset,
      limit,
      excludeStrengthDuplicates,
    ],
  )

  const activeCount =
    (limit !== DEFAULT_LIMIT ? 1 : 0) +
    (disciplineFilter !== 'all' ? 1 : 0) +
    (excludeStrengthDuplicates === false ? 1 : 0)

  return (
    <article
      id="best-wins"
      className="scroll-mt-6 rounded-2xl card-frame bg-white p-4 shadow-sm"
    >
      <SectionHeaderWithFilters
        title={<h3 className="font-medium text-ink-900">Best wins</h3>}
        description={
          <FilterMatchCount
            filteredCount={filteredMatches.length}
            totalCount={allMatches.length}
          />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:best-wins"
            activeCount={activeCount}
            onReset={() => {
              setLimit(DEFAULT_LIMIT)
              setDisciplineFilter('all')
              setExcludeStrengthDuplicates(true)
            }}
          >
            <fieldset className="flex flex-wrap items-end gap-3 text-sm">
              <legend className="sr-only">Best wins filters</legend>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">
                  Discipline
                </span>
                <select
                  value={disciplineFilter}
                  onChange={(e) =>
                    setDisciplineFilter(e.target.value as BestWinsDisciplineFilter)
                  }
                  className={FILTER_SELECT_CLASS}
                >
                  <option value="all">All disciplines</option>
                  <option value="singles">Singles</option>
                  <option value="doubles">Doubles</option>
                  <option value="mixed">Mixed</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">
                  Show top
                </span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
                  className={FILTER_SELECT_CLASS}
                >
                  {limitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === bestWins.ratedWinCount && bestWins.ratedWinCount > 10
                        ? 'All'
                        : option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 self-end pb-2">
                <input
                  type="checkbox"
                  checked={!excludeStrengthDuplicates}
                  onChange={(e) => setExcludeStrengthDuplicates(!e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-200"
                />
                <span className="text-xs font-medium text-ink-700">
                  Include matches already in strongest beaten
                </span>
              </label>
            </fieldset>
          </CollapsibleFilters>
        }
      />

      {bestWins.ratedWinCount === 0 ? (
        <p className="mt-3 text-sm text-ink-700">No rated wins in this selection.</p>
      ) : (
        <div className="mt-3 grid gap-5 lg:grid-cols-2">
          <BestWinsPanel
            title="Strongest beaten"
            rows={strengthRows}
            metricKind="strength"
            info={strongestBeatenInfo}
            infoLabel="About Strongest beaten"
          />
          <BestWinsPanel
            title="Biggest upset wins"
            rows={upsetRows}
            metricKind="upset"
            info={biggestUpsetsInfo(limit, excludeStrengthDuplicates)}
            infoLabel="About Biggest upset wins"
          />
        </div>
      )}
    </article>
  )
}

type PanelProps = {
  title: string
  rows: BestWinRow[]
  metricKind: 'strength' | 'upset'
  info: ReactNode
  infoLabel: string
}

function shareFilenameForPanel(title: string): string {
  const slug = title.toLowerCase().replace(/\s+/g, '-')
  return `badminton-${slug}.png`
}

function BestWinsPanel({ title, rows, metricKind, info, infoLabel }: PanelProps) {
  const {
    shareRef,
    share: sharePanel,
    sharing: isSharing,
    status: shareStatus,
  } = useShareCapture({
    filename: shareFilenameForPanel(title),
    title,
  })

  const displayRows = isSharing ? sliceRowsForShare(rows, SHARE_ROW_LIMIT) : rows

  return (
    <section>
      <SectionHeading
        size="panel"
        info={info}
        infoLabel={infoLabel}
        actions={
          <ShareButton
            onClick={() => void sharePanel()}
            status={shareStatus}
            size="sm"
            disabled={rows.length === 0}
          />
        }
      >
        <h4 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          {title}
        </h4>
      </SectionHeading>
      {rows.length === 0 ? null : (
        <div ref={shareRef} data-share-root className="mt-1.5">
          <ol className="space-y-1">
            {displayRows.map((row, index) => (
              <BestWinRowItem
                key={`${row.match.date}-${row.match.opponents}-${index}`}
                row={row}
                metricKind={metricKind}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function BestWinRowItem({
  row,
  metricKind,
}: {
  row: BestWinRow
  metricKind: 'strength' | 'upset'
}) {
  const style = getDisciplineStyle(row.match.discipline)
  const partner = row.match.partnerName
  const stageLabel = formatMatchStageLabel(getMatchRound(row.match))
  const categoryChip = getTournamentCategoryChipStyle(row.match.tournamentCategoryLabel)
  const disciplineRowSpan = partner ? 'row-span-3' : 'row-span-2'

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-0.5 rounded-r border-l-4 py-1.5 pl-2 pr-1 ${style.borderClass} ${style.rowBgClass}`}
    >
      <DisciplineChip
        code={row.match.discipline}
        className={`${disciplineRowSpan} self-center`}
      />
      <div className="min-w-0">
        <p className="truncate font-medium text-ink-900" title={row.match.opponents}>
          {row.match.opponents}
        </p>
        {partner && (
          <p className="truncate text-xs text-ink-600" title={`Partner: ${partner}`}>
            with {partner}
          </p>
        )}
      </div>
      {metricKind === 'strength' ? (
        <p
          className="shrink-0 self-start tabular-nums text-sm font-semibold text-ink-900"
          title="Average opponent team rating"
        >
          {row.opponentTeamRating}
        </p>
      ) : (
        <div
          className="shrink-0 self-center text-right tabular-nums"
          title={upsetWinChanceTitle(row)}
        >
          <p className="text-base font-semibold leading-tight text-ink-900">
            {formatUpsetWinChanceDisplay(
              clampDisplayWinChance(row.preMatchWinChancePercent),
            )}
          </p>
          <p className="text-xs font-normal text-ink-500">win chance</p>
        </div>
      )}
      <p
        className="col-span-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs leading-snug"
        title={compactMetaTitle(row.match, stageLabel)}
      >
        {categoryChip != null && (
          <TournamentCategoryChip label={row.match.tournamentCategoryLabel} />
        )}
        {stageLabel != null && (
          <>
            {categoryChip != null && <MetaDot />}
            <span className="font-medium text-ink-600">{stageLabel}</span>
          </>
        )}
        {(categoryChip != null || stageLabel != null) && <MetaDot />}
        <span className="text-ink-500">{formatShortDate(row.match.date)}</span>
        {row.match.scoreSummary && (
          <>
            <MetaDot />
            <span className="truncate text-ink-500">{row.match.scoreSummary}</span>
          </>
        )}
      </p>
    </li>
  )
}

function MetaDot() {
  return <span aria-hidden className="text-ink-300">·</span>
}

function upsetWinChanceTitle(row: BestWinRow): string {
  const display = clampDisplayWinChance(row.preMatchWinChancePercent)
  const gap = row.ratingGap
  if (gap > 0) {
    return `~${display}% win chance before the match — they were rated ${gap} pts higher on average`
  }
  if (gap < 0) {
    return `~${display}% win chance before the match — you were rated ${Math.abs(gap)} pts higher on average`
  }
  return `~${display}% win chance before the match — evenly rated`
}

function compactMetaTitle(match: NormalizedMatch, stageLabel: string | null): string {
  const parts = [match.competitionName, match.disciplineLabel]
  if (match.tournamentCategoryLabel) parts.push(match.tournamentCategoryLabel)
  if (stageLabel) parts.push(stageLabel)
  if (match.partnerName) parts.push(`Partner: ${match.partnerName}`)
  if (match.scoreSummary) parts.push(match.scoreSummary)
  return parts.filter(Boolean).join(' · ')
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
