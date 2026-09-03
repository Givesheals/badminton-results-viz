import { useMemo } from 'react'
import { findBePlayersByName } from '../../data/bePlayerDirectory'
import { usePremium } from '../../context/PremiumContext'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'
import { BetaBadge } from '../ui/BetaBadge'
import { latestRatingsByDisciplineFamily } from '../../lib/ratings'
import type { NormalizedMatch } from '../../types/matchHistory'

type Props = {
  playerName: string
  allMatches: NormalizedMatch[]
}

export function PremiumHubHeader({ playerName, allMatches }: Props) {
  const { premium } = usePremium()
  const ratings = useMemo(
    () => latestRatingsByDisciplineFamily(allMatches),
    [allMatches],
  )
  const ratingItems = [
    { key: 'singles', label: 'Singles', value: ratings.singles },
    { key: 'doubles', label: 'Doubles', value: ratings.doubles },
    { key: 'mixed', label: 'Mixed', value: ratings.mixed },
  ].filter((item) => item.value != null)

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
  const title = playerName.trim() || 'Premium'
  const profileHref = `https://www.badminfo.com/player?name=${encodeURIComponent(playerName)}`

  return (
    <section id="dashboard-results-header" className="scroll-mt-4">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Premium
        <BetaBadge />
      </p>
      <div className="mt-1 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
        {ratingItems.length > 0 ? (
          <div className="flex gap-4 sm:gap-5">
            {ratingItems.map((item) => (
              <div key={item.key} className="min-w-[3.5rem] text-right">
                <p className="text-lg font-semibold tabular-nums leading-none text-ink-900">
                  {item.value}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-ink-500">{item.label}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
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
    </section>
  )
}
