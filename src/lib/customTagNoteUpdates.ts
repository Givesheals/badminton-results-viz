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
