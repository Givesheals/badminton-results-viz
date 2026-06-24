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
    (context: OpponentNoteMatchContext, body: string, target: OpponentNoteTarget) => {
      setNotes((prev) => upsertNoteInList(prev, context, body, target))
    },
    [],
  )

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => deleteNoteInList(prev, id))
  }, [])

  return {
    allNotes,
    getNotesForMatch: getNotesForMatchKey,
    hasNotesForMatch: hasNotesForMatchKey,
    getNoteForMatchTarget: getNoteForMatchTargetKey,
    notesForOpponent,
    upsertNote,
    deleteNote,
  }
}
