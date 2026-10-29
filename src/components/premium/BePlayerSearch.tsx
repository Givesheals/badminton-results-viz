import { useEffect, useId, useMemo, useState } from 'react'
import {
  DEMO_ACCOUNT_BE_NUMBER,
  findBePlayerByNumber,
  searchBePlayers,
  type BePlayerRecord,
} from '../../data/bePlayerDirectory'
import {
  prototypeDisciplineRatings,
  ratingChipBandForRating,
  U19_RATING_DISCIPLINES,
} from '../../lib/opponentNoteIdentity'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { RatingChip } from '../notes/OpponentRatingChips'
import { CompetitionAgeChip } from '../tournament/CompetitionAgeChip'
import { CountyAffiliationChip } from '../tournament/CountyAffiliationChip'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

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

function hashBeNumber(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const GLANCE_TOURNAMENTS = [
  'Cambridgeshire Senior County Championships',
  'Suffolk Masters Open Championships',
  'Essex Restricted Graded Tournament',
  'Surrey Open Championships',
  'Buckinghamshire County Championships',
  'Norfolk Senior County Tournament',
  'Kent Restricted Championships',
  'Oxfordshire Masters Open',
  'Hertfordshire Senior Championships',
  'Middlesex Open Championships',
] as const

const GLANCE_LEVELS = ['Bronze', 'Silver', 'Gold', 'Copper'] as const

const GLANCE_MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

const SARAH_CHEN_BE_NUMBER = '1172208'

const GLANCE_PARTNERS = [
  'James Smith',
  'Emma Wilson',
  'Sarah Chen',
  'Alex Taylor',
  'Christopher Parker',
  'Daniel Bates',
  'Joseph Simon',
  'Joel Simon',
] as const

type GlanceMatch = {
  discipline: 'OS' | 'OD' | 'XD'
  name?: string
}

type GlanceEvent = {
  name: string
  level: string
  age: string
  date: string
  partners: GlanceMatch[]
}

function ordinalDay(day: number): string {
  const mod100 = day % 100
  if (mod100 >= 11 && mod100 <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

/** Stable sample of recent tournaments, different for each BE Number. */
function prototypePlayerGlance(beNumber: string): GlanceEvent[] {
  const hash = hashBeNumber(beNumber)
  const events = [0, 1].map((index) => {
    const monthsBack = (hash % 4) + index * 5
    const totalMonths = 2026 * 12 + 6 - monthsBack
    const year = Math.floor(totalMonths / 12)
    const month = GLANCE_MONTH_NAMES[totalMonths % 12]!
    const day = 3 + ((hash + index * 7) % 25)
    const partnerA = GLANCE_PARTNERS[(hash + index * 2) % GLANCE_PARTNERS.length]!
    let partnerB = GLANCE_PARTNERS[(hash + index * 2 + 3) % GLANCE_PARTNERS.length]!
    if (partnerB === partnerA) {
      partnerB = GLANCE_PARTNERS[(hash + index + 5) % GLANCE_PARTNERS.length]!
    }
    const partners: GlanceMatch[] =
      index === 1 && hash % 2 === 0
        ? [{ discipline: 'OD', name: partnerA }]
        : [
            { discipline: 'OD', name: partnerA },
            { discipline: 'XD', name: partnerB },
          ]
    return {
      name: GLANCE_TOURNAMENTS[(hash + index * 3) % GLANCE_TOURNAMENTS.length]!,
      level: GLANCE_LEVELS[(hash + index) % GLANCE_LEVELS.length]!,
      age: 'Senior',
      date: `${ordinalDay(day)} ${month} ${year}`,
      partners,
    }
  })

  if (beNumber === DEMO_ACCOUNT_BE_NUMBER) {
    const countyIndex = events.findIndex((event) => event.name === 'Buckinghamshire County Championships')
    const target = countyIndex >= 0 ? countyIndex : 1
    events[target] = {
      name: 'Senior County Championships - 25/26',
      level: 'County',
      age: 'Senior',
      date: '15th & 16th January 2026',
      partners: [
        { discipline: 'OS' },
        { discipline: 'OD', name: 'Joel Simon, Daniel Bates' },
        { discipline: 'XD', name: 'Sarah Chen' },
      ],
    }
  }

  if (beNumber === SARAH_CHEN_BE_NUMBER) {
    const juniorNames = ['Oxfordshire Junior Championships', 'Essex Junior Open'] as const
    const otherPartners = ['James Smith', 'Emma Wilson', 'Alex Taylor', 'Daniel Bates']
    events.forEach((event, index) => {
      event.name = juniorNames[index] ?? event.name
      event.age = 'U17'
      const used = new Set(event.partners.map((match) => match.name).filter(Boolean))
      for (const match of event.partners) {
        if (match.name !== 'Sarah Chen') continue
        const replacement = otherPartners.find((name) => !used.has(name)) ?? 'James Smith'
        match.name = replacement
        used.add(replacement)
      }
    })
  }

  return events
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
  expanded,
  onToggleGlance,
}: {
  player: BePlayerRecord
  selected: boolean
  onSelect: (player: BePlayerRecord) => void
  /** Shown above the name, for the account's current BE Number. */
  label?: string
  expanded: boolean
  onToggleGlance: (beNumber: string) => void
}) {
  const shortName = countyBadgeShortName(player.county)
  const ratings = prototypeDisciplineRatings(`${player.name}|${player.beNumber}`)
  const radioId = useId()
  const glance = prototypePlayerGlance(player.beNumber)

  return (
    <div
      className={`overflow-hidden rounded-xl border-2 transition ${
        selected ? 'border-brand-500' : 'border-ink-100 hover:border-brand-300'
      }`}
    >
      <div className="flex items-stretch">
        <label
          htmlFor={radioId}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 bg-white px-3 py-2"
        >
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
        <button
          type="button"
          aria-expanded={expanded}
          aria-label="Events and partners"
          onClick={() => onToggleGlance(player.beNumber)}
          className="flex w-12 shrink-0 items-center justify-center border-l border-ink-100 bg-white text-ink-700 transition hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
        >
          <ChevronIcon expanded={expanded} />
        </button>
      </div>
      {expanded ? (
        <div className="border-t border-ink-100 bg-white px-3 py-2.5">
          <p className="text-sm font-semibold text-ink-900">Latest events</p>
          <ul className="mt-2">
            {glance.map((event, index) => (
              <li key={`${event.name}-${event.date}`} className={index > 0 ? 'mt-3' : undefined}>
                {index > 0 ? <div className="mb-3 h-px w-full bg-ink-200" aria-hidden /> : null}
                <p className="text-[13px] font-medium leading-5 text-ink-900">{event.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <TournamentCategoryChip label={event.level} />
                  <CompetitionAgeChip label={event.age} />
                  <span className="text-xs font-medium text-ink-900">{event.date}</span>
                </div>
                <ul className="mt-1.5 space-y-1">
                  {event.partners.map((match) => (
                    <li
                      key={`${match.discipline}-${match.name ?? 'solo'}`}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <DisciplineChip code={match.discipline} />
                      {match.name ? (
                        <>
                          <span className="italic text-ink-600">with</span>
                          <span className="font-medium text-ink-900">{match.name}</span>
                        </>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-6 w-6 shrink-0 transition ${expanded ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
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
  const [openBeNumber, setOpenBeNumber] = useState<string | null>(null)
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
          expanded={openBeNumber === currentPlayer.beNumber}
          onToggleGlance={(beNumber) =>
            setOpenBeNumber((current) => (current === beNumber ? null : beNumber))
          }
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
                  expanded={openBeNumber === player.beNumber}
                  onToggleGlance={(beNumber) =>
                    setOpenBeNumber((current) => (current === beNumber ? null : beNumber))
                  }
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
