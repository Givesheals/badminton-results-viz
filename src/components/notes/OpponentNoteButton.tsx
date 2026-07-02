import { useState } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import type { OpponentNoteMatchContext } from '../../lib/opponentNotes'
import {
  FileCirclePlusIcon,
  FilePenIcon,
  OPPONENT_NOTE_ICON_BUTTON_CLASS,
} from './OpponentNoteIcons'
import { OpponentNoteModal } from './OpponentNoteModal'

type Props = {
  context: OpponentNoteMatchContext
  className?: string
}

export function OpponentNoteButton({ context, className = '' }: Props) {
  const { hasNotesForMatch } = useOpponentNotesContext()
  const [open, setOpen] = useState(false)
  const hasNote = hasNotesForMatch(context.matchKey)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={hasNote ? 'Edit match notes' : 'Add match notes'}
        title={hasNote ? 'Edit match notes' : 'Add match notes'}
        className={`${OPPONENT_NOTE_ICON_BUTTON_CLASS} ${className}`.trim()}
      >
        {hasNote ? (
          <FilePenIcon className="h-4 w-4" />
        ) : (
          <FileCirclePlusIcon className="h-4 w-4" />
        )}
      </button>
      <OpponentNoteModal open={open} onClose={() => setOpen(false)} context={context} />
    </>
  )
}
