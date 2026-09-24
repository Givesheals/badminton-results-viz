import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { getPlayerInitials } from '../../lib/getPlayerInitials'
import { CompetitionAgeChip } from './CompetitionAgeChip'
import { TournamentCategoryChip } from './TournamentCategoryChip'

type Level = 'Gold' | 'Silver' | 'Bronze' | 'Copper' | 'Other'
type When = 'upcoming' | 'past'

type AgeOption = {
  id: string
  label: string
  chipLabel?: string
  family?: 'junior' | 'senior' | 'masters'
}

type TournamentRow = {
  id: string
  name: string
  level: Level
  ageId: string
  dateLines: string[]
  drivingMinutes: number
  when: When
  entryClosed?: boolean
  closesSoon?: boolean
  entered?: boolean
  favouritesEntered?: number
}

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
}

const LEVELS: Level[] = ['Gold', 'Silver', 'Bronze', 'Copper', 'Other']

const JUNIOR_AGES: AgeOption[] = [
  { id: 'U11', label: 'Under 11' },
  { id: 'U12', label: 'Under 12' },
  { id: 'U13', label: 'Under 13' },
  { id: 'U14', label: 'Under 14' },
  { id: 'U15', label: 'Under 15' },
  { id: 'U16', label: 'Under 16' },
  { id: 'U17', label: 'Under 17' },
  { id: 'U18', label: 'Under 18' },
  { id: 'U19', label: 'Under 19' },
  { id: 'JuniorOther', label: 'Other', chipLabel: 'Other', family: 'junior' },
]

const MASTER_AGES: AgeOption[] = [
  { id: 'O35', label: 'Over 35' },
  { id: 'O40', label: 'Over 40' },
  { id: 'O45', label: 'Over 45' },
  { id: 'O50', label: 'Over 50' },
  { id: 'O55', label: 'Over 55' },
  { id: 'O60', label: 'Over 60' },
  { id: 'O65', label: 'Over 65' },
  { id: 'O70', label: 'Over 70' },
  { id: 'O75', label: 'Over 75' },
]

const SENIOR_AGE: AgeOption = { id: 'Senior', label: 'Seniors' }

const ALL_AGES: AgeOption[] = [...JUNIOR_AGES, SENIOR_AGE, ...MASTER_AGES]

const DRIVE_LIMITS: { minutes: number | null; label: string }[] = [
  { minutes: null, label: 'Unlimited' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 hour' },
  { minutes: 120, label: '2 hours' },
  { minutes: 180, label: '3 hours' },
  { minutes: 240, label: '4 hours' },
]

const TOURNAMENTS: TournamentRow[] = [
  {
    id: 'cumbria',
    name: 'Cumbria Senior Championships 2026-2027',
    level: 'Gold',
    ageId: 'Senior',
    dateLines: ['27 Sept', '2026'],
    drivingMinutes: 4 * 60 + 13,
    when: 'upcoming',
  },
  {
    id: 'dorset',
    name: 'Dorset Under 13 Restricted 2026',
    level: 'Bronze',
    ageId: 'U13',
    dateLines: ['27 Sept', '2026'],
    drivingMinutes: 2 * 60 + 54,
    when: 'upcoming',
  },
  {
    id: 'cambs',
    name: 'Cambridgeshire Under 17 Restricted 2026',
    level: 'Silver',
    ageId: 'U17',
    dateLines: ['03 & 04', 'Oct', '2026'],
    drivingMinutes: 22,
    when: 'upcoming',
    entryClosed: true,
    entered: true,
    favouritesEntered: 16,
  },
  {
    id: 'suffolk',
    name: 'Suffolk Over 45 Restricted 2026-27',
    level: 'Copper',
    ageId: 'O45',
    dateLines: ['03 Oct', '2026'],
    drivingMinutes: 1 * 60 + 14,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'surrey-u15',
    name: 'Surrey Under 15 Gold 2026',
    level: 'Gold',
    ageId: 'U15',
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 48,
    when: 'upcoming',
  },
  {
    id: 'essex-o35',
    name: 'Essex Over 35 Silver 2026',
    level: 'Silver',
    ageId: 'O35',
    dateLines: ['18 Oct', '2026'],
    drivingMinutes: 100,
    when: 'upcoming',
  },
  {
    id: 'kent-u19',
    name: 'Kent Under 19 Bronze 2026',
    level: 'Bronze',
    ageId: 'U19',
    dateLines: ['25 Oct', '2026'],
    drivingMinutes: 115,
    when: 'upcoming',
  },
  {
    id: 'hants',
    name: 'Hampshire Senior Copper 2026',
    level: 'Copper',
    ageId: 'Senior',
    dateLines: ['01 Nov', '2026'],
    drivingMinutes: 130,
    when: 'upcoming',
  },
  {
    id: 'norfolk',
    name: 'Norfolk Over 60 Restricted 2026',
    level: 'Other',
    ageId: 'O60',
    dateLines: ['08 Nov', '2026'],
    drivingMinutes: 160,
    when: 'upcoming',
    entryClosed: true,
  },
  {
    id: 'yorks-u11',
    name: 'Yorkshire Under 11 Open 2026',
    level: 'Gold',
    ageId: 'U11',
    dateLines: ['15 Nov', '2026'],
    drivingMinutes: 185,
    when: 'upcoming',
  },
  {
    id: 'middlesex-other',
    name: 'Middlesex Junior Other 2026',
    level: 'Copper',
    ageId: 'JuniorOther',
    dateLines: ['22 Nov', '2026'],
    drivingMinutes: 55,
    when: 'upcoming',
  },
  {
    id: 'devon',
    name: 'Devon Over 50 Gold 2026',
    level: 'Gold',
    ageId: 'O50',
    dateLines: ['06 Sept', '2026'],
    drivingMinutes: 280,
    when: 'past',
  },
  {
    id: 'lancs',
    name: 'Lancashire Under 12 Silver 2026',
    level: 'Silver',
    ageId: 'U12',
    dateLines: ['30 Aug', '2026'],
    drivingMinutes: 200,
    when: 'past',
  },
  {
    id: 'warks',
    name: 'Warwickshire Senior Bronze 2026',
    level: 'Bronze',
    ageId: 'Senior',
    dateLines: ['12 Sept', '2026'],
    drivingMinutes: 65,
    when: 'past',
    entered: true,
  },
  {
    id: 'oxon',
    name: 'Oxfordshire Over 40 Copper 2026',
    level: 'Copper',
    ageId: 'O40',
    dateLines: ['19 Sept', '2026'],
    drivingMinutes: 88,
    when: 'past',
    entryClosed: true,
  },
]

function formatDrive(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
}

function selectionLabel(selected: number, total: number, singleName: string | null): string {
  if (selected === 0) return 'None'
  if (selected === total) return 'All'
  if (selected === 1 && singleName) return singleName
  return `${selected} selected`
}

function CheckControl({
  checked,
  indeterminate = false,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  label: string
}) {
  return (
    <span className="flex items-center gap-3">
      <span
        className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[3px] border ${
          checked || indeterminate
            ? 'border-[#5b2d91] bg-[#5b2d91] text-white'
            : 'border-[#c4b6d6] bg-white'
        }`}
        aria-hidden
      >
        {indeterminate ? (
          <span className="block h-0.5 w-2.5 rounded-full bg-white" />
        ) : checked ? (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2.2 6.2 4.7 8.7 9.8 3.4"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  )
}

function FilterModal({
  title,
  onClose,
  onSelectAll,
  onClearAll,
  children,
}: {
  title: string
  onClose: () => void
  onSelectAll: () => void
  onClearAll: () => void
  children: React.ReactNode
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    panelRef.current?.focus()
  }, [])

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/45 px-3 pt-8">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[min(640px,calc(100vh-4rem))] w-full max-w-[420px] flex-col overflow-hidden rounded-md bg-white shadow-xl outline-none"
      >
        <div className="flex items-start justify-between px-5 pb-3 pt-4">
          <h2 id={titleId} className="text-[22px] font-semibold leading-tight text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-2xl leading-none text-ink-800 hover:bg-ink-50"
            aria-label={`Close ${title}`}
          >
            ×
          </button>
        </div>
        <div className="mx-5 border-t border-ink-200" />
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        <div className="mx-5 border-t border-ink-200" />
        <div className="flex items-center gap-6 px-5 py-4">
          <button
            type="button"
            onClick={onSelectAll}
            className="text-[15px] font-medium text-[#4c2a86] underline decoration-[#4c2a86] underline-offset-2"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={onClearAll}
            className="text-[15px] font-medium text-[#4c2a86] underline decoration-[#4c2a86] underline-offset-2"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded border border-ink-300 bg-white px-4 py-1.5 text-[15px] text-ink-900 hover:bg-ink-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function TournamentListingsPage({ open, onClose, playerName }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const initials = getPlayerInitials(playerName)
  const [query, setQuery] = useState('')
  const [when, setWhen] = useState<When>('upcoming')
  const [showClosed, setShowClosed] = useState(false)
  const [levels, setLevels] = useState<Level[]>(LEVELS)
  const [ages, setAges] = useState<string[]>(ALL_AGES.map((age) => age.id))
  const [maxDrive, setMaxDrive] = useState<number | null>(null)
  const [typeModalOpen, setTypeModalOpen] = useState(false)
  const [ageModalOpen, setAgeModalOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (typeModalOpen) {
        setTypeModalOpen(false)
        return
      }
      if (ageModalOpen) {
        setAgeModalOpen(false)
        return
      }
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, typeModalOpen, ageModalOpen])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return TOURNAMENTS.filter((row) => {
      if (row.when !== when) return false
      if (needle && !row.name.toLowerCase().includes(needle)) return false
      if (!levels.includes(row.level)) return false
      if (!ages.includes(row.ageId)) return false
      if (maxDrive != null && row.drivingMinutes > maxDrive) return false
      if (row.entryClosed && !showClosed && !row.entered) return false
      return true
    })
  }, [ages, levels, maxDrive, query, showClosed, when])

  if (!open) return null

  const levelSummary = selectionLabel(
    levels.length,
    LEVELS.length,
    levels.length === 1 ? levels[0] : null,
  )
  const ageSummary = selectionLabel(
    ages.length,
    ALL_AGES.length,
    ages.length === 1 ? (ALL_AGES.find((age) => age.id === ages[0])?.label ?? null) : null,
  )
  const juniorIds = JUNIOR_AGES.map((age) => age.id)
  const masterIds = MASTER_AGES.map((age) => age.id)
  const juniorsOn = juniorIds.filter((id) => ages.includes(id)).length
  const mastersOn = masterIds.filter((id) => ages.includes(id)).length

  function toggleLevel(level: Level) {
    setLevels((current) =>
      current.includes(level) ? current.filter((item) => item !== level) : [...current, level],
    )
  }

  function toggleAge(id: string) {
    setAges((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function toggleGroup(ids: string[]) {
    setAges((current) => {
      const allOn = ids.every((id) => current.includes(id))
      if (allOn) return current.filter((id) => !ids.includes(id))
      return [...new Set([...current, ...ids])]
    })
  }

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-[#eef1f6] outline-none"
    >
      <header className="bg-[#efe6f6]">
        <div className="mx-auto flex max-w-[720px] items-center gap-3 px-3 py-3">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-[5px]"
            aria-label="Back to your results"
          >
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
            <span className="block h-[2.5px] w-6 rounded-full bg-[#5b2d91]" />
          </button>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search tournaments"
            className="h-10 min-w-0 flex-1 rounded-md border border-transparent bg-white px-3 text-[15px] text-ink-900 outline-none placeholder:text-ink-400 focus:border-[#c4b6d6]"
          />
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d28a0] text-sm font-bold text-white"
            aria-hidden
          >
            {initials}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-2.5 py-3">
        <section className="overflow-hidden rounded-2xl border border-[#e4dff0] bg-[#f7f5fb] shadow-sm">
          <div className="px-4 pb-2 pt-4">
            <h1 id={titleId} className="text-[26px] font-bold leading-tight tracking-tight text-ink-900">
              Tournaments
            </h1>

            <div className="mt-4 grid max-w-[22rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7.75rem] gap-x-2">
              <div>
                <p className="text-[15px] font-medium text-[#5c348c]">Types:</p>
                <button
                  type="button"
                  onClick={() => setTypeModalOpen(true)}
                  aria-label={`Types, ${levelSummary}`}
                  className="mt-1 inline-flex items-center gap-1 text-[15px] font-medium text-[#5c348c]"
                >
                  {levelSummary}
                  <Chevron />
                </button>
              </div>
              <div>
                <p className="text-[15px] font-medium text-[#5c348c]">Age Group</p>
                <button
                  type="button"
                  onClick={() => setAgeModalOpen(true)}
                  aria-label={`Age Group, ${ageSummary}`}
                  className="mt-1 inline-flex items-center gap-1 text-left text-[15px] font-medium text-[#5c348c]"
                >
                  {ageSummary}
                  <Chevron />
                </button>
              </div>
              <label className="min-w-0">
                <span className="block text-[15px] font-medium leading-tight text-[#5c348c]">
                  Max Driving Time
                </span>
                <span className="relative mt-1 block">
                  <select
                    value={maxDrive == null ? 'all' : String(maxDrive)}
                    onChange={(event) => {
                      const value = event.target.value
                      setMaxDrive(value === 'all' ? null : Number(value))
                    }}
                    aria-label="Max driving time"
                    className="h-9 w-full appearance-none rounded-md border border-[#d9d4e4] bg-white pl-1.5 pr-6 text-[13px] text-ink-900"
                  >
                    {DRIVE_LIMITS.map((option) => (
                      <option key={option.label} value={option.minutes == null ? 'all' : option.minutes}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#5c348c]">
                    <Chevron />
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <span className="text-[15px] font-medium text-[#5c348c]">Show Closed</span>
              <button
                type="button"
                role="switch"
                aria-checked={showClosed}
                aria-label="Show closed"
                onClick={() => setShowClosed((current) => !current)}
                className={`relative h-[22px] w-10 rounded-full transition-colors ${
                  showClosed ? 'bg-[#5b2d91]' : 'bg-[#d5d3dc]'
                }`}
              >
                <span
                  className={`absolute top-[3px] h-4 w-4 rounded-full shadow-sm transition-transform ${
                    showClosed ? 'translate-x-[20px] bg-white' : 'translate-x-[3px] bg-[#9a97a3]'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-2 flex gap-6 border-b border-[#e6e1ef] px-4">
            <TabButton active={when === 'upcoming'} onClick={() => setWhen('upcoming')}>
              Upcoming
            </TabButton>
            <TabButton active={when === 'past'} onClick={() => setWhen('past')}>
              Past
            </TabButton>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.25rem_2.8rem] gap-x-2 px-4 py-3 text-[15px] font-bold text-ink-900 sm:grid-cols-[minmax(0,18rem)_5.5rem_4.25rem_2.8rem]">
            <span>Name</span>
            <span className="justify-self-start text-left">Type</span>
            <span>Date</span>
            <span>Driving</span>
          </div>

          <ul className="max-h-[calc(100vh-320px)] min-h-[280px] divide-y divide-[#ece8f3] overflow-y-auto">
            {rows.map((row) => (
              <li key={row.id} className="px-4 py-3">
                <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.25rem_2.8rem] items-start gap-x-2 sm:grid-cols-[minmax(0,18rem)_5.5rem_4.25rem_2.8rem]">
                <p className="min-w-0 text-[15px] font-medium leading-snug text-[#4c2a86] underline decoration-[#4c2a86] underline-offset-2">
                  {row.name}
                </p>
                <div className="justify-self-start pt-0.5 text-left">
                  <TournamentCategoryChip label={row.level} />
                </div>
                <p className="text-[14px] leading-tight text-ink-900">
                  {row.dateLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </p>
                <p className="text-[15px] font-medium text-[#4c2a86] underline decoration-[#4c2a86] underline-offset-2">
                  {formatDrive(row.drivingMinutes)}
                </p>
                </div>
                {row.entryClosed && (
                  <p className="mt-1 text-[#5b2d91]" aria-label="Entry closed">
                    <LockIcon />
                  </p>
                )}
                {row.closesSoon && (
                  <p className="mt-1 text-[#5b2d91]" aria-label="Entry closes soon">
                    <ClockIcon />
                  </p>
                )}
                {row.entered && (
                  <p className="mt-1 flex items-center gap-1 text-[13px] leading-snug text-[#1d8a32]">
                    <CheckIcon />
                    <span>You're entered.</span>
                  </p>
                )}
                {row.favouritesEntered != null && (
                  <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-snug text-[#1d8a32]">
                    <CheckIcon />
                    <span>{row.favouritesEntered} favourites entered.</span>
                  </p>
                )}
              </li>
            ))}
          </ul>
          {rows.length === 0 && (
            <p className="px-4 py-8 text-sm text-ink-600">No tournaments match these filters.</p>
          )}
        </section>
      </div>

      {typeModalOpen && (
        <FilterModal
          title="Filter Types"
          onClose={() => setTypeModalOpen(false)}
          onSelectAll={() => setLevels(LEVELS)}
          onClearAll={() => setLevels([])}
        >
          <ul className="space-y-3">
            {LEVELS.map((level) => {
              const checked = levels.includes(level)
              return (
                <li key={level}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggleLevel(level)}
                    className="flex items-center gap-3"
                  >
                    <CheckControl checked={checked} label={level} />
                    <TournamentCategoryChip label={level} className="px-3 py-1 text-sm" />
                  </button>
                </li>
              )
            })}
          </ul>
        </FilterModal>
      )}

      {ageModalOpen && (
        <FilterModal
          title="Filter Age Groups"
          onClose={() => setAgeModalOpen(false)}
          onSelectAll={() => setAges(ALL_AGES.map((age) => age.id))}
          onClearAll={() => setAges([])}
        >
          <div className="grid grid-cols-2 items-start gap-x-3">
            <AgeFamily
              label="Juniors"
              chipLabel="Junior"
              checked={juniorsOn === juniorIds.length}
              indeterminate={juniorsOn > 0 && juniorsOn < juniorIds.length}
              onToggle={() => toggleGroup(juniorIds)}
            >
              {JUNIOR_AGES.map((age) => (
                <AgeLeaf
                  key={age.id}
                  label={age.label}
                  chipLabel={age.chipLabel ?? age.id}
                  family={age.family}
                  compact={age.chipLabel != null}
                  checked={ages.includes(age.id)}
                  onToggle={() => toggleAge(age.id)}
                />
              ))}
            </AgeFamily>
            <div className="space-y-4">
              <AgeLeaf
                label="Seniors"
                chipLabel="Senior"
                checked={ages.includes(SENIOR_AGE.id)}
                onToggle={() => toggleAge(SENIOR_AGE.id)}
              />
              <AgeFamily
                label="Masters"
                chipLabel="Masters"
                checked={mastersOn === masterIds.length}
                indeterminate={mastersOn > 0 && mastersOn < masterIds.length}
                onToggle={() => toggleGroup(masterIds)}
              >
                {MASTER_AGES.map((age) => (
                  <AgeLeaf
                    key={age.id}
                    label={age.label}
                    chipLabel={age.id}
                    checked={ages.includes(age.id)}
                    onToggle={() => toggleAge(age.id)}
                  />
                ))}
              </AgeFamily>
            </div>
          </div>
        </FilterModal>
      )}
    </div>,
    document.body,
  )
}

function AgeFamily({
  label,
  chipLabel,
  checked,
  indeterminate,
  onToggle,
  children,
}: {
  label: string
  chipLabel: string
  checked: boolean
  indeterminate: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div>
      <button
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? 'mixed' : checked}
        aria-label={label}
        onClick={onToggle}
        className="flex items-center gap-2"
      >
        <CheckControl checked={checked} indeterminate={indeterminate} label={label} />
        <CompetitionAgeChip label={chipLabel} className="text-xs" />
      </button>
      <div className="mt-2 space-y-2 pl-6">{children}</div>
    </div>
  )
}

function AgeLeaf({
  label,
  chipLabel,
  checked,
  onToggle,
  family,
  compact = false,
}: {
  label: string
  chipLabel: string
  checked: boolean
  onToggle: () => void
  family?: 'junior' | 'senior' | 'masters'
  compact?: boolean
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className="flex items-center gap-2"
    >
      <CheckControl checked={checked} label={label} />
      <CompetitionAgeChip label={chipLabel} family={family} compact={compact} className="text-xs" />
    </button>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 pb-2 text-[16px] ${
        active
          ? 'border-[#5b2d91] font-bold text-ink-900'
          : 'border-transparent font-medium text-[#8d79b0]'
      }`}
    >
      {children}
    </button>
  )
}

function Chevron() {
  return (
    <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
      <path d="M2.2 4.2 6 8l3.8-3.8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 1.5A3.5 3.5 0 0 0 4.5 5v1.2H4a1.5 1.5 0 0 0-1.5 1.5v5.3A1.5 1.5 0 0 0 4 14.5h8a1.5 1.5 0 0 0 1.5-1.5V7.7A1.5 1.5 0 0 0 12 6.2h-.5V5A3.5 3.5 0 0 0 8 1.5Zm-2 3.5a2 2 0 1 1 4 0v1.2H6V5Z" />
    </svg>
  )
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M8 1.4a6.6 6.6 0 1 0 0 13.2A6.6 6.6 0 0 0 8 1.4Zm.7 3.2v3.2l2.2 1.3-.7 1.1-2.7-1.6V4.6h1.2Z" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.6 8.2 6.8 10.3 11.4 5.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}
