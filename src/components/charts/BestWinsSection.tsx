import { useMemo, useState, type ReactNode } from 'react'
import type { NormalizedMatch } from '../../types/matchHistory'
import {
  computeBestWins,
  selectUpsetRowsExcludingStrength,
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
import { SectionHeading } from '../ui/SectionHeading'

const LIMIT_OPTIONS = [3, 5, 10] as const
const DEFAULT_LIMIT = 5

const FILTER_SELECT_CLASS =
  'rounded-lg border border-ink-100 bg-white py-1 pl-2 pr-7 text-sm text-ink-900 shadow-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100'

type BestWinsDisciplineFilter = 'all' | 'singles' | 'doubles' | 'mixed'

type Props = {
  matches: NormalizedMatch[]
}

export function BestWinsSection({ matches }: Props) {
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT)
  const [disciplineFilter, setDisciplineFilter] =
    useState<BestWinsDisciplineFilter>('all')

  const filteredMatches = useMemo(() => {
    if (disciplineFilter === 'all') return matches
    return matchesForDisciplineFamily(matches, disciplineFilter)
  }, [matches, disciplineFilter])

  const bestWins = useMemo(
    () => computeBestWins(filteredMatches),
    [filteredMatches],
  )

  const strengthRows = bestWins.byOpponentStrength.slice(0, limit)
  const upsetRows = useMemo(
    () =>
      selectUpsetRowsExcludingStrength(
        bestWins.byOpponentStrength,
        bestWins.byUpset,
        limit,
      ),
    [bestWins.byOpponentStrength, bestWins.byUpset, limit],
  )

  return (
    <article
      id="best-wins"
      className="scroll-mt-6 rounded-2xl card-frame bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-ink-900">Best wins</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <span className="sr-only">How many wins to show per list</span>
            <span aria-hidden>Top</span>
            <select
              value={limit}
              onChange={(e) => setLimit(Number.parseInt(e.target.value, 10))}
              className={FILTER_SELECT_CLASS}
            >
              {LIMIT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {bestWins.ratedWinCount > 10 && (
                <option value={bestWins.ratedWinCount}>All</option>
              )}
            </select>
          </label>
          <label>
            <span className="sr-only">Discipline</span>
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
        </div>
      </div>

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
            title="Biggest upsets"
            rows={upsetRows}
            metricKind="upset"
            info={biggestUpsetsInfo(limit)}
            infoLabel="About Biggest upsets"
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

function BestWinsPanel({ title, rows, metricKind, info, infoLabel }: PanelProps) {
  return (
    <section>
      <SectionHeading size="panel" info={info} infoLabel={infoLabel}>
        <h4 className="text-xs font-medium uppercase tracking-wide text-ink-500">
          {title}
        </h4>
      </SectionHeading>
      <ol className="mt-1.5 space-y-1">
        {rows.map((row, index) => (
          <BestWinRowItem
            key={`${row.match.date}-${row.match.opponents}-${index}`}
            row={row}
            metricKind={metricKind}
          />
        ))}
      </ol>
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
