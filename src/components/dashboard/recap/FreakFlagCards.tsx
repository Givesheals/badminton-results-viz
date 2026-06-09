import type {
  FreakFlag,
  FreakFlagMatchDetail,
} from '../../../lib/tournamentRecap'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  flags: FreakFlag[]
}

function MatchScores({ match }: { match: FreakFlagMatchDetail }) {
  if (match.games && match.games.length > 0) {
    return (
      <p className="mt-1 flex flex-wrap gap-x-1 font-mono text-sm tabular-nums">
        {match.games.map((game, index) => (
          <span key={index}>
            {index > 0 && <span className="text-ink-400">, </span>}
            <span
              className={
                game.highlight === 'lost_single_digit'
                  ? 'font-semibold text-loss-600'
                  : 'text-ink-600'
              }
            >
              {game.player}-{game.opponent}
            </span>
          </span>
        ))}
      </p>
    )
  }

  return (
    <p className="mt-1 font-mono text-sm tabular-nums text-ink-600">
      {match.scoreSummary}
    </p>
  )
}

function MatchDetailBlock({
  match,
  className = 'mt-3',
}: {
  match: FreakFlagMatchDetail
  className?: string
}) {
  return (
    <div
      className={`rounded-lg card-frame bg-white/70 px-3 py-2.5 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <DisciplineChip code={match.discipline} />
        {match.roundLabel && (
          <span className="text-xs font-medium text-ink-600">{match.roundLabel}</span>
        )}
      </div>
      {match.partnerName && (
        <p className="mt-2 text-sm text-ink-700">
          With <span className="font-medium text-ink-900">{match.partnerName}</span>
        </p>
      )}
      <p className="mt-1 text-sm text-ink-800">
        vs <span className="font-medium">{match.opponents}</span>
      </p>
      <MatchScores match={match} />
    </div>
  )
}

function FreakFlagCard({ flag }: { flag: FreakFlag }) {
  return (
    <article className="rounded-xl border border-shuttle-400/35 bg-shuttle-400/10 px-4 py-3.5">
      <h4 className="text-base font-semibold text-shuttle-500">{flag.label}</h4>
      {flag.summary && (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{flag.summary}</p>
      )}
      {flag.match && (
        <MatchDetailBlock
          match={flag.match}
          className={flag.summary ? 'mt-3' : 'mt-2'}
        />
      )}
      {flag.matches && flag.matches.length > 0 && (
        <ul className="mt-3 space-y-2">
          {flag.matches.map((match, index) => (
            <li key={`${match.discipline}-${index}`}>
              <MatchDetailBlock match={match} />
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export function FreakFlagCards({ flags }: Props) {
  if (flags.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-ink-900">Curiosities</h4>
      <div className="grid gap-3">
        {flags.map((flag) => (
          <FreakFlagCard key={flag.id} flag={flag} />
        ))}
      </div>
    </div>
  )
}
