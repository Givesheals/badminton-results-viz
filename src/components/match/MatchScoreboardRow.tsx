import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { getMatchGames } from '../../lib/matchScores'
import {
  getOpponentTeamMembers,
  getOurTeamMembers,
  type TeamMember,
} from '../../lib/matchTeams'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'

/** Parent list grid: stacked on phones, three-column scoreboard from `sm` up. */
export const MATCH_SCOREBOARD_GRID =
  'grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(3.25rem,max-content)_minmax(0,1fr)] items-center gap-x-2.5 gap-y-1'

/**
 * Compact parent grid: three-column scoreboard at every width. Use with
 * `variant="columns"` in tight containers (e.g. Draw Scout accordions) where
 * the columns layout is easier to scan than the stacked phone fallback.
 */
export const MATCH_SCOREBOARD_GRID_COMPACT =
  'grid grid-cols-[minmax(0,1fr)_minmax(2.5rem,max-content)_minmax(0,1fr)] items-center gap-x-2 gap-y-1'

type Props = {
  match: NormalizedMatch
  /**
   * `responsive` (default): stacked on phones, columns from `sm` up.
   * `columns`: three-column scoreboard at every width (pair with
   * MATCH_SCOREBOARD_GRID_COMPACT on the parent list).
   */
  variant?: 'responsive' | 'columns'
}

export function MatchScoreboardRow({ match, variant = 'responsive' }: Props) {
  const style = getDisciplineStyle(match.discipline)
  const games = getMatchGames(match)
  const ourTeam = getOurTeamMembers(match)
  const theirTeam = getOpponentTeamMembers(match)
  const alwaysColumns = variant === 'columns'

  return (
    <li
      className={`col-span-full grid items-center rounded-r border-l-4 bg-white ${
        alwaysColumns
          ? 'grid-cols-subgrid py-1.5 pl-1.5 pr-0.5'
          : 'grid-cols-1 py-1.5 pl-2 pr-1 sm:grid-cols-subgrid'
      } ${style.borderClass}`}
    >
      <div className="col-span-full px-0.5">
        <p className="text-sm font-medium leading-snug text-ink-900">{match.competitionName}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <DisciplineChip code={match.discipline} className="w-fit" />
          <p className="text-xs text-ink-500">{formatShortDate(match.date)}</p>
        </div>
      </div>

      {!alwaysColumns && (
        <div className="col-span-full space-y-0.5 px-0.5 sm:hidden">
          <TeamInline members={ourTeam} side="ours" emphasize={match.outcome === 'win'} />
          <p className="text-xs leading-snug text-ink-900">
            <span className="text-ink-500">vs </span>
            <TeamInline
              members={theirTeam}
              side="theirs"
              emphasize={match.outcome === 'loss'}
              as="span"
            />
          </p>
          <OutcomeScoreLine
            outcome={match.outcome}
            games={games}
            scoreSummary={match.scoreSummary}
          />
        </div>
      )}

      <TeamColumn
        members={ourTeam}
        side="ours"
        emphasize={match.outcome === 'win'}
        alwaysVisible={alwaysColumns}
      />
      <MatchScores
        games={games}
        scoreSummary={match.scoreSummary}
        alwaysVisible={alwaysColumns}
      />
      <TeamColumn
        members={theirTeam}
        side="theirs"
        emphasize={match.outcome === 'loss'}
        alwaysVisible={alwaysColumns}
      />
    </li>
  )
}

function TeamInline({
  members,
  side,
  emphasize,
  as: Tag = 'p',
}: {
  members: TeamMember[]
  side: 'ours' | 'theirs'
  emphasize: boolean
  as?: 'p' | 'span'
}) {
  if (members.length === 0) {
    return <Tag className="text-xs text-ink-500">—</Tag>
  }

  return (
    <Tag className="text-xs leading-snug text-ink-900">
      {members.map((member, index) => {
        const isPartner = side === 'ours' && index > 0

        return (
          <span key={`${member.name}-${index}`}>
            <span
              className={`${emphasize ? 'font-semibold' : ''} ${
                isPartner
                  ? 'text-brand-800 underline decoration-brand-200 underline-offset-2'
                  : ''
              }`}
            >
              {member.name}
              {member.rating != null ? (
                <span className="tabular-nums text-ink-500"> ({member.rating})</span>
              ) : null}
            </span>
            {index < members.length - 1 ? ' & ' : ''}
          </span>
        )
      })}
    </Tag>
  )
}

function TeamColumn({
  members,
  side,
  emphasize,
  alwaysVisible = false,
}: {
  members: TeamMember[]
  side: 'ours' | 'theirs'
  emphasize: boolean
  alwaysVisible?: boolean
}) {
  const visibility = alwaysVisible ? 'block' : 'hidden sm:block'

  if (members.length === 0) {
    return (
      <p
        className={`${visibility} text-xs text-ink-500 ${
          side === 'ours' ? 'text-right' : 'text-left'
        }`}
      >
        —
      </p>
    )
  }

  return (
    <div
      className={`${visibility} min-w-0 text-xs leading-snug text-ink-900 ${
        side === 'ours' ? 'text-right' : 'text-left'
      }`}
    >
      {members.map((member, index) => {
        const isPartner = side === 'ours' && index > 0

        return (
          <p
            key={`${member.name}-${index}`}
            className={`leading-snug ${emphasize ? 'font-semibold' : ''} ${
              isPartner
                ? 'text-brand-800 underline decoration-brand-200 underline-offset-2'
                : ''
            }`}
          >
            {member.name}
            {member.rating != null ? (
              <span className="tabular-nums text-ink-500"> ({member.rating})</span>
            ) : null}
            {index < members.length - 1 ? ' &' : ''}
          </p>
        )
      })}
    </div>
  )
}

function MatchScores({
  games,
  scoreSummary,
  alwaysVisible = false,
}: {
  games: ReturnType<typeof getMatchGames>
  scoreSummary: string
  alwaysVisible?: boolean
}) {
  const visibility = alwaysVisible ? 'block min-w-[2.5rem]' : 'hidden min-w-[3.25rem] sm:block'

  if (games.length === 0) {
    return (
      <p className={`${visibility} shrink-0 whitespace-nowrap text-center text-xs text-ink-500`}>
        {scoreSummary || '—'}
      </p>
    )
  }

  return (
    <div
      className={`${visibility} shrink-0 whitespace-nowrap text-center text-xs tabular-nums text-ink-800`}
    >
      {games.map((game) => (
        <p key={game.game}>
          <ScoreSpan value={game.player} won={game.player > game.opponent} />
          <span className="text-ink-400"> - </span>
          <ScoreSpan value={game.opponent} won={game.opponent > game.player} />
        </p>
      ))}
    </div>
  )
}

function OutcomeScoreLine({
  outcome,
  games,
  scoreSummary,
}: {
  outcome: NormalizedMatch['outcome']
  games: ReturnType<typeof getMatchGames>
  scoreSummary: string
}) {
  const outcomeLabel =
    outcome === 'win' ? 'Win' : outcome === 'loss' ? 'Loss' : null

  return (
    <p className="text-xs text-ink-500">
      {outcomeLabel != null && (
        <span
          className={
            outcome === 'win'
              ? 'font-medium text-gain-700'
              : 'font-medium text-loss-700'
          }
        >
          {outcomeLabel}
          {games.length > 0 || scoreSummary ? ' · ' : ''}
        </span>
      )}
      {games.length > 0 ? (
        <span className="tabular-nums text-ink-800">
          {games.map((game, index) => (
            <span key={game.game}>
              {index > 0 ? ', ' : null}
              <ScoreSpan value={game.player} won={game.player > game.opponent} />
              <span className="text-ink-400">-</span>
              <ScoreSpan value={game.opponent} won={game.opponent > game.player} />
            </span>
          ))}
        </span>
      ) : (
        <span className="tabular-nums text-ink-800">{scoreSummary || '—'}</span>
      )}
    </p>
  )
}

function ScoreSpan({ value, won }: { value: number; won: boolean }) {
  return <span className={won ? 'font-bold' : ''}>{value}</span>
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
