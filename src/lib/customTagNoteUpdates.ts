import type { CustomTagGroup } from './customNoteTags'
import { normalizeCustomTagLabel, normalizeCustomTagList } from './customNoteTags'
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

function getCustomTags(note: OpponentNote, group: CustomTagGroup): string[] {
  const field = CUSTOM_TAG_FIELD[group]
  return normalizeCustomTagList(note.tags?.[field] as string[] | undefined)
}

export function countNotesWithCustomTag(
  notes: OpponentNote[],
  group: CustomTagGroup,
  label: string,
): number {
  return notes.filter((note) => getCustomTags(note, group).some((tag) => tagsMatch(tag, label)))
    .length
}

function updateNoteCustomTags(
  note: OpponentNote,
  group: CustomTagGroup,
  mapTags: (tags: string[]) => string[],
): OpponentNote | null {
  const field = CUSTOM_TAG_FIELD[group]
  const current = getCustomTags(note, group)
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
