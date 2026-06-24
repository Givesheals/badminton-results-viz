import type { MatchOutcome } from '../types/matchHistory'
import type { NormalizedMatch } from '../types/matchHistory'
import { getOpponentTeamMembersFromRow } from './matchTeams'
import { recapMatchKey } from './tournamentRecap'
import { formatMatchStageLabel, getMatchRound } from './tournamentProgression'

export type OpponentNoteTarget =
  | { kind: 'pair' }
  | { kind: 'opponent'; name: string }

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

export type OpponentNote = {
  id: string
  body: string
  target: OpponentNoteTarget
  context: OpponentNoteMatchContext
  createdAt: string
  updatedAt: string
}

const STORAGE_PREFIX = 'opponent-notes:'

export function opponentNotesStorageKey(playerName: string): string {
  return `${STORAGE_PREFIX}${playerName.trim().toLowerCase()}`
}

export function defaultNoteTarget(opponentNames: string[]): OpponentNoteTarget {
  if (opponentNames.length === 1) {
    return { kind: 'opponent', name: opponentNames[0]! }
  }
  return { kind: 'pair' }
}

export function noteTargetKey(target: OpponentNoteTarget): string {
  if (target.kind === 'pair') return 'pair'
  return `opponent:${target.name}`
}

export function noteTargetsEqual(a: OpponentNoteTarget, b: OpponentNoteTarget): boolean {
  return noteTargetKey(a) === noteTargetKey(b)
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

export function noteMatchesOpponent(note: OpponentNote, opponentName: string): boolean {
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
  return getNotesForMatch(notes, matchKey).length > 0
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

export function upsertNote(
  notes: OpponentNote[],
  context: OpponentNoteMatchContext,
  body: string,
  target: OpponentNoteTarget,
): OpponentNote[] {
  const trimmed = body.trim()
  if (trimmed === '') {
    return notes.filter(
      (note) =>
        !(
          note.context.matchKey === context.matchKey && noteTargetsEqual(note.target, target)
        ),
    )
  }

  const now = new Date().toISOString()
  const existing = getNoteForMatchTarget(notes, context.matchKey, target)

  if (existing != null) {
    return notes.map((note) =>
      note.id === existing.id
        ? { ...note, body: trimmed, context, updatedAt: now }
        : note,
    )
  }

  const created: OpponentNote = {
    id: crypto.randomUUID(),
    body: trimmed,
    target,
    context,
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
  if (note.target.kind === 'pair') return true
  if (note.target.kind === 'opponent') return true
  return false
}

export function serializeNotes(notes: OpponentNote[]): string {
  return JSON.stringify(notes)
}

export function formatNoteTargetLabel(target: OpponentNoteTarget): string {
  if (target.kind === 'pair') return 'The pair'
  return target.name
}

export type OpponentNoteGroup = {
  opponentName: string
  notes: OpponentNote[]
}

/** Groups notes under each opponent they relate to (including pair notes under both names). */
export function groupNotesByOpponent(notes: OpponentNote[]): OpponentNoteGroup[] {
  const opponentNames = new Set<string>()
  for (const note of notes) {
    if (note.target.kind === 'opponent') opponentNames.add(note.target.name)
    for (const name of note.context.opponentNames) opponentNames.add(name)
  }

  return [...opponentNames]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((opponentName) => ({
      opponentName,
      notes: sortNotesNewestFirst(
        notes.filter((note) => noteMatchesOpponent(note, opponentName)),
      ),
    }))
    .filter((group) => group.notes.length > 0)
}

export function formatNoteScopeInGroup(
  note: OpponentNote,
  _groupOpponentName: string,
): { label: string; detail?: string } {
  if (note.target.kind === 'opponent') {
    return { label: 'About this player' }
  }
  return {
    label: 'About the pair',
    detail: note.context.opponentsDisplay,
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
  const haystack = [
    note.body,
    note.context.competitionName,
    note.context.opponentsDisplay,
    note.context.partnerName ?? '',
    note.context.disciplineLabel,
    formatNoteTargetLabel(note.target),
    ...note.context.opponentNames,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(q)
}
