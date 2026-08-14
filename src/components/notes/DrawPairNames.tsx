import type { DrawPlayer } from '../../lib/drawTypes'

/**
 * BadmInfo player-profile link: name and rating are one purple underline;
 * the ampersand and seed stay ink and are not part of the link.
 */
export const DRAW_PLAYER_PROFILE_LINK_CLASS =
  'font-normal text-brand-600 underline decoration-current decoration-1 underline-offset-auto transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 rounded-sm'

export function DrawPlayerNameLink({
  player,
  className = DRAW_PLAYER_PROFILE_LINK_CLASS,
}: {
  player: Pick<DrawPlayer, 'name' | 'url' | 'rating'>
  className?: string
}) {
  const content = (
    <>
      {player.name}
      {player.rating != null ? (
        <span className="tabular-nums"> ({player.rating})</span>
      ) : null}
    </>
  )

  if (player.url === '') {
    return <span>{content}</span>
  }

  return (
    <a href={player.url} className={className}>
      {content}
    </a>
  )
}

function PlayerNameLine({
  player,
  showAmpersand,
}: {
  player: DrawPlayer
  showAmpersand: boolean
}) {
  return (
    <>
      {player.seedLabel != null && (
        <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
      )}
      <DrawPlayerNameLink player={player} />
      {showAmpersand ? <span className="text-ink-400"> &</span> : null}
    </>
  )
}

/**
 * Opponent names for draw companion cards.
 * Doubles/mixed: always stack partners (break after &) so every card shares
 * the same name-block height — short pairs must not collapse to one line.
 * Name + rating is the profile link; seeds and & are not.
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
            <PlayerNameLine player={player} showAmpersand={index < players.length - 1} />
          </div>
        ))}
      </div>
    )
  }

  const player = players[0]!
  return (
    <p className={className}>
      <PlayerNameLine player={player} showAmpersand={false} />
    </p>
  )
}
