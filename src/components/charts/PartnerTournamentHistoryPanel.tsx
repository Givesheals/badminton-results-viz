import { useId, useMemo, useState } from 'react'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { getOpponentTeamMembers } from '../../lib/matchTeams'
import {
  buildPartnerTournamentHistory,
  countPartnerTournamentEvents,
  INITIAL_TOURNAMENTS_PER_STAGE,
  partnerHistoryAutoExpandLevel,
  type PartnerTournamentEvent,
  type PartnerTournamentMatchRow,
  type PartnerTournamentStageGroup,
} from '../../lib/partnerTournamentHistory'
import { formatStageChip } from '../../lib/partnerAchievements'
import {
  PROGRESSION_PARTNER_CHIP_COLORS,
  PROGRESSION_STAGE_COLORS,
} from '../../lib/tournamentProgression'
import type { NormalizedMatch } from '../../types/matchHistory'
import { AccordionChevron } from '../ui/AccordionChevron'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'

type Props = {
  matches: NormalizedMatch[]
  partnerName: string
  family: DisciplineFamily
  disciplineCode: string
  showMatches?: boolean
}

export function PartnerTournamentHistoryPanel({
  matches,
  partnerName,
  family,
  disciplineCode,
  showMatches = true,
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
    <div className="space-y-4 bg-ink-50/30 px-3 py-3">
      {groups.map((group) => (
        <StageGroupSection
          key={group.stage}
          group={group}
          disciplineCode={disciplineCode}
          defaultTournamentsExpanded={showMatches && autoExpand === 'full'}
          showMatches={showMatches}
        />
      ))}
    </div>
  )
}

/**
 * One finish-depth group (e.g. "4× Winner"). Always open: a quiet section header
 * (colour dot, same chip wording as the partner card, hairline rule) above a single
 * bordered list of tournaments.
 */
function StageGroupSection({
  group,
  disciplineCode,
  defaultTournamentsExpanded = false,
  showMatches = true,
}: {
  group: PartnerTournamentStageGroup
  disciplineCode: string
  defaultTournamentsExpanded?: boolean
  showMatches?: boolean
}) {
  const [showAll, setShowAll] = useState(false)
  const headingId = useId()

  const visibleTournaments = showAll
    ? group.tournaments
    : group.tournaments.slice(0, INITIAL_TOURNAMENTS_PER_STAGE)
  const hiddenCount = group.tournaments.length - visibleTournaments.length
  const stageColor =
    PROGRESSION_PARTNER_CHIP_COLORS[group.stage] ?? PROGRESSION_STAGE_COLORS[group.stage]

  return (
    <section aria-labelledby={headingId}>
      <h5
        id={headingId}
        className="mb-1.5 flex items-center gap-2 px-0.5 text-xs font-semibold text-ink-700"
      >
        <span
          aria-hidden
          className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-inset ring-black/10"
          style={{ backgroundColor: stageColor }}
        />
        <span className="whitespace-nowrap">
          {formatStageChip(group.stage, group.tournaments.length)}
        </span>
        <span aria-hidden className="h-px min-w-4 flex-1 bg-ink-200" />
      </h5>

      <ul className="divide-y divide-ink-100 overflow-hidden rounded-lg card-frame bg-white">
        {visibleTournaments.map((event) => (
          <TournamentEventItem
            key={event.key}
            event={event}
            disciplineCode={disciplineCode}
            defaultExpanded={defaultTournamentsExpanded}
            showMatches={showMatches}
          />
        ))}
        {hiddenCount > 0 && !showAll ? (
          <li className="px-3 py-2">
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
    </section>
  )
}

function TournamentEventItem({
  event,
  disciplineCode,
  defaultExpanded = false,
  showMatches = true,
}: {
  event: PartnerTournamentEvent
  disciplineCode: string
  defaultExpanded?: boolean
  showMatches?: boolean
}) {
  const [matchesOpen, setMatchesOpen] = useState(defaultExpanded)
  const header = (
    <>
      <div className="min-w-0 flex-1">
        <p className="min-w-0 font-medium text-ink-900">{event.competitionName}</p>
        <p className="text-xs text-ink-500">
          {event.matches.length} match{event.matches.length === 1 ? '' : 'es'}
          <span className="text-ink-400"> · </span>
          {formatShortDate(event.sortDate)}
        </p>
      </div>
      {showMatches ? <AccordionChevron open={matchesOpen} className="h-5 w-5" /> : null}
    </>
  )

  return (
    <li>
      {showMatches ? (
        <button
          type="button"
          onClick={() => setMatchesOpen((value) => !value)}
          className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-brand-50/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
          aria-expanded={matchesOpen}
        >
          {header}
        </button>
      ) : (
        <div className="flex w-full items-center gap-2 px-3 py-2 text-left">{header}</div>
      )}
      {showMatches && matchesOpen ? (
        <ul className="space-y-1 border-t border-ink-100 bg-ink-50/40 px-1.5 py-1.5">
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
        vs <OpponentProfileNames match={row.match} />
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

function OpponentProfileNames({ match }: { match: NormalizedMatch }) {
  const members = getOpponentTeamMembers(match)
  const names = members.length > 0 ? members.map((member) => member.name) : [match.opponents]

  return (
    <>
      {names.map((name, index) => (
        <span key={`${name}-${index}`}>
          {index > 0 ? <span className="font-medium text-ink-400"> & </span> : null}
          <a
            href="#"
            className={DRAW_PLAYER_PROFILE_LINK_CLASS}
            onClick={(event) => {
              event.preventDefault()
            }}
          >
            {name}
          </a>
        </span>
      ))}
    </>
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
