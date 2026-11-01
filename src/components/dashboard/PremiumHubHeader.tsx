import { useMemo } from 'react'
import { findBePlayersByName } from '../../data/bePlayerDirectory'
import { usePremium } from '../../context/PremiumContext'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'

type Props = {
  playerName: string
}

/** Font Awesome flask. Decorative mark for the Player Lab label. */
function PlayerLabBeaker({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 448 512" className={className} aria-hidden>
      <path
        fill="currentColor"
        d="M288 0L160 0 128 0C110.3 0 96 14.3 96 32s14.3 32 32 32l0 132.8c0 11.8-3.3 23.5-9.5 33.5L10.3 406.2C3.6 417.2 0 429.7 0 442.6C0 480.9 31.1 512 69.4 512l309.2 0c38.3 0 69.4-31.1 69.4-69.4c0-12.8-3.6-25.4-10.3-36.4L329.5 230.4c-6.2-10.1-9.5-21.7-9.5-33.5L320 64c17.7 0 32-14.3 32-32s-14.3-32-32-32L288 0zM192 196.8L192 64l64 0 0 132.8c0 23.7 6.6 46.9 19 67.1L309.5 320l-171 0L173 263.9c12.4-20.2 19-43.4 19-67.1z"
      />
    </svg>
  )
}

export function PremiumHubHeader({ playerName }: Props) {
  const { premium } = usePremium()

  const directoryMatch = useMemo(() => {
    const matches = findBePlayersByName(playerName)
    if (matches.length === 1) return matches[0]
    if (premium?.beNumber) {
      return matches.find((player) => player.beNumber === premium.beNumber) ?? null
    }
    return matches[0] ?? null
  }, [playerName, premium?.beNumber])

  const beNumber = premium?.beNumber || directoryMatch?.beNumber || null
  const club = directoryMatch?.club ?? null
  const title = playerName.trim() || 'Player Lab'
  const profileHref = `https://www.badminfo.com/player?name=${encodeURIComponent(playerName)}`

  return (
    <section id="dashboard-results-header" className="scroll-mt-20">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-900">
        <PlayerLabBeaker className="h-4 w-4 shrink-0" />
        Player Lab
      </p>
      <h1 className="mt-1 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">{title}</h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-600">
        {beNumber ? <span>BE {beNumber}</span> : null}
        {beNumber && club ? (
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
        ) : null}
        {club ? <span>{club}</span> : null}
        {beNumber || club ? (
          <span className="text-ink-300" aria-hidden>
            ·
          </span>
        ) : null}
        <a
          href={profileHref}
          className={DRAW_PLAYER_PROFILE_LINK_CLASS}
          target="_blank"
          rel="noreferrer"
        >
          Profile & Results
        </a>
      </p>
      <p className="mt-2 text-sm text-ink-600">
        Tournament recaps, notes, the people behind your results, and stats on your own play - all in one place.
      </p>
    </section>
  )
}
