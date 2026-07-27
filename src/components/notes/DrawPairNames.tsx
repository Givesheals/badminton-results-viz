import type { DrawPlayer } from '../../lib/drawTypes'

/**
 * Opponent names for draw companion cards.
 * Doubles/mixed: always stack partners (break after &) so every card shares
 * the same name-block height — short pairs must not collapse to one line.
 */
export function DrawPairNames({
  players,
  className = 'min-w-0 text-sm leading-snug text-ink-900',
}: {
  players: DrawPlayer[]
  className?: string
}) {
  if (players.length === 0) return null

  if (players.length >= 2) {
    return (
      <div className={className}>
        {players.map((player, index) => (
          <div key={player.name} className="whitespace-nowrap">
            {player.seedLabel != null && (
              <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
            )}
            {player.name}
            {player.rating != null ? (
              <span className="tabular-nums text-ink-500"> ({player.rating})</span>
            ) : null}
            {index < players.length - 1 ? <span className="text-ink-400"> &</span> : null}
          </div>
        ))}
      </div>
    )
  }

  const player = players[0]!
  return (
    <p className={className}>
      {player.seedLabel != null && (
        <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
      )}
      {player.name}
      {player.rating != null ? (
        <span className="tabular-nums text-ink-500"> ({player.rating})</span>
      ) : null}
    </p>
  )
}
