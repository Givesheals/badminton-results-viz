import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  deleteNote as deleteNoteInList,
  getNoteForMatchTarget,
  getNotesForMatch,
  getNotesForOpponent,
  hasNotesForMatch,
  opponentNotesStorageKey,
  parseStoredNotes,
  serializeNotes,
  sortNotesNewestFirst,
  upsertNote as upsertNoteInList,
  type OpponentNote,
  type OpponentNoteMatchContext,
  type OpponentNoteTarget,
} from '../lib/opponentNotes'
import {
  removeCustomTagFromAllNotes,
  renameCustomTagOnAllNotes,
} from '../lib/customTagNoteUpdates'
import type { CustomTagGroup } from '../lib/customNoteTags'
import type { SelectableDisciplineFamily } from '../lib/disciplineStyle'
import type { MatchJournalFields } from '../lib/opponentNotes'
import type { NoteTags } from '../lib/noteTags'

function loadNotes(storageKey: string | null): OpponentNote[] {
  if (storageKey == null || typeof window === 'undefined') return []
  return parseStoredNotes(window.localStorage.getItem(storageKey))
}

export function useOpponentNotes(playerName: string | null) {
  const storageKey = playerName ? opponentNotesStorageKey(playerName) : null

  const [loadedKey, setLoadedKey] = useState(storageKey)
  const [notes, setNotes] = useState<OpponentNote[]>(() => loadNotes(storageKey))

  if (loadedKey !== storageKey) {
    setLoadedKey(storageKey)
    setNotes(loadNotes(storageKey))
  }

  useEffect(() => {
    if (storageKey == null || typeof window === 'undefined') return
    window.localStorage.setItem(storageKey, serializeNotes(notes))
  }, [notes, storageKey])

  const allNotes = useMemo(() => sortNotesNewestFirst(notes), [notes])

  const getNotesForMatchKey = useCallback(
    (matchKey: string) => getNotesForMatch(notes, matchKey),
    [notes],
  )

  const hasNotesForMatchKey = useCallback(
    (matchKey: string) => hasNotesForMatch(notes, matchKey),
    [notes],
  )

  const getNoteForMatchTargetKey = useCallback(
    (matchKey: string, target: OpponentNoteTarget) =>
      getNoteForMatchTarget(notes, matchKey, target),
    [notes],
  )

  const notesForOpponent = useCallback(
    (opponentName: string) => sortNotesNewestFirst(getNotesForOpponent(notes, opponentName)),
    [notes],
  )

  const upsertNote = useCallback(
    (
      context: OpponentNoteMatchContext,
      body: string,
      target: OpponentNoteTarget,
      appliesToDisciplineFamilies: SelectableDisciplineFamily[],
      tags?: NoteTags,
      matchJournal?: MatchJournalFields,
      appliesToDisciplineCodes?: string[],
    ) => {
      setNotes((prev) =>
        upsertNoteInList(
          prev,
          context,
          body,
          target,
          appliesToDisciplineFamilies,
          tags,
          matchJournal,
          appliesToDisciplineCodes,
        ),
      )
    },
    [],
  )

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => deleteNoteInList(prev, id))
  }, [])

  const renameCustomTagEverywhere = useCallback(
    (group: CustomTagGroup, oldLabel: string, newLabel: string) => {
      setNotes((prev) => renameCustomTagOnAllNotes(prev, group, oldLabel, newLabel))
    },
    [],
  )

  const removeCustomTagEverywhere = useCallback((group: CustomTagGroup, label: string) => {
    setNotes((prev) => removeCustomTagFromAllNotes(prev, group, label))
  }, [])

  return {
    allNotes,
    getNotesForMatch: getNotesForMatchKey,
    hasNotesForMatch: hasNotesForMatchKey,
    getNoteForMatchTarget: getNoteForMatchTargetKey,
    notesForOpponent,
    upsertNote,
    deleteNote,
    renameCustomTagEverywhere,
    removeCustomTagEverywhere,
  }
}
