import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTicketBuildPicker } from '../../hooks/useTicketBuildPicker'
import { getPlayerInitials } from '../../lib/getPlayerInitials'
import {
  listingTitleWithAgeChips,
  TOURNAMENT_LISTINGS_BUILD_STAGE_META,
  TOURNAMENT_LISTINGS_BUILD_STAGES,
  type TournamentListingsBuildStage,
} from '../../lib/tournamentListingsBuildStage'
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

type ListingFamily = 'junior' | 'senior' | 'masters'

type TournamentRow = {
  id: string
  name: string
  level: Level
  /** Senior, Junior, or Masters, taken from the listings page heading. */
  family: ListingFamily
  /** Bands named in the title. Empty when the title only belongs to the family. */
  ageIds: string[]
  dateLines: string[]
  drivingMinutes: number | null
  when: When
  entryClosed?: boolean
  closesSoon?: boolean
  entered?: boolean
  favouritesEntered?: number
  otherEntered?: string
}

type Props = {
  open: boolean
  onClose: () => void
  playerName: string
  onOpenAccountMenu: () => void
  accountMenuOpen: boolean
  onOpenTournament: () => void
  tournamentPageOpen: boolean
}

const LEVELS: Level[] = ['Gold', 'Silver', 'Bronze', 'Copper', 'Other']

const JUNIOR_OTHER_ID = 'JuniorOther'

/** Even junior bands are not listed on their own. They sit inside Other. */
const JUNIOR_AGES_INSIDE_OTHER = ['U12', 'U14', 'U16', 'U18']

const JUNIOR_AGES: AgeOption[] = [
  { id: 'U11', label: 'Under 11' },
  { id: 'U13', label: 'Under 13' },
  { id: 'U15', label: 'Under 15' },
  { id: 'U17', label: 'Under 17' },
  { id: 'U19', label: 'Under 19' },
  { id: JUNIOR_OTHER_ID, label: 'Other', chipLabel: 'Other', family: 'junior' },
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
    id: 'cumbria-senior-champs',
    name: 'Cumbria Senior Championships 2026-2027',
    level: 'Other',
    family: 'senior',
    ageIds: [],
    dateLines: ['27 Sept', '2026'],
    drivingMinutes: 4 * 60 + 13,
    when: 'upcoming',
  },
  {
    id: 'dorset-senior-restricted',
    name: 'Dorset Senior Restricted 2026',
    level: 'Other',
    family: 'senior',
    ageIds: [],
    dateLines: ['27 Sept', '2026'],
    drivingMinutes: 2 * 60 + 54,
    when: 'upcoming',
  },
  {
    id: 'cambs-restricted',
    name: 'Cambridgeshire Restricted 2026',
    level: 'Other',
    family: 'senior',
    ageIds: [],
    dateLines: ['03 & 04', 'Oct 2026'],
    drivingMinutes: 22,
    when: 'upcoming',
    entryClosed: true,
    entered: true,
    favouritesEntered: 16,
  },
  {
    id: 'suffolk-senior-restricted',
    name: 'Suffolk Senior Restricted 2026-27',
    level: 'Other',
    family: 'senior',
    ageIds: [],
    dateLines: ['03 Oct', '2026'],
    drivingMinutes: 1 * 60 + 14,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'northumberland-senior-silver',
    name: '2026 Northumberland Senior Silver',
    level: 'Silver',
    family: 'senior',
    ageIds: [],
    dateLines: ['10 & 11', 'Oct 2026'],
    drivingMinutes: null,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'herts-senior-restricted',
    name: 'Hertfordshire Senior Restricted 2026',
    level: 'Other',
    family: 'senior',
    ageIds: [],
    dateLines: ['10 & 11', 'Oct 2026'],
    drivingMinutes: null,
    when: 'upcoming',
  },
  {
    id: 'suffolk-senior-bronze',
    name: 'Suffolk Senior Bronze',
    level: 'Bronze',
    family: 'senior',
    ageIds: [],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 1 * 60 + 14,
    when: 'upcoming',
    closesSoon: true,
    favouritesEntered: 3,
  },
  {
    id: 'hants-senior-tier4',
    name: 'Hampshire Senior Tier 4 (Oct 2 Day) 2026',
    level: 'Copper',
    family: 'senior',
    ageIds: [],
    dateLines: ['17 & 18', 'Oct 2026'],
    drivingMinutes: 2 * 60 + 16,
    when: 'upcoming',
  },
  {
    id: 'middlesex-senior-gold',
    name: 'Middlesex Senior Gold Tournament 2026',
    level: 'Gold',
    family: 'senior',
    ageIds: [],
    dateLines: ['17 & 18', 'Oct 2026'],
    drivingMinutes: 1 * 60 + 29,
    when: 'upcoming',
  },
  {
    id: 'hertford-csbc-bronze',
    name: 'Hertford CSBC Senior Bronze October 2026',
    level: 'Bronze',
    family: 'senior',
    ageIds: [],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 56,
    when: 'upcoming',
    otherEntered: 'Zoe Foota',
  },
  {
    id: 'lancs-tier4',
    name: 'Lancashire Tier 4 Tournament',
    level: 'Copper',
    family: 'senior',
    ageIds: [],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 3 * 60 + 13,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'somerset-senior-bronze',
    name: 'Somerset Senior Bronze (October) 2026',
    level: 'Bronze',
    family: 'senior',
    ageIds: [],
    dateLines: ['24 Oct', '2026'],
    drivingMinutes: 3 * 60 + 50,
    when: 'upcoming',
  },
  {
    id: 'dorset-senior-silver',
    name: 'Dorset Senior Silver 2026',
    level: 'Silver',
    family: 'senior',
    ageIds: [],
    dateLines: ['24 & 25', 'Oct 2026'],
    drivingMinutes: 2 * 60 + 54,
    when: 'upcoming',
  },
  {
    id: 'reading-csbc-tier4',
    name: 'Reading CSBC Senior Tier 4 October 2026',
    level: 'Copper',
    family: 'senior',
    ageIds: [],
    dateLines: ['24 Oct', '2026'],
    drivingMinutes: 1 * 60 + 52,
    when: 'upcoming',
  },
  {
    id: 'cumbria-junior-champs',
    name: 'Cumbria Junior Championships 2026/2027',
    level: 'Other',
    family: 'junior',
    ageIds: [],
    dateLines: ['03 Oct', '2026'],
    drivingMinutes: 4 * 60 + 13,
    when: 'upcoming',
  },
  {
    id: 'wilts-u19-silver',
    name: 'Wiltshire U19 Silver October 2026',
    level: 'Silver',
    family: 'junior',
    ageIds: ['U19'],
    dateLines: ['04 Oct', '2026'],
    drivingMinutes: 2 * 60 + 58,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'suffolk-u19-silver',
    name: 'Suffolk U19 Silver',
    level: 'Silver',
    family: 'junior',
    ageIds: ['U19'],
    dateLines: ['10 Oct', '2026'],
    drivingMinutes: 1 * 60 + 14,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'sba-u17-bronze',
    name: 'SBA u17 Bronze October',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U17'],
    dateLines: ['10 Oct', '2026'],
    drivingMinutes: 1 * 60 + 55,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'all-stars-u13',
    name: 'All Stars u13 Bronze Oct',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U13'],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 3 * 60 + 26,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'essex-u13-bronze',
    name: 'Essex U13 Bronze 2026',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U13'],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 1 * 60 + 2,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'essex-u17-silver',
    name: 'Essex U17 Silver Oct 2026',
    level: 'Silver',
    family: 'junior',
    ageIds: ['U17'],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 1 * 60 + 2,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'swindon-u19-bronze',
    name: 'Swindon Stars U19 Bronze October 2026',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U19'],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 2 * 60 + 29,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'herts-u15-silver',
    name: 'Herts U15 Silver',
    level: 'Silver',
    family: 'junior',
    ageIds: ['U15'],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 56,
    when: 'upcoming',
  },
  {
    id: 'yorks-u17-silver',
    name: 'Yorkshire U17 Silver 2026',
    level: 'Silver',
    family: 'junior',
    ageIds: ['U17'],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 2 * 60 + 51,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'oxon-u15-bronze',
    name: 'Oxfordshire U15 Bronze - Oct 2026',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U15'],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 1 * 60 + 57,
    when: 'upcoming',
  },
  {
    id: 'thedkway-u17',
    name: 'TheDKWay U17 Bronze',
    level: 'Bronze',
    family: 'junior',
    ageIds: ['U17'],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 1 * 60 + 26,
    when: 'upcoming',
  },
  {
    id: 'guernsey-junior-restricted',
    name: 'Guernsey Junior Restricted 2026',
    level: 'Other',
    family: 'junior',
    ageIds: [],
    dateLines: ['17 & 18', 'Oct 2026'],
    drivingMinutes: null,
    when: 'upcoming',
  },
  {
    id: 'essex-futures',
    name: 'Essex Futures - EBA 2* Oct 2026',
    level: 'Other',
    family: 'junior',
    ageIds: [],
    dateLines: ['17 Oct', '2026'],
    drivingMinutes: 58,
    when: 'upcoming',
  },
  {
    id: 'cumbria-masters-silver',
    name: '31st Cumbria Masters Silver',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['10 & 11', 'Oct 2026'],
    drivingMinutes: null,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'middlesex-masters-restricted',
    name: 'Middlesex Masters Restricted 2026',
    level: 'Other',
    family: 'masters',
    ageIds: [],
    dateLines: ['11 Oct', '2026'],
    drivingMinutes: 1 * 60 + 29,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'oxon-masters-bronze',
    name: 'Oxfordshire Masters Bronze Open 2026',
    level: 'Bronze',
    family: 'masters',
    ageIds: [],
    dateLines: ['18 Oct', '2026'],
    drivingMinutes: 1 * 60 + 57,
    when: 'upcoming',
    closesSoon: true,
  },
  {
    id: 'kent-masters-gold',
    name: 'Kent Masters Gold 2026',
    level: 'Gold',
    family: 'masters',
    ageIds: [],
    dateLines: ['23 - 25', 'Oct 2026'],
    drivingMinutes: 1 * 60 + 26,
    when: 'upcoming',
    closesSoon: true,
    entered: true,
    otherEntered: 'Alisha Johnson',
  },
  {
    id: 'northumberland-masters-silver',
    name: '2026 Northumberland Masters Silver',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['30 Oct -', '01 Nov 2026'],
    drivingMinutes: 4 * 60 + 2,
    when: 'upcoming',
  },
  {
    id: 'woe-masters-silver',
    name: 'West of England Masters Silver 2026',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['14 & 15', 'Nov 2026'],
    drivingMinutes: 3 * 60 + 8,
    when: 'upcoming',
  },
  {
    id: 'english-national-masters',
    name: '31st English National Masters Championship 2026',
    level: 'Other',
    family: 'masters',
    ageIds: [],
    dateLines: ['27 - 29', 'Nov 2026'],
    drivingMinutes: 56,
    when: 'upcoming',
  },
  {
    id: 'lancs-masters-silver',
    name: 'Lancashire Masters Silver 2027',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['30 & 31', 'Jan 2027'],
    drivingMinutes: 3 * 60 + 20,
    when: 'upcoming',
  },
  {
    id: 'hants-masters-silver',
    name: 'Hampshire Masters Silver 2027',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['13 & 14', 'Feb 2027'],
    drivingMinutes: 2 * 60 + 16,
    when: 'upcoming',
  },
  {
    id: 'yorks-masters-gold',
    name: 'YORKSHIRE MASTERS GOLD 2027',
    level: 'Gold',
    family: 'masters',
    ageIds: [],
    dateLines: ['26 - 28', 'Feb 2027'],
    drivingMinutes: 2 * 60 + 51,
    when: 'upcoming',
  },
  {
    id: 'yonex-all-england',
    name: '109th YONEX All England Seniors (Masters) Championships 2027',
    level: 'Other',
    family: 'masters',
    ageIds: [],
    dateLines: ['16 - 18', 'Apr 2027'],
    drivingMinutes: 56,
    when: 'upcoming',
  },
  {
    id: 'somerset-masters-bronze',
    name: 'Somerset Masters Bronze 2027',
    level: 'Bronze',
    family: 'masters',
    ageIds: [],
    dateLines: ['05 Jun', '2027'],
    drivingMinutes: 3 * 60 + 50,
    when: 'upcoming',
  },
  {
    id: 'leicester-masters-silver',
    name: 'Masters Silver Leicestershire',
    level: 'Silver',
    family: 'masters',
    ageIds: [],
    dateLines: ['04 & 05', 'Sept 2027'],
    drivingMinutes: 1 * 60 + 34,
    when: 'upcoming',
  },
]

function formatDrive(minutes: number | null): string {
  if (minutes == null) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}:${String(mins).padStart(2, '0')}`
}

function ageIsSelected(selected: string[], ageId: string): boolean {
  if (selected.includes(ageId)) return true
  return ageId !== JUNIOR_OTHER_ID && JUNIOR_AGES_INSIDE_OTHER.includes(ageId) && selected.includes(JUNIOR_OTHER_ID)
}

function familyIsOn(selected: string[], family: ListingFamily): boolean {
  if (family === 'senior') return selected.includes(SENIOR_AGE.id)
  if (family === 'junior') return JUNIOR_AGES.some((age) => selected.includes(age.id))
  return MASTER_AGES.some((age) => selected.includes(age.id))
}

function rowMatchesAges(row: TournamentRow, selected: string[]): boolean {
  if (!familyIsOn(selected, row.family)) return false
  if (row.ageIds.length === 0) return true
  return row.ageIds.some((ageId) => ageIsSelected(selected, ageId))
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

export function TournamentListingsPage({
  open,
  onClose,
  playerName,
  onOpenAccountMenu,
  accountMenuOpen,
  onOpenTournament,
  tournamentPageOpen,
}: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const initials = getPlayerInitials(playerName)
  const {
    stage: buildStage,
    setStage: setBuildStage,
    pickerVisible,
  } = useTicketBuildPicker<TournamentListingsBuildStage>('2a', 1)
  const ageChipPlace = buildStage === '2a' ? 'title' : buildStage === '2b' ? 'type' : 'none'
  const showCards = buildStage === 3
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
      if (accountMenuOpen || tournamentPageOpen) return
      onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, typeModalOpen, ageModalOpen, accountMenuOpen, tournamentPageOpen])

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
      if (!rowMatchesAges(row, ages)) return false
      if (maxDrive != null && row.drivingMinutes != null && row.drivingMinutes > maxDrive) return false
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
      className="fixed inset-0 z-50 overflow-y-auto bg-white outline-none"
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
          <button
            type="button"
            onClick={onOpenAccountMenu}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#6d28a0] text-sm font-bold text-white"
            aria-label={`Open account menu for ${playerName}`}
          >
            {initials}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] space-y-3 px-2.5 py-3">
        {pickerVisible && (
          <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
              <div role="group" aria-label="Tournament listings ticket build stage" className="flex flex-wrap gap-1">
                {TOURNAMENT_LISTINGS_BUILD_STAGES.map((ticketStage) => {
                  const selected = buildStage === ticketStage
                  const meta = TOURNAMENT_LISTINGS_BUILD_STAGE_META[ticketStage]
                  return (
                    <button
                      key={ticketStage}
                      type="button"
                      title={meta.summary}
                      onClick={() => setBuildStage(ticketStage)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                        selected
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50'
                      }`}
                    >
                      {ticketStage}. {meta.shortLabel}
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-ink-500">
              {TOURNAMENT_LISTINGS_BUILD_STAGE_META[buildStage].summary}
            </p>
          </div>
        )}
        <section className="overflow-hidden rounded-2xl border border-[#e4e2e8] bg-white shadow-sm">
          <div className="bg-[#f2f0f6] px-4 py-4">
            <h1 id={titleId} className="text-[26px] font-bold leading-tight tracking-tight text-[#343a40]">
              Tournaments
            </h1>
          </div>

          <div className="bg-[#f8f8fc] px-4 py-4">
            <div className="grid max-w-[22rem] grid-cols-[minmax(0,1fr)_minmax(0,1fr)_7.75rem] gap-x-2">
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

          <div className="flex gap-6 border-b border-[#e6e1ef] bg-white px-4 pt-3">
            <TabButton active={when === 'upcoming'} onClick={() => setWhen('upcoming')}>
              Upcoming
            </TabButton>
            <TabButton active={when === 'past'} onClick={() => setWhen('past')}>
              Past
            </TabButton>
          </div>

          {showCards ? null : (
            <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.25rem_2.8rem] gap-x-2 px-4 py-3 text-[15px] font-bold text-ink-900">
              <span>Name</span>
              <span className="text-left">Type</span>
              <span>Date</span>
              <span>Driving</span>
            </div>
          )}
          <ul
            className={
              showCards
                ? 'grid grid-cols-[4.75rem_minmax(0,16rem)_auto_minmax(0,1fr)] gap-x-3 divide-y divide-[#ece8f3] bg-white'
                : 'divide-y divide-[#ece8f3]'
            }
          >
            {rows.map((row) =>
              showCards ? (
                <TournamentCardRow key={row.id} row={row} onOpen={onOpenTournament} />
              ) : (
                <TournamentListRow key={row.id} row={row} ageChipPlace={ageChipPlace} />
              ),
            )}
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

function TournamentCardRow({ row, onOpen }: { row: TournamentRow; onOpen: () => void }) {
  const { text, chips } = listingTitleWithAgeChips(row.name, row.family, row.ageIds)
  const words = text.trim().split(/\s+/)
  const lastWord = words.pop() ?? ''
  const lead = words.join(' ')
  return (
    <li className="col-span-4 grid grid-cols-subgrid bg-white">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${text}`}
        className="col-span-4 grid grid-cols-subgrid items-start px-4 py-3 text-left hover:bg-[#f4f1f8]"
      >
        <div className="pt-0.5">
          <TournamentCategoryChip label={row.level} />
        </div>
        <div className="min-w-0">
          <p className="text-[16px] font-semibold leading-snug tracking-tight text-ink-900">
            {lead ? <span>{lead} </span> : null}
            <span className="whitespace-nowrap">
              <span>{lastWord}</span>
              {row.entryClosed && (
                <span className="ml-1.5 inline-block align-[-2px] text-[#5b2d91]" aria-label="Entry closed">
                  <LockIcon />
                </span>
              )}
              {row.closesSoon && (
                <span className="ml-1.5 inline-block align-[-2px] text-[#5b2d91]" aria-label="Entry closes soon">
                  <ClockIcon />
                </span>
              )}
            </span>
          </p>
          {chips.length > 0 && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1">
              {chips.map((chip) => (
                <CompetitionAgeChip key={chip} label={chip} />
              ))}
            </div>
          )}
          {row.entered && (
            <p className="mt-1.5 flex items-center gap-1 text-[13px] leading-snug text-[#1d8a32]">
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
          {row.otherEntered && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-snug text-[#1d8a32]">
              <CheckIcon />
              <span>{row.otherEntered} entered.</span>
            </p>
          )}
        </div>
        <div className="text-left">
          <p className="text-[14px] leading-tight text-ink-900">
            {row.dateLines.map((line) => (
              <span key={line} className="block text-left">
                {line}
              </span>
            ))}
          </p>
          {row.drivingMinutes != null && (
            <p className="mt-1 flex items-center justify-start gap-1 text-[13px] text-[#4c2a86]">
              <CarIcon />
              <span>{formatDrive(row.drivingMinutes)}</span>
            </p>
          )}
        </div>
        <span className="justify-self-end self-center text-[#6b6578]" aria-hidden>
          <ChevronRight />
        </span>
      </button>
    </li>
  )
}

function CarIcon() {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-5 shrink-0 bg-current [mask-image:url(/drive-car.png)] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-image:url(/drive-car.png)] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain]"
    />
  )
}

function TournamentListRow({
  row,
  ageChipPlace,
}: {
  row: TournamentRow
  ageChipPlace: 'none' | 'title' | 'type'
}) {
  const titled = ageChipPlace === 'none' ? null : listingTitleWithAgeChips(row.name, row.family, row.ageIds)
  const title = titled?.text ?? row.name
  const chips = titled?.chips ?? []
  const words = title.trim().split(/\s+/)
  const lastWord = words.pop() ?? ''
  const lead = words.join(' ')
  return (
    <li className="px-4 py-3">
      <div className="grid grid-cols-[minmax(0,1fr)_5.5rem_4.25rem_2.8rem] items-start gap-x-2">
        <div className="min-w-0">
          <p className="text-[15px] font-medium leading-snug text-[#4c2a86]">
            {lead ? (
              <span className="underline decoration-[#4c2a86] underline-offset-2">{lead} </span>
            ) : null}
            <span className="whitespace-nowrap">
              <span className="underline decoration-[#4c2a86] underline-offset-2">{lastWord}</span>
              {ageChipPlace === 'title' &&
                chips.map((chip) => (
                  <CompetitionAgeChip key={chip} label={chip} className="ml-1.5 align-middle" />
                ))}
              {row.entryClosed && (
                <span className="ml-1.5 inline-block align-[-2px] text-[#5b2d91]" aria-label="Entry closed">
                  <LockIcon />
                </span>
              )}
              {row.closesSoon && (
                <span className="ml-1.5 inline-block align-[-2px] text-[#5b2d91]" aria-label="Entry closes soon">
                  <ClockIcon />
                </span>
              )}
            </span>
          </p>
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
          {row.otherEntered && (
            <p className="mt-0.5 flex items-center gap-1 text-[13px] leading-snug text-[#1d8a32]">
              <CheckIcon />
              <span>{row.otherEntered} entered.</span>
            </p>
          )}
        </div>
        <div className="flex w-fit flex-col items-start gap-1">
          <TournamentCategoryChip label={row.level} />
          {ageChipPlace === 'type' &&
            chips.map((chip) => <CompetitionAgeChip key={chip} label={chip} />)}
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
    </li>
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

function ChevronRight() {
  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
      <path
        d="M5.2 2.8 11 8l-5.8 5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
