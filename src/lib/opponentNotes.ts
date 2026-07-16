import type { MatchOutcome } from '../types/matchHistory'
import type { NormalizedMatch } from '../types/matchHistory'
import { DISCIPLINE_LABELS } from '../types/matchHistory'
import {
  DISCIPLINE_FAMILY_LABELS,
  getDisciplineFamily,
  SELECTABLE_DISCIPLINE_FAMILIES,
  type SelectableDisciplineFamily,
} from './disciplineStyle'
import { getOpponentTeamMembersFromRow } from './matchTeams'
import {
  formatJournalTagsForDisplay,
  formatNoteTagsForDisplay,
  noteHasContent,
  noteHasJournalTagContent,
  normalizeNoteTags,
  type NoteTags,
} from './noteTags'
import { recapMatchKey } from './tournamentRecap'
import { formatMatchStageLabel, getMatchRound } from './tournamentProgression'

export type { NoteTags } from './noteTags'

export type OpponentNoteTarget =
  | { kind: 'pair' }
  | { kind: 'opponent'; name: string }
  | { kind: 'match' }

export const MATCH_NOTE_TARGET: OpponentNoteTarget = { kind: 'match' }

/**
 * MVP: match journal ("My game") UI is hidden. Data model, persistence, and
 * component code remain — flip this to `true` to restore the tab and Notes
 * review section.
 */
export const MATCH_JOURNAL_UI_ENABLED = false

export function isMatchNoteTarget(target: OpponentNoteTarget): boolean {
  return target.kind === 'match'
}

export function isScoutingNote(note: OpponentNote): boolean {
  return !isMatchNoteTarget(note.target)
}

export type OpponentNoteMatchContext = {
  matchKey: string
  competitionName: string
  tournamentCategoryLabel?: string
  date: string
  discipline: string
  disciplineLabel: string
  partnerName: string | null
  opponentNames: string[]
  opponentsDisplay: string
  roundLabel: string | null
  outcome: MatchOutcome
  scoreSummary: string
}

export type MatchJournalFields = {
  selfReflection?: string
  gameEvents?: string
}

export type OpponentNote = {
  id: string
  body: string
  target: OpponentNoteTarget
  context: OpponentNoteMatchContext
  /** Discipline codes this note applies to when facing the opponent. Optional for legacy notes. */
  appliesToDisciplines?: string[]
  /** Optional tap-to-select tags (scouting styles or journal context). */
  tags?: NoteTags
  /** Split journal text for match notes (self vs game events). */
  matchJournal?: MatchJournalFields
  createdAt: string
  updatedAt: string
}

/** Stable display order for discipline scope selection. */
export const ALL_DISCIPLINE_CODES = ['MS', 'WS', 'OS', 'MD', 'WD', 'OD', 'XD'] as const

/** Discipline codes offered when scoping opponent personal notes (S / D / XD). */
export const SCOUTING_APPLIES_TO_DISCIPLINE_CODES = ['S', 'D', 'XD'] as const

export type ScoutingAppliesToDisciplineCode =
  (typeof SCOUTING_APPLIES_TO_DISCIPLINE_CODES)[number]

const SCOUTING_APPLIES_TO_SET = new Set<string>(SCOUTING_APPLIES_TO_DISCIPLINE_CODES)

const SCOUTING_SCOPE_SINGLES = new Set(['S', 'MS', 'WS', 'OS'])
const SCOUTING_SCOPE_DOUBLES = new Set(['D', 'MD', 'WD', 'OD'])

export function isScoutingAppliesToDisciplineCode(
  code: string,
): code is ScoutingAppliesToDisciplineCode {
  return SCOUTING_APPLIES_TO_SET.has(code.trim().toUpperCase())
}

/** Collapse stored or legacy discipline codes to scouting scope chips (S, D, XD). */
export function collapseToScoutingScopeCodes(codes: string[]): string[] {
  const upper = codes.map((code) => code.trim().toUpperCase())
  const result: string[] = []
  if (upper.some((code) => SCOUTING_SCOPE_SINGLES.has(code))) result.push('S')
  if (upper.some((code) => SCOUTING_SCOPE_DOUBLES.has(code))) result.push('D')
  if (upper.includes('XD')) result.push('XD')
  return result
}

export function normalizeScoutingAppliesToDisciplineCodes(codes: string[]): string[] {
  const collapsed = collapseToScoutingScopeCodes(codes)
  return SCOUTING_APPLIES_TO_DISCIPLINE_CODES.filter((code) => collapsed.includes(code))
}

export function filterScoutingAppliesToDisciplineCodes(codes: string[]): string[] {
  return normalizeScoutingAppliesToDisciplineCodes(codes)
}

export function mapToScoutingAppliesToCode(
  code: string,
): ScoutingAppliesToDisciplineCode | null {
  const upper = code.trim().toUpperCase()
  if (isScoutingAppliesToDisciplineCode(upper)) return upper
  if (SCOUTING_SCOPE_SINGLES.has(upper)) return 'S'
  if (SCOUTING_SCOPE_DOUBLES.has(upper)) return 'D'
  return null
}

export function defaultScoutingAppliesToDisciplineCodes(
  context: OpponentNoteMatchContext,
): string[] {
  if (isDirectNoteContext(context)) {
    return [...SCOUTING_APPLIES_TO_DISCIPLINE_CODES]
  }
  const mapped = mapToScoutingAppliesToCode(context.discipline)
  return mapped != null ? [mapped] : []
}

export function getNoteScoutingAppliesToDisciplineCodes(note: OpponentNote): string[] {
  const collapsed = normalizeScoutingAppliesToDisciplineCodes(getNoteAppliesToDisciplines(note))
  if (collapsed.length > 0) return collapsed
  return defaultScoutingAppliesToDisciplineCodes(note.context)
}

const CODES_BY_FAMILY: Record<SelectableDisciplineFamily, readonly string[]> = {
  singles: ['MS', 'WS', 'OS'],
  doubles: ['MD', 'WD', 'OD'],
  mixed: ['XD'],
}

const STORAGE_PREFIX = 'opponent-notes:'

/** Match keys for notes captured directly on the Notes tab (not from a specific game). */
export const DIRECT_NOTE_MATCH_KEY_PREFIX = 'direct\0'

export function isDirectNoteContext(context: OpponentNoteMatchContext): boolean {
  return context.matchKey.startsWith(DIRECT_NOTE_MATCH_KEY_PREFIX)
}

export function opponentNotesStorageKey(playerName: string): string {
  return `${STORAGE_PREFIX}${playerName.trim().toLowerCase()}`
}

export function defaultNoteTarget(opponentNames: string[]): OpponentNoteTarget {
  const first = opponentNames[0]
  if (first == null || first === '') {
    return { kind: 'pair' }
  }
  return { kind: 'opponent', name: first }
}

export function noteTargetKey(target: OpponentNoteTarget): string {
  if (target.kind === 'pair') return 'pair'
  if (target.kind === 'match') return 'match'
  return `opponent:${target.name}`
}

export function noteTargetsEqual(a: OpponentNoteTarget, b: OpponentNoteTarget): boolean {
  return noteTargetKey(a) === noteTargetKey(b)
}

export function normalizeAppliesToDisciplines(codes: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []
  for (const code of ALL_DISCIPLINE_CODES) {
    if (codes.includes(code) && !seen.has(code)) {
      seen.add(code)
      normalized.push(code)
    }
  }
  return normalized
}

export function disciplineCodesFromFamilies(
  families: SelectableDisciplineFamily[],
): string[] {
  const codes: string[] = []
  for (const family of SELECTABLE_DISCIPLINE_FAMILIES) {
    if (families.includes(family)) {
      codes.push(...CODES_BY_FAMILY[family])
    }
  }
  return normalizeAppliesToDisciplines(codes)
}

export function disciplineFamiliesFromCodes(codes: string[]): SelectableDisciplineFamily[] {
  const families = new Set<SelectableDisciplineFamily>()
  for (const code of normalizeAppliesToDisciplines(codes)) {
    const family = getDisciplineFamily(code)
    if (family !== 'unknown') families.add(family)
  }
  return SELECTABLE_DISCIPLINE_FAMILIES.filter((family) => families.has(family))
}

export function defaultAppliesToDisciplineFamilies(
  context: OpponentNoteMatchContext,
): SelectableDisciplineFamily[] {
  if (isDirectNoteContext(context)) {
    return [...SELECTABLE_DISCIPLINE_FAMILIES]
  }
  const family = getDisciplineFamily(context.discipline)
  return family === 'unknown' ? [] : [family]
}

export function getNoteAppliesToDisciplineFamilies(
  note: OpponentNote,
): SelectableDisciplineFamily[] {
  return disciplineFamiliesFromCodes(getNoteAppliesToDisciplines(note))
}

export function defaultAppliesToDisciplines(context: OpponentNoteMatchContext): string[] {
  return disciplineCodesFromFamilies(defaultAppliesToDisciplineFamilies(context))
}

export function getNoteAppliesToDisciplines(note: OpponentNote): string[] {
  if (note.appliesToDisciplines != null && note.appliesToDisciplines.length > 0) {
    return normalizeAppliesToDisciplines(note.appliesToDisciplines)
  }
  return defaultAppliesToDisciplines(note.context)
}

export function buildNoteContextFromMatch(match: NormalizedMatch): OpponentNoteMatchContext {
  const opponentNames = getOpponentTeamMembersFromRow(match.raw).map((m) => m.name)
  return {
    matchKey: recapMatchKey(match),
    competitionName: match.competitionName,
    tournamentCategoryLabel: match.tournamentCategoryLabel,
    date: match.date,
    discipline: match.discipline,
    disciplineLabel: match.disciplineLabel,
    partnerName: match.partnerName,
    opponentNames,
    opponentsDisplay: match.opponents,
    roundLabel: formatMatchStageLabel(getMatchRound(match)),
    outcome: match.outcome,
    scoreSummary: match.scoreSummary,
  }
}

/** Context for a note added from the Notes tab about a single opponent (no source match). */
export function buildDirectNoteContext(opponentName: string): OpponentNoteMatchContext {
  const trimmed = opponentName.trim()
  const date = new Date().toISOString().slice(0, 10)
  return {
    matchKey: `${DIRECT_NOTE_MATCH_KEY_PREFIX}${trimmed.toLowerCase()}\0${crypto.randomUUID()}`,
    competitionName: 'Direct note',
    date,
    discipline: '—',
    disciplineLabel: '—',
    partnerName: null,
    opponentNames: [trimmed],
    opponentsDisplay: trimmed,
    roundLabel: null,
    outcome: 'unknown',
    scoreSummary: '',
  }
}

/** Unique opponent names from imported match history (prototype scope for player search). */
export function collectKnownOpponentNames(matches: NormalizedMatch[]): string[] {
  const names = new Set<string>()
  for (const match of matches) {
    for (const member of getOpponentTeamMembersFromRow(match.raw)) {
      names.add(member.name)
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'en'))
}

export function noteMatchesOpponent(note: OpponentNote, opponentName: string): boolean {
  if (isMatchNoteTarget(note.target)) return false
  const normalized = opponentName.trim().toLowerCase()
  if (note.target.kind === 'opponent') {
    return note.target.name.trim().toLowerCase() === normalized
  }
  return note.context.opponentNames.some(
    (name) => name.trim().toLowerCase() === normalized,
  )
}

export function getNotesForOpponent(notes: OpponentNote[], opponentName: string): OpponentNote[] {
  return notes.filter((note) => noteMatchesOpponent(note, opponentName))
}

export function sortNotesNewestFirst(notes: OpponentNote[]): OpponentNote[] {
  return [...notes].sort((a, b) => {
    const dateCompare = b.context.date.localeCompare(a.context.date)
    if (dateCompare !== 0) return dateCompare
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function getNotesForMatch(notes: OpponentNote[], matchKey: string): OpponentNote[] {
  return notes.filter((note) => note.context.matchKey === matchKey)
}

export function hasNotesForMatch(notes: OpponentNote[], matchKey: string): boolean {
  return getNotesForMatch(notes, matchKey).some(
    (note) =>
      noteHasStoredContent(note) && (MATCH_JOURNAL_UI_ENABLED || isScoutingNote(note)),
  )
}

export function getNoteForMatchTarget(
  notes: OpponentNote[],
  matchKey: string,
  target: OpponentNoteTarget,
): OpponentNote | null {
  return (
    notes.find(
      (note) =>
        note.context.matchKey === matchKey && noteTargetsEqual(note.target, target),
    ) ?? null
  )
}

/** Returns the first note for a match, if any. Prefer getNotesForMatch or getNoteForMatchTarget. */
export function getNoteForMatch(notes: OpponentNote[], matchKey: string): OpponentNote | null {
  return getNotesForMatch(notes, matchKey)[0] ?? null
}

export function normalizeMatchJournal(
  fields?: MatchJournalFields,
): MatchJournalFields | undefined {
  if (fields == null) return undefined
  const selfReflection = fields.selfReflection?.trim() ?? ''
  const gameEvents = fields.gameEvents?.trim() ?? ''
  if (selfReflection === '' && gameEvents === '') return undefined
  return {
    ...(selfReflection !== '' ? { selfReflection } : {}),
    ...(gameEvents !== '' ? { gameEvents } : {}),
  }
}

export function getMatchJournalFields(note: OpponentNote): {
  selfReflection: string
  gameEvents: string
} {
  const selfReflection = note.matchJournal?.selfReflection?.trim() ?? ''
  const gameEvents = note.matchJournal?.gameEvents?.trim() ?? note.body.trim()
  return { selfReflection, gameEvents }
}

export function matchJournalHasContent(
  journal: { selfReflection: string; gameEvents: string },
  tags?: NoteTags,
): boolean {
  return (
    journal.selfReflection !== '' ||
    journal.gameEvents !== '' ||
    noteHasJournalTagContent(tags)
  )
}

export function upsertNote(
  notes: OpponentNote[],
  context: OpponentNoteMatchContext,
  body: string,
  target: OpponentNoteTarget,
  appliesToDisciplineFamilies: SelectableDisciplineFamily[],
  tags?: NoteTags,
  matchJournal?: MatchJournalFields,
  appliesToDisciplineCodes?: string[],
): OpponentNote[] {
  const trimmed = body.trim()
  const normalizedTags = normalizeNoteTags(tags)
  const normalizedJournal = normalizeMatchJournal(matchJournal)
  const journalFields =
    target.kind === 'match'
      ? {
          selfReflection: normalizedJournal?.selfReflection ?? '',
          gameEvents: normalizedJournal?.gameEvents ?? trimmed,
        }
      : { selfReflection: '', gameEvents: '' }

  const hasContent =
    target.kind === 'match'
      ? matchJournalHasContent(journalFields, normalizedTags)
      : noteHasContent(trimmed, normalizedTags)

  if (!hasContent) {
    return notes.filter(
      (note) =>
        !(
          note.context.matchKey === context.matchKey && noteTargetsEqual(note.target, target)
        ),
    )
  }

  const disciplines =
    target.kind === 'match'
      ? []
      : appliesToDisciplineCodes != null
        ? normalizeScoutingAppliesToDisciplineCodes(appliesToDisciplineCodes)
        : normalizeAppliesToDisciplines(disciplineCodesFromFamilies(appliesToDisciplineFamilies))
  const now = new Date().toISOString()
  const existing = getNoteForMatchTarget(notes, context.matchKey, target)

  const storedBody = target.kind === 'match' ? '' : trimmed
  const storedJournal = target.kind === 'match' ? normalizedJournal : undefined

  if (existing != null) {
    return notes.map((note) =>
      note.id === existing.id
        ? {
            ...note,
            body: storedBody,
            context,
            appliesToDisciplines: disciplines.length > 0 ? disciplines : undefined,
            tags: normalizedTags,
            matchJournal: storedJournal,
            updatedAt: now,
          }
        : note,
    )
  }

  const created: OpponentNote = {
    id: crypto.randomUUID(),
    body: storedBody,
    target,
    context,
    appliesToDisciplines: disciplines.length > 0 ? disciplines : undefined,
    tags: normalizedTags,
    matchJournal: storedJournal,
    createdAt: now,
    updatedAt: now,
  }

  return [...notes, created]
}

export function deleteNote(notes: OpponentNote[], id: string): OpponentNote[] {
  return notes.filter((note) => note.id !== id)
}

export function parseStoredNotes(raw: string | null): OpponentNote[] {
  if (raw == null || raw === '') return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidOpponentNote)
  } catch {
    return []
  }
}

function isValidOpponentNote(value: unknown): value is OpponentNote {
  if (value == null || typeof value !== 'object') return false
  const note = value as Partial<OpponentNote>
  if (typeof note.id !== 'string' || typeof note.body !== 'string') return false
  if (typeof note.createdAt !== 'string' || typeof note.updatedAt !== 'string') return false
  if (note.context == null || typeof note.context !== 'object') return false
  if (typeof note.context.matchKey !== 'string') return false
  if (note.target == null || typeof note.target !== 'object') return false
  if (note.target.kind === 'opponent' && typeof note.target.name !== 'string') return false
  if (note.appliesToDisciplines != null) {
    if (!Array.isArray(note.appliesToDisciplines)) return false
    if (!note.appliesToDisciplines.every((code) => typeof code === 'string')) return false
  }
  if (note.tags != null && typeof note.tags !== 'object') return false
  if (note.matchJournal != null && typeof note.matchJournal !== 'object') return false
  if (note.target.kind === 'pair') return true
  if (note.target.kind === 'opponent') return true
  if (note.target.kind === 'match') return true
  return false
}

export function serializeNotes(notes: OpponentNote[]): string {
  return JSON.stringify(notes)
}

export function formatNoteTargetLabel(target: OpponentNoteTarget): string {
  if (target.kind === 'pair') return 'The pair'
  if (target.kind === 'match') return 'About this game'
  return target.name
}

export function getMatchJournalNotes(notes: OpponentNote[]): OpponentNote[] {
  return sortNotesNewestFirst(notes.filter((note) => isMatchNoteTarget(note.target)))
}

export function noteHasStoredContent(note: OpponentNote): boolean {
  if (isMatchNoteTarget(note.target)) {
    return matchJournalHasContent(getMatchJournalFields(note), note.tags)
  }
  return noteHasContent(note.body, note.tags)
}

export type OpponentNoteGroup = {
  opponentName: string
  notes: OpponentNote[]
}

/** Groups notes under each opponent they relate to (including pair notes under both names). */
export function groupNotesByOpponent(notes: OpponentNote[]): OpponentNoteGroup[] {
  const scoutingNotes = notes.filter(isScoutingNote)
  const opponentNames = new Set<string>()
  for (const note of scoutingNotes) {
    if (note.target.kind === 'opponent') opponentNames.add(note.target.name)
    for (const name of note.context.opponentNames) opponentNames.add(name)
  }

  return [...opponentNames]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((opponentName) => ({
      opponentName,
      notes: sortNotesNewestFirst(
        scoutingNotes.filter((note) => noteMatchesOpponent(note, opponentName)),
      ),
    }))
    .filter((group) => group.notes.length > 0)
}

export type NoteScopeDisplay =
  | { kind: 'opponent'; label: string }
  | { kind: 'pair'; primary: string; secondary?: string }

export function isPairNoteWithDifferentDrawnPartner(
  note: OpponentNote,
  drawnCoOpponent: string | null,
): boolean {
  if (note.target.kind !== 'pair' || drawnCoOpponent == null) return false
  const normalized = drawnCoOpponent.trim().toLowerCase()
  return !note.context.opponentNames.some(
    (name) => name.trim().toLowerCase() === normalized,
  )
}

export function formatNoteScopeInGroup(
  note: OpponentNote,
  viewedOpponentName: string,
  options?: { drawnCoOpponent?: string | null; context?: 'notes-list' | 'draw-scout' },
): NoteScopeDisplay {
  if (note.target.kind === 'opponent') {
    return { kind: 'opponent', label: 'About this player' }
  }

  const pairNames = note.context.opponentsDisplay
  const differentPartner = isPairNoteWithDifferentDrawnPartner(
    note,
    options?.drawnCoOpponent ?? null,
  )

  if (differentPartner) {
    return {
      kind: 'pair',
      primary: 'Pair note — about how they played together',
      secondary: `Recorded as ${pairNames}. Different partner in this draw.`,
    }
  }

  if (options?.context === 'draw-scout') {
    return {
      kind: 'pair',
      primary: 'Pair note — about how they played together',
      secondary: pairNames,
    }
  }

  return {
    kind: 'pair',
    primary: `Pair note — not about ${viewedOpponentName} alone`,
    secondary: `About how they played together · ${pairNames}`,
  }
}

export function formatIsoTimestampShort(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatMatchDateShort(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatNoteRecordedSummary(note: OpponentNote): string {
  const recorded = formatIsoTimestampShort(note.createdAt)
  if (note.updatedAt !== note.createdAt) {
    return `Recorded ${recorded} · edited ${formatIsoTimestampShort(note.updatedAt)}`
  }
  return `Recorded ${recorded}`
}

export function formatNoteMatchTriggerLabel(context: OpponentNoteMatchContext): string {
  return `${formatMatchDateShort(context.date)} · ${context.competitionName}`
}

export function formatNoteContextSummary(context: OpponentNoteMatchContext): string {
  const parts = [
    context.competitionName,
    context.date,
    context.disciplineLabel,
    `vs ${context.opponentsDisplay}`,
  ]
  if (context.partnerName) parts.push(`with ${context.partnerName}`)
  if (context.roundLabel) parts.push(context.roundLabel)
  const outcomeLabel =
    context.outcome === 'win' ? 'Win' : context.outcome === 'loss' ? 'Loss' : null
  if (outcomeLabel) {
    parts.push(
      context.scoreSummary ? `${outcomeLabel} ${context.scoreSummary}` : outcomeLabel,
    )
  } else if (context.scoreSummary) {
    parts.push(context.scoreSummary)
  }
  return parts.join(' · ')
}

export function noteMatchesSearch(note: OpponentNote, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (q === '') return true
  const disciplineLabels = getNoteAppliesToDisciplines(note).map(
    (code) => DISCIPLINE_LABELS[code] ?? code,
  )
  const familyLabels = getNoteAppliesToDisciplineFamilies(note).map(
    (family) => DISCIPLINE_FAMILY_LABELS[family],
  )
  const journal = getMatchJournalFields(note)
  const haystack = [
    note.body,
    journal.selfReflection,
    journal.gameEvents,
    note.context.competitionName,
    note.context.opponentsDisplay,
    note.context.partnerName ?? '',
    note.context.disciplineLabel,
    formatNoteTargetLabel(note.target),
    ...note.context.opponentNames,
    ...getNoteAppliesToDisciplines(note),
    ...disciplineLabels,
    ...getNoteAppliesToDisciplineFamilies(note),
    ...familyLabels,
    ...formatNoteTagsForDisplay(note.tags),
    ...formatJournalTagsForDisplay(note.tags),
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}
