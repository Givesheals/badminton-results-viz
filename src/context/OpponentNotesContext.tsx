import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react'
import { useOpponentNotes } from '../hooks/useOpponentNotes'
import type {
  OpponentNote,
  OpponentNoteMatchContext,
  OpponentNoteTarget,
} from '../lib/opponentNotes'
import type { SelectableDisciplineFamily } from '../lib/disciplineStyle'
import type { MatchJournalFields } from '../lib/opponentNotes'
import type { NoteTags } from '../lib/noteTags'
import type { CustomTagGroup } from '../lib/customNoteTags'

type OpponentNotesContextValue = {
  playerName: string | null
  allNotes: OpponentNote[]
  getNotesForMatch: (matchKey: string) => OpponentNote[]
  hasNotesForMatch: (matchKey: string) => boolean
  getNoteForMatchTarget: (matchKey: string, target: OpponentNoteTarget) => OpponentNote | null
  notesForOpponent: (opponentName: string) => OpponentNote[]
  upsertNote: (
    context: OpponentNoteMatchContext,
    body: string,
    target: OpponentNoteTarget,
    appliesToDisciplineFamilies: SelectableDisciplineFamily[],
    tags?: NoteTags,
    matchJournal?: MatchJournalFields,
    appliesToDisciplineCodes?: string[],
  ) => void
  deleteNote: (id: string) => void
  renameCustomTagEverywhere: (group: CustomTagGroup, oldLabel: string, newLabel: string) => void
  removeCustomTagEverywhere: (group: CustomTagGroup, label: string) => void
}

const OpponentNotesContext = createContext<OpponentNotesContextValue | null>(null)

export function OpponentNotesProvider({
  playerName,
  children,
}: {
  playerName: string | null
  children: ReactNode
}) {
  const value = useOpponentNotes(playerName)
  const memoized = useMemo(
    () => ({ ...value, playerName }),
    [value, playerName],
  )
  return (
    <OpponentNotesContext.Provider value={memoized}>{children}</OpponentNotesContext.Provider>
  )
}

export function useOpponentNotesContext(): OpponentNotesContextValue {
  const ctx = useContext(OpponentNotesContext)
  if (ctx == null) {
    throw new Error('useOpponentNotesContext must be used within OpponentNotesProvider')
  }
  return ctx
}
