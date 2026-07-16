import { useMemo, useState } from 'react'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import {
  buildPartnerTournamentHistory,
  countPartnerTournamentEvents,
  INITIAL_TOURNAMENTS_PER_STAGE,
  partnerHistoryAutoExpandLevel,
  type PartnerTournamentEvent,
  type PartnerTournamentMatchRow,
  type PartnerTournamentStageGroup,
} from '../../lib/partnerTournamentHistory'
import {
  isLightGroupProgressionStage,
  PROGRESSION_PARTNER_CHIP_COLORS,
  PROGRESSION_STAGE_COLORS,
} from '../../lib/tournamentProgression'
import type { NormalizedMatch } from '../../types/matchHistory'
import { AccordionChevron } from '../ui/AccordionChevron'

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
  const groups = useMemo(
    () => buildPartnerTournamentHistory(matches, partnerName, family),
    [matches, partnerName, family],
  )
  const eventCount = countPartnerTournamentEvents(groups)
  const autoExpand = partnerHistoryAutoExpandLevel(groups)

  if (eventCount === 0) {
    return (
      <div className="px-4 py-3">
        <p className="text-sm text-ink-600">
          No tournament progression events with {partnerName} in this selection.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2 bg-ink-50/30 px-3 py-3">
      {groups.map((group) => (
        <StageGroupSection
          key={group.stage}
          group={group}
          disciplineCode={disciplineCode}
          defaultExpanded={autoExpand !== 'none'}
          defaultTournamentsExpanded={autoExpand === 'full'}
        />
      ))}
    </div>
  )
}

function StageGroupSection({
  group,
  disciplineCode,
  defaultExpanded = false,
  defaultTournamentsExpanded = false,
}: {
  group: PartnerTournamentStageGroup
  disciplineCode: string
  defaultExpanded?: boolean
  defaultTournamentsExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  const visibleTournaments = showAll
    ? group.tournaments
    : group.tournaments.slice(0, INITIAL_TOURNAMENTS_PER_STAGE)
  const hiddenCount = group.tournaments.length - visibleTournaments.length
  const lightGroup = isLightGroupProgressionStage(group.stage)
  const stageColor =
    PROGRESSION_PARTNER_CHIP_COLORS[group.stage] ?? PROGRESSION_STAGE_COLORS[group.stage]

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
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs ${
              lightGroup ? 'font-medium text-black' : 'font-semibold text-white'
            }`}
            style={{ backgroundColor: stageColor }}
          >
            {group.label}
          </span>
          <span className="truncate text-sm font-medium text-ink-900">
            {group.tournaments.length} event{group.tournaments.length === 1 ? '' : 's'}
          </span>
        </span>
        <AccordionChevron open={expanded} />
      </button>

      {expanded ? (
        <ul className="space-y-2 border-t border-ink-50 px-2 pb-2 pt-2">
          {visibleTournaments.map((event) => (
            <TournamentEventItem
              key={event.key}
              event={event}
              disciplineCode={disciplineCode}
              defaultExpanded={defaultTournamentsExpanded}
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
  defaultExpanded = false,
}: {
  event: PartnerTournamentEvent
  disciplineCode: string
  defaultExpanded?: boolean
}) {
  const [matchesOpen, setMatchesOpen] = useState(defaultExpanded)

  return (
    <li className="rounded-lg card-frame">
      <button
        type="button"
        onClick={() => setMatchesOpen((value) => !value)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-brand-50/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={matchesOpen}
      >
        <div className="min-w-0 flex-1">
          <p className="min-w-0 font-medium text-ink-900">{event.competitionName}</p>
          <p className="text-xs text-ink-500">
            {event.matches.length} match{event.matches.length === 1 ? '' : 'es'}
            <span className="text-ink-400"> · </span>
            {formatShortDate(event.sortDate)}
          </p>
        </div>
        <AccordionChevron open={matchesOpen} className="h-5 w-5" />
      </button>
      {matchesOpen ? (
        <ul className="space-y-1 border-t border-ink-50 px-1 py-1">
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
  const outcomeLabel =
    row.match.outcome === 'win' ? 'Win' : row.match.outcome === 'loss' ? 'Loss' : null

  return (
    <li className={`rounded-md px-2 py-1.5 ${style.rowBgClass}`}>
      {row.stageLabel ? (
        <p className="text-[10px] italic text-ink-500">{row.stageLabel}</p>
      ) : null}
      <p className="text-sm font-medium leading-snug text-ink-900">
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
        {row.match.scoreSummary || '—'}
      </p>
    </li>
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
