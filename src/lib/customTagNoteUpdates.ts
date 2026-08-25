import type { CustomTagGroup } from './customNoteTags'
import {
  isScoutingTagGroup,
  normalizeCustomTagLabel,
  normalizeCustomTagList,
} from './customNoteTags'
import { normalizeNoteTags, type NoteTags } from './noteTags'
import type { OpponentNote } from './opponentNotes'

const CUSTOM_TAG_FIELD: Record<CustomTagGroup, keyof NoteTags> = {
  opponentStyles: 'customOpponentStyles',
  pairStyles: 'customPairStyles',
  selfFeel: 'customSelfFeel',
  gameEvents: 'customGameEvents',
}

function tagsMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

function getCustomTagsForField(note: OpponentNote, field: keyof NoteTags): string[] {
  return normalizeCustomTagList(note.tags?.[field] as string[] | undefined)
}

function getCustomTags(note: OpponentNote, group: CustomTagGroup): string[] {
  if (isScoutingTagGroup(group)) {
    return normalizeCustomTagList([
      ...getCustomTagsForField(note, 'customOpponentStyles'),
      ...getCustomTagsForField(note, 'customPairStyles'),
    ])
  }
  return getCustomTagsForField(note, CUSTOM_TAG_FIELD[group])
}

export function countNotesWithCustomTag(
  notes: OpponentNote[],
  group: CustomTagGroup,
  label: string,
): number {
  return notes.filter((note) => getCustomTags(note, group).some((tag) => tagsMatch(tag, label)))
    .length
}

const TAG_USAGE_NAMED_SUBJECT_LIMIT = 2

function noteSubjectLabel(note: OpponentNote): string {
  if (note.target.kind === 'opponent') {
    const name = note.target.name.trim()
    if (name !== '') return name
  }

  const display = note.context.opponentsDisplay.trim()
  if (display !== '') return display

  return note.context.opponentNames
    .map((name) => name.trim())
    .filter((name) => name !== '')
    .join(' & ')
}

/** Unique people/pairs the tag is filed under, A–Z. Pair notes count as one subject. */
export function uniqueSubjectsForCustomTag(
  notes: OpponentNote[],
  group: CustomTagGroup,
  label: string,
): string[] {
  const seen = new Map<string, string>()
  for (const note of notes) {
    if (!getCustomTags(note, group).some((tag) => tagsMatch(tag, label))) continue
    const subject = noteSubjectLabel(note)
    if (subject === '') continue
    const key = subject.toLowerCase()
    if (!seen.has(key)) seen.set(key, subject)
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))
}

export function formatCustomTagUsageSentence(
  noteCount: number,
  subjects: string[],
): string {
  const noteWord = noteCount === 1 ? 'note' : 'notes'
  const base = `This tag is on ${noteCount} saved ${noteWord}`
  if (subjects.length === 0) return `${base}.`

  let listed: string
  if (subjects.length === 1) {
    listed = subjects[0]!
  } else if (subjects.length === 2) {
    listed = `${subjects[0]} and ${subjects[1]}`
  } else {
    const extra = subjects.length - TAG_USAGE_NAMED_SUBJECT_LIMIT
    listed = `${subjects[0]}, ${subjects[1]}, and ${extra} more`
  }
  return `${base} (${listed}).`
}

function updateNoteCustomField(
  note: OpponentNote,
  field: keyof NoteTags,
  mapTags: (tags: string[]) => string[],
): OpponentNote | null {
  const current = getCustomTagsForField(note, field)
  const nextTags = normalizeCustomTagList(mapTags(current))

  const unchanged =
    current.length === nextTags.length && current.every((tag, index) => tag === nextTags[index])
  if (unchanged) return null

  const mergedTags = normalizeNoteTags({
    ...note.tags,
    [field]: nextTags.length > 0 ? nextTags : undefined,
  })

  return {
    ...note,
    tags: mergedTags,
    updatedAt: new Date().toISOString(),
  }
}

function updateNoteCustomTags(
  note: OpponentNote,
  group: CustomTagGroup,
  mapTags: (tags: string[]) => string[],
): OpponentNote | null {
  if (isScoutingTagGroup(group)) {
    let current: OpponentNote = note
    let changed = false
    for (const field of ['customOpponentStyles', 'customPairStyles'] as const) {
      const updated = updateNoteCustomField(current, field, mapTags)
      if (updated != null) {
        current = updated
        changed = true
      }
    }
    return changed ? current : null
  }

  return updateNoteCustomField(note, CUSTOM_TAG_FIELD[group], mapTags)
}

export function renameCustomTagOnAllNotes(
  notes: OpponentNote[],
  group: CustomTagGroup,
  oldLabel: string,
  newLabel: string,
): OpponentNote[] {
  const normalizedNew = normalizeCustomTagLabel(newLabel)
  if (normalizedNew == null) return notes

  return notes.map((note) => {
    const updated = updateNoteCustomTags(note, group, (tags) =>
      tags.map((tag) => (tagsMatch(tag, oldLabel) ? normalizedNew : tag)),
    )
    return updated ?? note
  })
}

export function removeCustomTagFromAllNotes(
  notes: OpponentNote[],
  group: CustomTagGroup,
  label: string,
): OpponentNote[] {
  return notes.map((note) => {
    const updated = updateNoteCustomTags(note, group, (tags) =>
      tags.filter((tag) => !tagsMatch(tag, label)),
    )
    return updated ?? note
  })
}
