import { useMemo, useState, type ReactNode } from 'react'
import { useSectionMatches } from '../../hooks/useSectionMatches'
import { useResetFiltersOnImport } from '../../hooks/useResetFiltersOnImport'
import { useShareCapture } from '../../hooks/useShareCapture'
import { countActiveSectionFilters } from '../../lib/filterCounts'
import {
  formatWholePercent,
  formatWinLossRecord,
} from '../../lib/formatNumbers'
import {
  computeOpponentMatchups,
  DEFAULT_MIN_MEETINGS,
  DEFAULT_MIN_SCALP_WINS,
  getHeadToHeadMatches,
  type OpponentH2HRow,
} from '../../lib/opponentMatchups'
import type { FilterOptions } from '../../types/filters'
import { DEFAULT_MATCH_FILTERS, type MatchFilters } from '../../types/filters'
import type { NormalizedMatch } from '../../types/matchHistory'
import { CollapsibleFilters } from '../filters/CollapsibleFilters'
import { FilterMatchCount } from '../filters/FilterMatchCount'
import { SectionFilterBar } from '../filters/SectionFilterBar'
import { SectionHeaderWithFilters } from '../filters/SectionHeaderWithFilters'
import { favouriteOpponentsInfo, nemesesInfo } from '../../content/sectionInfo'
import {
  MATCH_SCOREBOARD_GRID,
  MatchScoreboardRow,
} from '../match/MatchScoreboardRow'
import { SHARE_ROW_LIMIT, sliceRowsForShare } from '../../lib/shareLimits'
import { SectionHeading } from '../ui/SectionHeading'
import { ShareButton } from '../ui/ShareButton'

const LIMIT_OPTIONS = [5, 10, 15] as const
const DEFAULT_LIMIT = 5

type MatchupKind = 'nemesis' | 'scalp'

const PANEL_STYLES: Record<
  MatchupKind,
  { wrapper: string; title: string; list: string }
> = {
  nemesis: {
    wrapper: '',
    title: 'text-loss-700',
    list: 'mt-1.5 space-y-1.5',
  },
  scalp: {
    wrapper: '',
    title: 'text-gain-700',
    list: 'mt-1.5 space-y-1',
  },
}

const ROW_STYLES: Record<
  MatchupKind,
  {
    row: string
    rank: string
    metric: string
    metricLabel: string
    lossPercent: string
    summaryButton: string
  }
> = {
  nemesis: {
    row: 'rounded-lg card-frame bg-white',
    rank: 'bg-loss-100 text-loss-700 ring-1 ring-loss-100',
    metric: 'text-loss-700',
    metricLabel: 'text-loss-700/80',
    lossPercent: 'font-medium text-loss-700',
    summaryButton: 'hover:bg-loss-50/60 focus-visible:ring-loss-100',
  },
  scalp: {
    row: 'rounded-lg card-frame bg-white',
    rank: 'bg-gain-100 text-gain-700 ring-1 ring-gain-100',
    metric: 'text-gain-700',
    metricLabel: 'text-gain-700/80',
    lossPercent: '',
    summaryButton: 'hover:bg-gain-50/60 focus-visible:ring-gain-100',
  },
}

type Props = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string | undefined
}

export function OpponentMatchupsSection({
  allMatches,
  filterOptions,
  importedAt,
}: Props) {
  const fields = ['time', 'discipline'] as const
  const [filters, setFilters] = useState<MatchFilters>(DEFAULT_MATCH_FILTERS)
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT)
  const [minMeetings, setMinMeetings] = useState(DEFAULT_MIN_MEETINGS)
  const [minScalpWins, setMinScalpWins] = useState(DEFAULT_MIN_SCALP_WINS)
  const [nemesisRatingProximity, setNemesisRatingProximity] = useState(true)

  useResetFiltersOnImport(importedAt, setFilters)

  const matches = useSectionMatches(allMatches, filters)

  const matchups = useMemo(
    () =>
      computeOpponentMatchups(
        matches,
        minMeetings,
        minScalpWins,
        nemesisRatingProximity,
      ),
    [matches, minMeetings, minScalpWins, nemesisRatingProximity],
  )

  const maxListLength = Math.max(matchups.nemeses.length, matchups.scalps.length)
  const limitOptions: number[] = [...LIMIT_OPTIONS]
  if (maxListLength > 15) {
    limitOptions.push(maxListLength)
  }

  const nemesisRows = matchups.nemeses.slice(0, limit)
  const scalpRows = matchups.scalps.slice(0, limit)
  const activeCount =
    countActiveSectionFilters(filters, [...fields]) +
    (limit !== DEFAULT_LIMIT ? 1 : 0) +
    (minMeetings !== DEFAULT_MIN_MEETINGS ? 1 : 0) +
    (minScalpWins !== DEFAULT_MIN_SCALP_WINS ? 1 : 0) +
    (!nemesisRatingProximity ? 1 : 0)

  return (
    <article
      id="opponent-matchups"
      className="scroll-mt-6 rounded-2xl card-frame bg-white p-4 shadow-sm"
    >
      <SectionHeaderWithFilters
        title={
          <h3 className="font-medium text-ink-900">Nemeses &amp; favourite opponents</h3>
        }
        description={
          <FilterMatchCount filteredCount={matches.length} totalCount={allMatches.length} />
        }
        filters={
          <CollapsibleFilters
            storageKey="filters:opponents"
            activeCount={activeCount}
            onReset={() => {
              setFilters(DEFAULT_MATCH_FILTERS)
              setLimit(DEFAULT_LIMIT)
              setMinMeetings(DEFAULT_MIN_MEETINGS)
              setMinScalpWins(DEFAULT_MIN_SCALP_WINS)
              setNemesisRatingProximity(true)
            }}
          >
            <fieldset className="flex flex-wrap items-end gap-3 text-sm">
              <legend className="sr-only">Opponent matchup filters</legend>
              <SectionFilterBar
                fields={[...fields]}
                filters={filters}
                options={filterOptions}
                onChange={setFilters}
                idPrefix="opponents"
                className="contents"
              />
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">
                  Minimum meetings
                </span>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={minMeetings}
                  onChange={(e) => {
                    const next = Number.parseInt(e.target.value, 10)
                    if (Number.isFinite(next) && next >= 1) {
                      setMinMeetings(Math.min(99, next))
                    }
                  }}
                  className="w-20 rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-ink-700">Show top</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
                  className="min-w-[4.5rem] appearance-none rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-8 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  {limitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option === maxListLength && maxListLength > 15 ? 'All' : option}
                    </option>
                  ))}
                </select>
              </label>
            </fieldset>
          </CollapsibleFilters>
        }
      />

      {matchups.competitiveMatchCount === 0 ? (
        <p className="mt-4 flex h-32 items-center justify-center text-sm text-ink-700">
          No competitive wins or losses in the current selection.
        </p>
      ) : (
        <>
          {matchups.hiddenBelowThresholdCount > 0 && (
            <p className="mt-3 text-xs text-ink-500">
              {matchups.hiddenBelowThresholdCount} opponent
              {matchups.hiddenBelowThresholdCount === 1 ? '' : 's'} hidden below{' '}
              {minMeetings} meeting{minMeetings === 1 ? '' : 's'}
            </p>
          )}
          <div className="mt-3 grid gap-5 lg:grid-cols-2">
            <MatchupPanel
              title="Nemeses"
              info={nemesesInfo}
              infoLabel="About Nemeses"
              rows={nemesisRows}
              kind="nemesis"
              matches={matches}
              ratingProximity={nemesisRatingProximity}
              onRatingProximityChange={setNemesisRatingProximity}
              emptyMessage={
                matchups.nemeses.length === 0
                  ? 'No opponents you are behind on at this threshold.'
                  : undefined
              }
            />
            <MatchupPanel
              title="Favourite opponents"
              info={favouriteOpponentsInfo}
              infoLabel="About Favourite opponents"
              rows={scalpRows}
              kind="scalp"
              matches={matches}
              minWins={minScalpWins}
              onMinWinsChange={setMinScalpWins}
              emptyMessage={
                matchups.scalps.length === 0
                  ? `No opponents with at least ${minScalpWins} rated win${minScalpWins === 1 ? '' : 's'} when they were higher and an even or winning record.`
                  : undefined
              }
            />
          </div>
        </>
      )}
    </article>
  )
}

type PanelProps = {
  title: string
  info: ReactNode
  infoLabel: string
  rows: OpponentH2HRow[]
  kind: MatchupKind
  matches: NormalizedMatch[]
  emptyMessage?: string
  minWins?: number
  onMinWinsChange?: (value: number) => void
  ratingProximity?: boolean
  onRatingProximityChange?: (value: boolean) => void
}

function shareFilenameForPanel(title: string): string {
  const slug = title.toLowerCase().replace(/\s+/g, '-')
  return `badminton-${slug}.png`
}

function MatchupPanel({
  title,
  info,
  infoLabel,
  rows,
  kind,
  matches,
  emptyMessage,
  minWins,
  onMinWinsChange,
  ratingProximity,
  onRatingProximityChange,
}: PanelProps) {
  const panel = PANEL_STYLES[kind]
  const showScalpControl =
    kind === 'scalp' && minWins != null && onMinWinsChange != null
  const showNemesisControl =
    kind === 'nemesis' &&
    ratingProximity != null &&
    onRatingProximityChange != null

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
    <section className={panel.wrapper || undefined}>
      <div className="flex min-h-9 items-center justify-between gap-2">
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
          <h4
            className={`text-xs font-medium uppercase tracking-wide ${
              panel.title
            }`}
          >
            {title}
          </h4>
        </SectionHeading>
        {showScalpControl ? (
          <label
            className="flex shrink-0 items-center gap-2 text-sm"
            data-share-exclude
          >
            <span className="text-xs font-medium text-gain-700">Min. wins</span>
            <input
              type="number"
              min={1}
              max={99}
              value={minWins}
              onChange={(e) => {
                const next = Number.parseInt(e.target.value, 10)
                if (Number.isFinite(next) && next >= 1) {
                  onMinWinsChange(Math.min(99, next))
                }
              }}
              className="w-16 rounded-lg border border-gain-100 bg-white px-2 py-1.5 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>
        ) : showNemesisControl ? (
          <label
            className="flex max-w-[11rem] shrink-0 items-center gap-1.5 text-sm lg:max-w-none"
            data-share-exclude
            title="When enough rivals qualify, opponents near your rating rank higher than those who beat you by a large margin with a similar record."
          >
            <input
              type="checkbox"
              checked={ratingProximity}
              onChange={(e) => onRatingProximityChange(e.target.checked)}
              className="h-3.5 w-3.5 shrink-0 rounded border-ink-300 text-loss-600 focus:ring-loss-100"
            />
            <span className="text-xs font-medium leading-tight text-loss-700">
              Prioritise close nemeses
            </span>
          </label>
        ) : (
          <span className="hidden w-[7.25rem] shrink-0 lg:block" aria-hidden />
        )}
      </div>
      {rows.length === 0 ? (
        <p className="mt-2 text-sm text-ink-700">{emptyMessage ?? 'None in this selection.'}</p>
      ) : (
        <div ref={shareRef} data-share-root>
          <ol className={panel.list}>
            {displayRows.map((row, index) => (
              <MatchupRowItem
                key={`${row.opponentName}-${index}`}
                row={row}
                kind={kind}
                rank={index + 1}
                matches={matches}
                shareMode={isSharing}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}

function MatchupRowItem({
  row,
  kind,
  rank,
  matches,
  shareMode = false,
}: {
  row: OpponentH2HRow
  kind: MatchupKind
  rank: number
  matches: NormalizedMatch[]
  shareMode?: boolean
}) {
  const [open, setOpen] = useState(false)
  const isOpen = shareMode ? false : open
  const record = formatWinLossRecord(row.wins, row.losses)
  const scalpGap = row.avgRatingGap
  const styles = ROW_STYLES[kind]
  const h2hMatches = useMemo(
    () => getHeadToHeadMatches(matches, row.opponentName),
    [matches, row.opponentName],
  )

  return (
    <li className={styles.row}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`flex w-full items-center gap-2.5 rounded-lg py-2.5 pr-3 pl-2.5 text-left transition focus:outline-none focus-visible:ring-2 ${styles.summaryButton}`}
        aria-expanded={isOpen}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${styles.rank}`}
          aria-hidden
        >
          {rank}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink-900" title={row.opponentName}>
            {row.opponentName}
          </p>
          <p className="text-xs text-ink-600">
            {kind === 'nemesis' ? (
              <>
                {row.games} meeting{row.games === 1 ? '' : 's'}
                <span className="text-loss-600/30"> · </span>
                {row.wins} win{row.wins === 1 ? '' : 's'}
                <span className="text-loss-600/30"> · </span>
                <span className={styles.lossPercent}>
                  {formatWholePercent(row.lossPercent)} losses
                </span>
              </>
            ) : (
              <>
                {row.ratedUpsetWins} win{row.ratedUpsetWins === 1 ? '' : 's'} when they were
                rated higher
                <span className="text-ink-400"> · </span>
                {record}
              </>
            )}
          </p>
        </div>
        <p
          className={`shrink-0 tabular-nums text-sm font-semibold ${styles.metric}`}
          title={
            kind === 'nemesis'
              ? `${row.losses} loss${row.losses === 1 ? '' : 'es'} against ${row.opponentName}`
              : ratingGapTitle(scalpGap, row.ratedUpsetWins, row.opponentName)
          }
        >
          {kind === 'nemesis' ? (
            <>
              {row.losses}
              <span className={`ml-0.5 text-xs font-normal ${styles.metricLabel}`}>
                losses
              </span>
            </>
          ) : scalpGap != null ? (
            <span className="flex flex-col items-end leading-tight">
              <span>{Math.round(scalpGap)}</span>
              <span className={`text-xs font-normal ${styles.metricLabel}`}>ahead of avg</span>
            </span>
          ) : null}
        </p>
        <ChevronIcon open={isOpen} kind={kind} />
      </button>

      {isOpen ? <OpponentH2HMatchList matches={h2hMatches} /> : null}
    </li>
  )
}

function OpponentH2HMatchList({ matches }: { matches: NormalizedMatch[] }) {
  const wins = matches
    .filter((match) => match.outcome === 'win')
    .sort((a, b) => b.date.localeCompare(a.date))
  const losses = matches
    .filter((match) => match.outcome === 'loss')
    .sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="border-t border-ink-50 bg-ink-50/40 py-2">
      {wins.length > 0 ? (
        <H2HOutcomeSection title="Wins" tone="gain" matches={wins} />
      ) : null}
      {losses.length > 0 ? (
        <H2HOutcomeSection
          title="Losses"
          tone="loss"
          matches={losses}
          className={wins.length > 0 ? 'mt-2' : undefined}
        />
      ) : null}
    </div>
  )
}

function H2HOutcomeSection({
  title,
  tone,
  matches,
  className,
}: {
  title: string
  tone: 'gain' | 'loss'
  matches: NormalizedMatch[]
  className?: string
}) {
  const bannerClass =
    tone === 'gain' ? 'bg-gain-50 text-gain-700' : 'bg-loss-50 text-loss-700'

  return (
    <section className={className}>
      <p
        className={`px-2 py-1 text-[10px] font-medium uppercase tracking-wide ${bannerClass}`}
      >
        {title}
      </p>
      <ul className={`mt-1 ${MATCH_SCOREBOARD_GRID} px-2`}>
        {matches.map((match, index) => (
          <MatchScoreboardRow
            key={`${match.date}-${match.competitionName}-${index}`}
            match={match}
          />
        ))}
      </ul>
    </section>
  )
}

function ChevronIcon({ open, kind }: { open: boolean; kind: MatchupKind }) {
  const color = kind === 'nemesis' ? 'text-loss-600' : 'text-gain-700'
  return (
    <svg
      data-share-exclude
      className={`h-3.5 w-3.5 shrink-0 transition ${color} ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function ratingGapTitle(
  gap: number | null,
  upsetWins: number,
  opponentName: string,
): string {
  if (gap == null) {
    return `${upsetWins} win${upsetWins === 1 ? '' : 's'} vs higher-rated ${opponentName}`
  }
  return `Across ${upsetWins} win${upsetWins === 1 ? '' : 's'} vs ${opponentName}, they were rated ${gap} pts higher than you on average before the match`
}
