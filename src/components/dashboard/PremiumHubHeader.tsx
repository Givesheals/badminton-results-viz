import { useMemo } from 'react'
import { findBePlayersByName } from '../../data/bePlayerDirectory'
import { usePremium } from '../../context/PremiumContext'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'
import { BetaBadge } from '../ui/BetaBadge'

type Props = {
  playerName: string
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
    <section
      id="dashboard-results-header"
      className="scroll-mt-4 rounded-t-2xl bg-[#f2f0f6] px-4 pt-4"
    >
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Player Lab
        <BetaBadge />
      </p>
      <h1 className="mt-1.5 text-[26px] font-bold leading-tight tracking-tight text-[#343a40]">
        {title}
      </h1>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-none text-ink-600">
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
      <p className="mt-2 text-sm leading-snug text-ink-600">
        Your tournament results, opponent notes and partner stats - all in one place.
      </p>
    </section>
  )
}
