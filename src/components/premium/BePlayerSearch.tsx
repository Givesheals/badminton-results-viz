import { useEffect, useId, useMemo, useState } from 'react'
import {
  findBePlayerByNumber,
  searchBePlayers,
  type BePlayerRecord,
} from '../../data/bePlayerDirectory'
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
  onSelect,
  label,
}: {
  player: BePlayerRecord
  selected: boolean
  onSelect: (player: BePlayerRecord) => void
  /** Shown above the name, for the account's current BE Number. */
  label?: string
}) {
  const shortName = countyBadgeShortName(player.county)
  const ratings = prototypeDisciplineRatings(`${player.name}|${player.beNumber}`)
  const profileHref = `https://www.badminfo.com/player?name=${encodeURIComponent(player.name)}`
  const radioId = useId()

  return (
    <div
      className={`rounded-xl border-2 transition ${
        selected
          ? 'border-brand-500 bg-brand-50'
          : 'border-ink-100 bg-white hover:border-brand-300'
      }`}
    >
      <div className="flex items-center gap-3 px-3 py-2">
        <label htmlFor={radioId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
          <input
            id={radioId}
            type="radio"
            name="premium-player"
            checked={selected}
            onChange={() => {
              if (!selected) onSelect(player)
            }}
            onClick={(event) => {
              if (!selected) return
              event.preventDefault()
              onSelect(player)
            }}
            className="shrink-0 accent-brand-600"
          />
          <span className="min-w-0">
            {label ? (
              <span className="mb-1 block text-xs font-medium text-ink-500">{label}</span>
            ) : null}
            <span className="block truncate text-sm font-medium text-ink-900">{player.name}</span>
            <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
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
              {shortName ? (
                <CountyAffiliationChip shortName={shortName} program="senior-county" />
              ) : null}
            </span>
          </span>
        </label>
        <a
          href={profileHref}
          target="_blank"
          rel="noreferrer"
          className={`shrink-0 self-center text-sm ${DRAW_PLAYER_PROFILE_LINK_CLASS}`}
        >
          Profile
        </a>
      </div>
    </div>
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
  const [query, setQuery] = useState(defaultQuery)
  const currentPlayer = currentBeNumber ? (findBePlayerByNumber(currentBeNumber) ?? null) : null
  const results = useMemo(() => {
    return searchBePlayers(query).filter((player) => player.beNumber !== currentPlayer?.beNumber)
  }, [currentPlayer?.beNumber, query])

  useEffect(() => {
    if (!selected) return
    const isCurrentCard = selected.beNumber === currentPlayer?.beNumber
    const stillVisible = results.some((player) => player.beNumber === selected.beNumber)
    if (!stillVisible && !isCurrentCard) onClear()
  }, [currentPlayer?.beNumber, onClear, results, selected])

  const showResults = query.trim().length >= 2

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {currentPlayer ? (
        <PlayerResultCard
          player={currentPlayer}
          selected={selected?.beNumber === currentPlayer.beNumber}
          onSelect={onSelect}
          label="Your current BE Number"
        />
      ) : null}

      <label className={`block shrink-0 text-sm font-medium text-ink-900 ${currentPlayer ? 'mt-4' : ''}`}>
        {currentPlayer ? 'Search for a different player' : 'Search by name'}
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-sm font-normal text-ink-900 outline-none placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          placeholder="Search by name"
          autoComplete="off"
        />
      </label>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
        {showResults && results.length === 0 && (
          <p className="text-sm text-ink-600">No players found.</p>
        )}

        {showResults && results.length > 0 && (
          <ul className="space-y-1.5" aria-label="Matching players">
            {results.map((player) => (
              <li key={player.beNumber}>
                <PlayerResultCard
                  player={player}
                  selected={selected?.beNumber === player.beNumber}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="mt-2 shrink-0 text-sm text-loss-600">{error}</p>}
    </div>
  )
}
