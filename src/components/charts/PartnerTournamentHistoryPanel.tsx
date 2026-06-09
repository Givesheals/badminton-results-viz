import { useMemo, useState } from 'react'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { getMatchGames } from '../../lib/matchScores'
import {
  buildPartnerTournamentHistory,
  countPartnerTournamentEvents,
  DEFAULT_EXPANDED_MIN_STAGE_RANK,
  INITIAL_TOURNAMENTS_PER_STAGE,
  type PartnerTournamentEvent,
  type PartnerTournamentMatchRow,
  type PartnerTournamentStageGroup,
} from '../../lib/partnerTournamentHistory'
import {
  isLightGroupProgressionStage,
  PROGRESSION_STAGE_COLORS,
  STAGE_RANK,
} from '../../lib/tournamentProgression'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'

type Props = {
  matches: NormalizedMatch[]
  partnerName: string
  family: DisciplineFamily
  disciplineCode: string
}

export function PartnerTournamentHistoryPanel({
  matches,
  partnerName,
  family,
  disciplineCode,
}: Props) {
  return (
    <PartnerTournamentHistoryPanelBody
      key={partnerName}
      matches={matches}
      partnerName={partnerName}
      family={family}
      disciplineCode={disciplineCode}
    />
  )
}

function PartnerTournamentHistoryPanelBody({
  matches,
  partnerName,
  family,
  disciplineCode,
}: Props) {
  const [open, setOpen] = useState(false)

  const groups = useMemo(
    () => buildPartnerTournamentHistory(matches, partnerName, family),
    [matches, partnerName, family],
  )
  const eventCount = countPartnerTournamentEvents(groups)

  if (eventCount === 0) {
    return (
      <p className="text-sm text-ink-600">
        No tournament progression events with {partnerName} in this selection.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/80 px-3 py-2 text-sm font-medium text-brand-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={open}
      >
        {open ? 'Hide tournament history' : `Explore ${eventCount} tournaments together`}
        <ChevronIcon open={open} />
      </button>

      {open ? (
        <div className="space-y-2 rounded-xl card-frame bg-white/80 p-3 shadow-inner">
          <p className="text-xs text-ink-500">
            Grouped by how far you went together — deepest finishes first. Within each stage,
            newest events appear first.
          </p>
          {groups.map((group) => (
            <StageGroupSection
              key={group.stage}
              group={group}
              disciplineCode={disciplineCode}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function StageGroupSection({
  group,
  disciplineCode,
}: {
  group: PartnerTournamentStageGroup
  disciplineCode: string
}) {
  const defaultOpen = STAGE_RANK[group.stage] >= DEFAULT_EXPANDED_MIN_STAGE_RANK
  const [expanded, setExpanded] = useState(defaultOpen)
  const [showAll, setShowAll] = useState(false)

  const visibleTournaments = showAll
    ? group.tournaments
    : group.tournaments.slice(0, INITIAL_TOURNAMENTS_PER_STAGE)
  const hiddenCount = group.tournaments.length - visibleTournaments.length
  const stageColor = isLightGroupProgressionStage(group.stage)
    ? 'var(--color-ink-500)'
    : PROGRESSION_STAGE_COLORS[group.stage]

  return (
    <section className="rounded-lg card-frame bg-white">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left"
        aria-expanded={expanded}
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ backgroundColor: stageColor }}
          >
            {group.label}
          </span>
          <span className="truncate text-sm font-medium text-ink-900">
            {group.tournaments.length} event{group.tournaments.length === 1 ? '' : 's'}
          </span>
        </span>
        <ChevronIcon open={expanded} />
      </button>

      {expanded ? (
        <ul className="space-y-2 border-t border-ink-50 px-2 pb-2 pt-2">
          {visibleTournaments.map((event) => (
            <TournamentEventItem
              key={event.key}
              event={event}
              disciplineCode={disciplineCode}
            />
          ))}
          {hiddenCount > 0 && !showAll ? (
            <li>
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="text-sm font-medium text-brand-700 underline decoration-brand-200 underline-offset-2 transition hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              >
                Show {hiddenCount} more in {group.label.toLowerCase()}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </section>
  )
}

function TournamentEventItem({
  event,
  disciplineCode,
}: {
  event: PartnerTournamentEvent
  disciplineCode: string
}) {
  const [matchesOpen, setMatchesOpen] = useState(false)
  const style = getDisciplineStyle(disciplineCode)

  return (
    <li className="rounded-lg card-frame">
      <button
        type="button"
        onClick={() => setMatchesOpen((value) => !value)}
        className="flex w-full items-start justify-between gap-2 px-3 py-2 text-left transition hover:bg-brand-50/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={matchesOpen}
      >
        <div className="min-w-0">
          <p className="font-medium text-brand-800 underline decoration-brand-200 underline-offset-2">
            {event.competitionName}
          </p>
          <p className="text-xs text-ink-500">{formatShortDate(event.sortDate)}</p>
        </div>
        <span className="shrink-0 text-xs text-ink-500">
          {event.matches.length} match{event.matches.length === 1 ? '' : 'es'}
        </span>
      </button>
      {matchesOpen ? (
        <ul className={`space-y-1 border-t border-ink-50 px-1 py-1 ${style.rowBgClass}`}>
          {event.matches.map((row, index) => (
            <PartnerHistoryMatchRow
              key={`${row.match.date}-${row.match.opponents}-${index}`}
              row={row}
              disciplineCode={disciplineCode}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function PartnerHistoryMatchRow({
  row,
  disciplineCode,
}: {
  row: PartnerTournamentMatchRow
  disciplineCode: string
}) {
  const style = getDisciplineStyle(disciplineCode)
  const games = getMatchGames(row.match)
  const outcomeLabel =
    row.match.outcome === 'win' ? 'Win' : row.match.outcome === 'loss' ? 'Loss' : null

  return (
    <li
      className={`grid grid-cols-[auto_1fr_auto] gap-x-2 gap-y-0.5 rounded-r border-l-4 py-1.5 pl-2 pr-1 ${style.borderClass} ${style.rowBgClass}`}
    >
      <DisciplineChip code={disciplineCode} className="row-span-2 self-center" />
      <div className="min-w-0">
        {row.stageLabel ? (
          <p className="text-[10px] italic text-ink-500">{row.stageLabel}</p>
        ) : null}
        <p className="truncate text-sm font-medium text-ink-900" title={row.match.opponents}>
          vs {row.match.opponents}
        </p>
        <p className="text-xs text-ink-500">
          {outcomeLabel != null && (
            <span
              className={
                row.match.outcome === 'win'
                  ? 'font-medium text-gain-700'
                  : 'font-medium text-loss-700'
              }
            >
              {outcomeLabel}
              {row.match.scoreSummary ? ' · ' : ''}
            </span>
          )}
          {row.match.scoreSummary || (games.length === 0 ? '—' : null)}
        </p>
      </div>
      {games.length > 0 ? (
        <div className="self-center text-right text-xs tabular-nums text-ink-800">
          {games.map((game) => (
            <p key={game.game}>
              <ScoreSpan value={game.player} won={game.player > game.opponent} />
              <span className="text-ink-400">-</span>
              <ScoreSpan value={game.opponent} won={game.opponent > game.player} />
            </p>
          ))}
        </div>
      ) : (
        <p className="self-center text-xs text-ink-500">{row.match.scoreSummary}</p>
      )}
    </li>
  )
}

function ScoreSpan({ value, won }: { value: number; won: boolean }) {
  return <span className={won ? 'font-bold' : ''}>{value}</span>
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 shrink-0 text-brand-600 transition ${open ? 'rotate-180' : ''}`}
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

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
