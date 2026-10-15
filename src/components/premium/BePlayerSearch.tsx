import { useEffect, useMemo, useState } from 'react'
import type { BePlayerRecord } from '../../data/bePlayerDirectory'
import { searchBePlayers } from '../../data/bePlayerDirectory'
import {
  prototypeDisciplineRatings,
  ratingChipBandForRating,
  U19_RATING_DISCIPLINES,
} from '../../lib/opponentNoteIdentity'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'
import { RatingChip } from '../notes/OpponentRatingChips'
import { CountyAffiliationChip } from '../tournament/CountyAffiliationChip'

type Props = {
  defaultQuery?: string
  /** B number already saved on the account, when there is one. */
  currentBeNumber?: string | null
  selected: BePlayerRecord | null
  onSelect: (player: BePlayerRecord) => void
  onClear: () => void
  error?: string | null
}

const COUNTY_BADGE_SHORT_NAMES: Record<string, string> = {
  bedfordshire: 'Beds',
  berkshire: 'Berks',
  buckinghamshire: 'Bucks',
  cambridgeshire: 'Cambs',
  cheshire: 'Cheshire',
  cornwall: 'Cornwall',
  cumbria: 'Cumbria',
  derbyshire: 'Derbys',
  devon: 'Devon',
  dorset: 'Dorset',
  durham: 'Durham',
  'east sussex': 'E Sussex',
  'east yorkshire': 'E Yorks',
  essex: 'Essex',
  gloucestershire: 'Glos',
  'greater london': 'London',
  hampshire: 'Hants',
  herefordshire: 'Herefords',
  hertfordshire: 'Herts',
  'isle of wight': 'IOW',
  kent: 'Kent',
  lancashire: 'Lancs',
  leicestershire: 'Leics',
  lincolnshire: 'Lincs',
  london: 'London',
  middlesex: 'Middx',
  norfolk: 'Norfolk',
  northamptonshire: 'Northants',
  northumberland: 'Northumb',
  'north yorkshire': 'N Yorks',
  nottinghamshire: 'Notts',
  oxfordshire: 'Oxon',
  rutland: 'Rutland',
  shropshire: 'Shrops',
  somerset: 'Somerset',
  'south yorkshire': 'S Yorks',
  staffordshire: 'Staffs',
  suffolk: 'Suffolk',
  surrey: 'Surrey',
  sussex: 'Sussex',
  warwickshire: 'Warks',
  'west midlands': 'W Mids',
  'west sussex': 'W Sussex',
  'west yorkshire': 'W Yorks',
  wiltshire: 'Wilts',
  worcestershire: 'Worcs',
  yorkshire: 'Yorks',
}

function countyBadgeShortName(county: string): string | null {
  const trimmed = county.trim()
  if (!trimmed) return null
  return COUNTY_BADGE_SHORT_NAMES[trimmed.toLowerCase()] ?? trimmed
}

function PlayerResultCard({
  player,
  selected,
  isCurrent,
  onSelect,
}: {
  player: BePlayerRecord
  selected: boolean
  isCurrent: boolean
  onSelect: (player: BePlayerRecord) => void
}) {
  const shortName = countyBadgeShortName(player.county)
  const ratings = prototypeDisciplineRatings(`${player.name}|${player.beNumber}`)
  const profileHref = `https://www.badminfo.com/player?name=${encodeURIComponent(player.name)}`

  return (
    <li>
      <div
        className={`relative rounded-xl border-2 transition ${
          selected
            ? 'border-brand-500 bg-brand-50'
            : isCurrent
              ? 'border-brand-300 bg-brand-50'
              : 'border-ink-100 bg-white hover:border-brand-300'
        }`}
      >
        <button
          type="button"
          role="option"
          aria-selected={selected}
          onClick={() => onSelect(player)}
          className="w-full px-3 py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
        >
          <span className="block truncate pr-16 text-sm font-medium text-ink-900">{player.name}</span>
          <span className="mt-1 grid grid-cols-[6.5rem_minmax(0,1fr)_4.75rem] items-center gap-x-2">
            <span className="text-sm text-ink-600">BE {player.beNumber}</span>
            <span className="inline-flex items-center gap-1" aria-label="Ratings">
              {U19_RATING_DISCIPLINES.map((discipline, index) => (
                <RatingChip
                  key={discipline}
                  value={ratings[index]}
                  band={ratingChipBandForRating(ratings[index]!)}
                  size="compact"
                />
              ))}
            </span>
            <span className="justify-self-end">
              {shortName ? (
                <CountyAffiliationChip shortName={shortName} program="senior-county" />
              ) : null}
            </span>
          </span>
          {isCurrent ? (
            <span className="mt-1.5 block text-xs text-brand-700">
              This is the player whose B number you currently have set.
            </span>
          ) : null}
        </button>
        <a
          href={profileHref}
          target="_blank"
          rel="noreferrer"
          className={`absolute right-3 top-2 text-sm ${DRAW_PLAYER_PROFILE_LINK_CLASS}`}
        >
          Profile
        </a>
      </div>
    </li>
  )
}

export function BePlayerSearch({
  defaultQuery = '',
  currentBeNumber = null,
  selected,
  onSelect,
  onClear,
  error,
}: Props) {
  const [query, setQuery] = useState(selected?.name || defaultQuery)
  const results = useMemo(() => {
    const found = searchBePlayers(query)
    if (!currentBeNumber) return found
    return [...found].sort((a, b) => {
      if (a.beNumber === currentBeNumber) return -1
      if (b.beNumber === currentBeNumber) return 1
      return 0
    })
  }, [currentBeNumber, query])

  useEffect(() => {
    if (!selected) return
    const stillVisible = results.some((player) => player.beNumber === selected.beNumber)
    if (!stillVisible) onClear()
  }, [onClear, results, selected])

  const showResults = query.trim().length >= 2

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="w-full shrink-0 rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
        placeholder="Search by name"
        aria-label="Search by name"
        autoComplete="off"
        autoFocus
      />

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {showResults && results.length === 0 && (
          <p className="text-sm text-ink-600">No players found.</p>
        )}

        {showResults && results.length > 0 && (
          <ul className="space-y-1.5" role="listbox" aria-label="Matching players">
            {results.map((player) => (
              <PlayerResultCard
                key={player.beNumber}
                player={player}
                selected={selected?.beNumber === player.beNumber}
                isCurrent={player.beNumber === currentBeNumber}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-2 shrink-0 text-sm text-loss-600">{error}</p>}
    </div>
  )
}
