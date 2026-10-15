import { useEffect, useId, useRef, useState, type RefObject } from 'react'
import { DashboardNavigationProvider } from '../../context/DashboardNavigationContext'
import { OpponentNotesProvider } from '../../context/OpponentNotesContext'
import { TournamentRecapSection } from '../dashboard/TournamentRecapSection'
import { DRAW_PLAYER_PROFILE_LINK_CLASS } from '../notes/DrawPairNames'
import { BetaBadge } from '../ui/BetaBadge'
import type { SpreadsheetRow } from '../../types/dataset'
import type { MatchOutcome, NormalizedMatch } from '../../types/matchHistory'

const PAGE_ID = 'player-lab-header'

/** Matches the site nav height so pinned tabs sit under the purple bar. */
const SITE_NAV_HEIGHT_CLASS = 'top-16'
const SITE_NAV_HEIGHT_PX = 64

const SITE_NAV_LINKS = [
  'Seniors',
  'Juniors',
  'Masters',
  'Para',
  'Grades',
  'Ratings',
  'Senior County',
  'Shires',
  'Contact Us',
]

export function isPlayerLabHeaderPreview(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('page') === PAGE_ID
}

export function playerLabHeaderPreviewHref(): string {
  return `${import.meta.env.BASE_URL}?page=${PAGE_ID}`
}

type OptionId = 'lip' | 'bar' | 'track' | 'canvas'
type TabId = 'events' | 'notes' | 'people' | 'stats'

const TABS: { id: TabId; label: string }[] = [
  { id: 'events', label: 'Events' },
  { id: 'notes', label: 'Notes' },
  { id: 'people', label: 'People' },
  { id: 'stats', label: 'Stats' },
]

const OPTIONS: {
  id: OptionId
  name: string
  scrollLabel: string
}[] = [
  { id: 'lip', name: 'Lip of the page', scrollLabel: 'Scroll the page' },
  { id: 'bar', name: 'Bar that lifts', scrollLabel: 'Pin the tabs' },
  { id: 'track', name: 'Track and thumb', scrollLabel: 'Pin the tabs' },
  { id: 'canvas', name: 'White above the line', scrollLabel: 'Scroll the page' },
]


const NOTES = [
  { who: 'Alex Morgan', detail: 'Likes a short serve to the backhand. Slow to the net after a lift.' },
  { who: 'Priya Shah', detail: 'Strong straight smash. Leaves the cross-court open on the backhand side.' },
  { who: 'Tom Ellis', detail: 'Plays a lot of slices. Worth taking the shuttle early.' },
  { who: 'Hannah Cole', detail: 'Very quick at the net. Body smash is the safer attack.' },
  { who: 'Ben Wright', detail: 'Serves long when the score is level. Watch the toss.' },
  { who: 'Mei Chen', detail: 'Rotates early. The straight reply down her backhand works.' },
]

const PEOPLE = [
  { name: 'Sam Okonkwo', role: 'Partner', detail: '12 events together · 68% win rate' },
  { name: 'Laura Bennett', role: 'Partner', detail: '7 events together · 61% win rate' },
  { name: 'Alex Morgan', role: 'Opponent', detail: '4 meetings · 1 win, 3 losses' },
  { name: 'Priya Shah', role: 'Opponent', detail: '3 meetings · 2 wins, 1 loss' },
  { name: 'Tom Ellis', role: 'Opponent', detail: '5 meetings · 3 wins, 2 losses' },
  { name: 'Hannah Cole', role: 'Opponent', detail: '2 meetings · 2 losses' },
]

const STATS = [
  { label: 'Events', value: '28' },
  { label: 'Matches', value: '146' },
  { label: 'Win rate', value: '64%' },
  { label: 'Finals', value: '6' },
]

type PreviewMatch = {
  competitionName: string
  date: string
  category: 'Silver' | 'Bronze' | 'Gold'
  discipline: 'MD' | 'XD' | 'MS'
  disciplineLabel: string
  partnerName: string | null
  partnerRating?: number
  round: string
  outcome: MatchOutcome
  score: string
  opponents: { name: string; rating: number }[]
  playerRating: number
}

function previewMatch(input: PreviewMatch): NormalizedMatch {
  const raw: SpreadsheetRow = {
    Round: input.round,
    'Player Rating': input.playerRating,
    'Player Game 1 Score': 21,
    'Opponent Game 1 Score': input.outcome === 'win' ? 16 : 21,
    'Player Game 2 Score': input.outcome === 'win' ? 21 : 19,
    'Opponent Game 2 Score': input.outcome === 'win' ? 14 : 21,
  }
  input.opponents.forEach((opponent, index) => {
    raw[`Opponent ${index + 1} Name`] = opponent.name
    raw[`Opponent ${index + 1} Rating`] = opponent.rating
  })
  if (input.partnerName != null && input.partnerRating != null) {
    raw['Partner Rating'] = input.partnerRating
  }

  return {
    competitionName: input.competitionName,
    tournamentCategory: input.category.toLowerCase(),
    tournamentCategoryLabel: input.category,
    date: input.date,
    discipline: input.discipline,
    disciplineLabel: input.disciplineLabel,
    playerName: 'Daniel Bates',
    partnerName: input.partnerName,
    opponents: input.opponents.map((opponent) => opponent.name).join(' & '),
    outcome: input.outcome,
    nonCompetitiveReason: null,
    scoreSummary: input.score,
    playerRating: input.playerRating,
    raw,
  }
}

const PREVIEW_EVENTS: NormalizedMatch[] = [
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-03',
    category: 'Silver',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 541,
    round: 'Group A',
    outcome: 'win',
    score: '21-16, 21-14',
    playerRating: 528,
    opponents: [
      { name: 'Alex Morgan', rating: 510 },
      { name: 'Ben Wright', rating: 498 },
    ],
  }),
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-03',
    category: 'Silver',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 541,
    round: 'Group A',
    outcome: 'win',
    score: '21-18, 19-21, 21-17',
    playerRating: 530,
    opponents: [
      { name: 'Tom Ellis', rating: 522 },
      { name: 'Chris Hale', rating: 505 },
    ],
  }),
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-04',
    category: 'Silver',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 543,
    round: 'Quarter-final',
    outcome: 'win',
    score: '21-15, 21-19',
    playerRating: 534,
    opponents: [
      { name: 'Priya Shah', rating: 548 },
      { name: 'Owen Blake', rating: 536 },
    ],
  }),
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-04',
    category: 'Silver',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 543,
    round: 'Semi-final',
    outcome: 'loss',
    score: '18-21, 21-19, 16-21',
    playerRating: 532,
    opponents: [
      { name: 'Hannah Cole', rating: 560 },
      { name: 'Mei Chen', rating: 552 },
    ],
  }),
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-03',
    category: 'Silver',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    partnerName: 'Laura Bennett',
    partnerRating: 518,
    round: 'Group B',
    outcome: 'win',
    score: '21-12, 21-15',
    playerRating: 528,
    opponents: [
      { name: 'Jon Park', rating: 500 },
      { name: 'Amy Cole', rating: 490 },
    ],
  }),
  previewMatch({
    competitionName: 'Surrey Silver',
    date: '2026-10-04',
    category: 'Silver',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    partnerName: 'Laura Bennett',
    partnerRating: 520,
    round: 'Quarter-final',
    outcome: 'loss',
    score: '19-21, 15-21',
    playerRating: 526,
    opponents: [
      { name: 'Ben Wright', rating: 540 },
      { name: 'Priya Shah', rating: 548 },
    ],
  }),
  previewMatch({
    competitionName: 'Sussex Masters',
    date: '2026-09-26',
    category: 'Bronze',
    discipline: 'MS',
    disciplineLabel: "Men's singles",
    partnerName: null,
    round: 'Group A',
    outcome: 'win',
    score: '21-14, 21-18',
    playerRating: 520,
    opponents: [{ name: 'Tom Ellis', rating: 505 }],
  }),
  previewMatch({
    competitionName: 'Sussex Masters',
    date: '2026-09-27',
    category: 'Bronze',
    discipline: 'MS',
    disciplineLabel: "Men's singles",
    partnerName: null,
    round: 'Quarter-final',
    outcome: 'loss',
    score: '17-21, 21-19, 14-21',
    playerRating: 518,
    opponents: [{ name: 'Alex Morgan', rating: 540 }],
  }),
  previewMatch({
    competitionName: 'Kent Bronze',
    date: '2026-09-12',
    category: 'Bronze',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 530,
    round: 'Semi-final',
    outcome: 'win',
    score: '21-13, 21-16',
    playerRating: 512,
    opponents: [
      { name: 'Chris Hale', rating: 490 },
      { name: 'Owen Blake', rating: 500 },
    ],
  }),
  previewMatch({
    competitionName: 'Kent Bronze',
    date: '2026-09-13',
    category: 'Bronze',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    partnerName: 'Sam Okonkwo',
    partnerRating: 532,
    round: 'Final',
    outcome: 'win',
    score: '21-18, 21-15',
    playerRating: 520,
    opponents: [
      { name: 'Jon Park', rating: 508 },
      { name: 'Ben Wright', rating: 515 },
    ],
  }),
]

export function PlayerLabHeaderOptionsPage() {
  const [optionIndex, setOptionIndex] = useState(0)
  const [tab, setTab] = useState<TabId>('events')
  const [scrolled, setScrolled] = useState(false)
  const [stuck, setStuck] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const option = OPTIONS[optionIndex]

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Player Lab header options - BadmInfo'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    const root = scrollRef.current
    const sentinel = sentinelRef.current
    if (!root || !sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { root, rootMargin: `-${SITE_NAV_HEIGHT_PX}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [optionIndex])

  function showOption(index: number) {
    setOptionIndex(index)
    setTab('events')
    setStuck(false)
    setScrolled(false)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  function step(delta: number) {
    showOption((optionIndex + delta + OPTIONS.length) % OPTIONS.length)
  }

  function toggleScroll() {
    const root = scrollRef.current
    if (!root) return
    if (root.scrollTop > 24) {
      root.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    const point = document.getElementById('preview-stick-point')
    if (!point) return
    const rootRect = root.getBoundingClientRect()
    const pointRect = point.getBoundingClientRect()
    const top = pointRect.top - rootRect.top + root.scrollTop - SITE_NAV_HEIGHT_PX
    root.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <div className="flex h-dvh flex-col bg-white text-ink-900">
      <header className="shrink-0 border-b border-ink-200 bg-ink-50">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Viewing one option
              </p>
              <h1 className="text-base font-semibold text-ink-900">Player Lab header</h1>
            </div>
            <a
              href={import.meta.env.BASE_URL}
              className="text-sm font-medium text-brand-700 underline decoration-1 underline-offset-2 hover:text-brand-600"
            >
              Back to the lab
            </a>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => step(-1)}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100"
            >
              Previous
            </button>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Header options">
              {OPTIONS.map((item, index) => {
                const selected = index === optionIndex
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => showOption(index)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      selected
                        ? 'bg-ink-900 text-white'
                        : 'bg-white text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100'
                    }`}
                  >
                    {index + 1} {item.name}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => step(1)}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-100"
            >
              Next
            </button>
            <button
              type="button"
              onClick={toggleScroll}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
            >
              {scrolled ? 'Back to the top' : option.scrollLabel}
            </button>
          </div>

        </div>
      </header>

      <div
        ref={scrollRef}
        onScroll={() => setScrolled((scrollRef.current?.scrollTop ?? 0) > 24)}
        className={`min-h-0 flex-1 overflow-y-auto overscroll-contain ${
          option.id === 'bar' || option.id === 'track' ? 'bg-white' : 'bg-ink-50'
        }`}
      >
        {option.id === 'lip' ? (
          <LipOption tab={tab} onTab={setTab} />
        ) : option.id === 'bar' ? (
          <BarOption tab={tab} onTab={setTab} stuck={stuck} sentinelRef={sentinelRef} />
        ) : option.id === 'track' ? (
          <TrackOption tab={tab} onTab={setTab} stuck={stuck} sentinelRef={sentinelRef} />
        ) : (
          <CanvasOption tab={tab} onTab={setTab} />
        )}
      </div>
    </div>
  )
}

function PreviewAppHeader() {
  return (
    <header className="sticky top-0 z-30 bg-brand-50">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <button
          type="button"
          className="shrink-0 rounded-md p-1.5 text-ink-800"
          aria-label="Menu"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
            <path
              d="M3 6h16M3 11h16M3 16h16"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
            />
          </svg>
        </button>

        <div className="hidden min-w-0 flex-1 items-center overflow-x-auto md:flex">
          {SITE_NAV_LINKS.map((label, index) => (
            <span key={label} className="flex shrink-0 items-center">
              {index > 0 ? <span className="h-4 w-px bg-ink-300/80" aria-hidden /> : null}
              <span className="px-2.5 text-sm text-ink-900 lg:px-3">{label}</span>
            </span>
          ))}
        </div>

        <div className="flex min-w-0 flex-1 justify-center md:flex-none">
          <div className="w-full max-w-xs sm:w-52">
            <input
              type="search"
              readOnly
              placeholder="Search"
              aria-label="Search"
              className="w-full rounded-md border border-white bg-white px-3 py-1.5 text-sm text-ink-900 placeholder:text-ink-400"
            />
          </div>
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
          aria-hidden
        >
          SP
        </span>
      </div>
    </header>
  )
}

function Identity() {
  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
        Player Lab
        <BetaBadge />
      </p>
      <h2 className="mt-1 text-xl font-bold leading-tight text-ink-900 sm:text-2xl">Daniel Bates</h2>
      <a
        href="https://www.badminfo.com/player?name=Daniel%20Bates"
        className={`mt-1 inline-block text-sm ${DRAW_PLAYER_PROFILE_LINK_CLASS}`}
        target="_blank"
        rel="noreferrer"
      >
        Profile & Results
      </a>
      <p className="mt-2 text-sm text-ink-600">
        Tournament recaps, notes, the people behind your results, and stats on your own play - all in one place.
      </p>
    </div>
  )
}

function LipOption({ tab, onTab }: { tab: TabId; onTab: (id: TabId) => void }) {
  return (
    <div className="min-h-full bg-ink-50">
      <PreviewAppHeader />
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6">
        <Identity />
        <LipTabs tab={tab} onTab={onTab} />
      </div>
      <div id="preview-stick-point" className="border-t border-ink-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
          <PreviewBody tab={tab} />
        </div>
      </div>
    </div>
  )
}

function LipTabs({ tab, onTab }: { tab: TabId; onTab: (id: TabId) => void }) {
  const baseId = useId()
  return (
    <div role="tablist" aria-label="Dashboard sections" className="mt-5 flex items-end gap-1">
      {TABS.map((item) => {
        const selected = tab === item.id
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${baseId}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${baseId}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onTab(item.id)}
            className={`rounded-t-lg px-4 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
              selected
                ? 'relative z-10 -mb-px border-x border-t border-ink-200 bg-white text-ink-900 shadow-[0_1px_0_#fff]'
                : 'border border-transparent text-brand-700 hover:text-brand-600'
            }`}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

function CanvasOption({ tab, onTab }: { tab: TabId; onTab: (id: TabId) => void }) {
  const baseId = useId()
  return (
    <div className="min-h-full bg-ink-50">
      <PreviewAppHeader />
      <div className="bg-white">
        <div className="mx-auto max-w-6xl px-4 pt-5 pb-5 sm:px-6 sm:pt-6">
          <Identity />
        </div>
      </div>
      <div>
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <div
            role="tablist"
            aria-label="Dashboard sections"
            className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white p-1 shadow-[0_4px_12px_rgba(20,25,38,0.14)] ring-1 ring-ink-200"
          >
            {TABS.map((item) => {
              const selected = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTab(item.id)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                    selected
                      ? 'bg-ink-100 text-ink-900'
                      : 'text-brand-700 hover:bg-ink-50 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
        <div id="preview-stick-point">
          <div className="mx-auto max-w-6xl px-4 pt-4 pb-5 sm:px-6">
            <PreviewBody tab={tab} />
          </div>
        </div>
      </div>
    </div>
  )
}

function BarOption({
  tab,
  onTab,
  stuck,
  sentinelRef,
}: {
  tab: TabId
  onTab: (id: TabId) => void
  stuck: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
}) {
  const baseId = useId()
  return (
    <div className="min-h-full bg-white">
      <PreviewAppHeader />
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6">
        <Identity />
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        id="preview-stick-point"
        className={`sticky z-20 bg-white ${SITE_NAV_HEIGHT_CLASS} ${
          stuck ? 'border-b border-ink-200 shadow-[0_8px_18px_-6px_rgba(20,25,38,0.35)]' : ''
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div role="tablist" aria-label="Dashboard sections" className="mt-4 flex gap-1">
            {TABS.map((item) => {
              const selected = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTab(item.id)}
                  className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                    selected
                      ? 'border-ink-900 text-ink-900'
                      : 'border-transparent text-brand-700 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
        <PreviewBody tab={tab} />
      </div>
    </div>
  )
}

function TrackOption({
  tab,
  onTab,
  stuck,
  sentinelRef,
}: {
  tab: TabId
  onTab: (id: TabId) => void
  stuck: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
}) {
  const baseId = useId()
  return (
    <div className="min-h-full bg-white">
      <PreviewAppHeader />
      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6 sm:pt-6">
        <Identity />
      </div>
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        id="preview-stick-point"
        className={`sticky z-20 bg-white ${SITE_NAV_HEIGHT_CLASS} ${
          stuck ? 'border-b border-ink-200 shadow-[0_8px_18px_-6px_rgba(20,25,38,0.35)]' : ''
        }`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div
            role="tablist"
            aria-label="Dashboard sections"
            className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f7f6fa] p-1"
          >
            {TABS.map((item) => {
              const selected = tab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${item.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onTab(item.id)}
                  className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                    selected
                      ? 'bg-white text-ink-900 shadow-sm'
                      : 'text-brand-700 hover:text-brand-600'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <PreviewBody tab={tab} />
      </div>
    </div>
  )
}

function PreviewBody({ tab }: { tab: TabId }) {
  return (
    <div id="preview-panel" role="tabpanel">
      {tab === 'events' ? <EventList /> : null}
      {tab === 'notes' ? <NoteList /> : null}
      {tab === 'people' ? <PeopleList /> : null}
      {tab === 'stats' ? <StatsList /> : null}
    </div>
  )
}

function EventList() {
  return (
    <div className="pb-16">
      <DashboardNavigationProvider>
        <OpponentNotesProvider playerName="Daniel Bates">
          <TournamentRecapSection
            allMatches={PREVIEW_EVENTS}
            showBuildStagePicker={false}
            includeFictionalFeatureRecap={false}
            plainHeader
          />
        </OpponentNotesProvider>
      </DashboardNavigationProvider>
    </div>
  )
}

function NoteList() {
  return (
    <div className="space-y-4 pb-16">
      {NOTES.map((note) => (
        <article key={note.who} className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
          <h3 className="text-base font-semibold text-ink-900">{note.who}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-600">{note.detail}</p>
        </article>
      ))}
    </div>
  )
}

function PeopleList() {
  return (
    <div className="space-y-4 pb-16">
      {PEOPLE.map((person) => (
        <article key={person.name} className="rounded-2xl card-frame bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-ink-900">{person.name}</h3>
            <span className="text-xs font-semibold uppercase tracking-wide text-brand-700">{person.role}</span>
          </div>
          <p className="mt-2 text-sm text-ink-600">{person.detail}</p>
        </article>
      ))}
    </div>
  )
}

function StatsList() {
  return (
    <div className="space-y-4 pb-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {STATS.map((stat) => (
          <article key={stat.label} className="rounded-2xl card-frame bg-white p-4 shadow-sm">
            <p className="text-2xl font-bold tabular-nums text-ink-900">{stat.value}</p>
            <p className="mt-1 text-sm text-ink-600">{stat.label}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
