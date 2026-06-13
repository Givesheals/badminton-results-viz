import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { getMatchGames } from '../../lib/matchScores'
import {
  getOpponentTeamMembers,
  getOurTeamMembers,
  type TeamMember,
} from '../../lib/matchTeams'
import type { NormalizedMatch } from '../../types/matchHistory'
import { DisciplineChip } from '../discipline/DisciplineChip'

type Props = {
  match: NormalizedMatch
}

export function MatchScoreboardRow({ match }: Props) {
  const style = getDisciplineStyle(match.discipline)
  const games = getMatchGames(match)
  const ourTeam = getOurTeamMembers(match)
  const theirTeam = getOpponentTeamMembers(match)

  return (
    <li
      className={`col-span-full grid grid-cols-subgrid items-center rounded-r border-l-4 py-1.5 pl-2 pr-1 ${style.borderClass} bg-white`}
    >
      <div className="col-span-full min-w-0 px-0.5">
        <p
          className="truncate text-sm font-medium text-ink-900"
          title={match.competitionName}
        >
          {match.competitionName}
        </p>
        <p className="text-xs text-ink-500">{formatShortDate(match.date)}</p>
      </div>

      <DisciplineChip code={match.discipline} className="w-fit justify-self-start self-center" />
      <TeamColumn members={ourTeam} side="ours" />
      <MatchScores games={games} scoreSummary={match.scoreSummary} />
      <TeamColumn members={theirTeam} side="theirs" />
    </li>
  )
}

function TeamColumn({
  members,
  side,
}: {
  members: TeamMember[]
  side: 'ours' | 'theirs'
}) {
  if (members.length === 0) {
    return (
      <p className={`text-xs text-ink-500 ${side === 'ours' ? 'text-right' : 'text-left'}`}>
        —
      </p>
    )
  }

  return (
    <div
      className={`min-w-0 text-xs leading-snug text-ink-900 ${
        side === 'ours' ? 'text-right' : 'text-left'
      }`}
    >
      {members.map((member, index) => {
        const isPartner = side === 'ours' && index > 0

        return (
          <p
            key={`${member.name}-${index}`}
            className={`truncate ${
              isPartner
                ? 'text-brand-800 underline decoration-brand-200 underline-offset-2'
                : side === 'theirs'
                  ? 'font-semibold'
                  : ''
            }`}
            title={member.name}
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
}: {
  games: ReturnType<typeof getMatchGames>
  scoreSummary: string
}) {
  if (games.length === 0) {
    return (
      <p className="text-center text-xs text-ink-500">
        {scoreSummary || '—'}
      </p>
    )
  }

  return (
    <div className="text-center text-xs tabular-nums text-ink-800">
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
