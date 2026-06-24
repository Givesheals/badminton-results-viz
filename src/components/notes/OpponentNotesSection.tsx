import { useMemo, useState } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import {
  formatNoteMatchTriggerLabel,
  formatNoteRecordedSummary,
  formatNoteScopeInGroup,
  groupNotesByOpponent,
  noteMatchesSearch,
  type OpponentNote,
  type OpponentNoteGroup,
} from '../../lib/opponentNotes'
import { recapMatchKey } from '../../lib/tournamentRecap'
import type { NormalizedMatch } from '../../types/matchHistory'
import {
  FilePenIcon,
  OPPONENT_NOTE_ICON_BUTTON_CLASS,
} from './OpponentNoteIcons'
import { OpponentNoteMatchFooter } from './OpponentNoteMatchFooter'
import { OpponentNoteModal } from './OpponentNoteModal'

type Props = {
  allMatches: NormalizedMatch[]
}

function NoteEntry({
  note,
  groupOpponentName,
  match,
  onOpen,
}: {
  note: OpponentNote
  groupOpponentName: string
  match: NormalizedMatch | null
  onOpen: () => void
}) {
  const [matchOpen, setMatchOpen] = useState(false)
  const scope = formatNoteScopeInGroup(note, groupOpponentName)
  const isPairScope = note.target.kind === 'pair'
  const matchDetailsId = `note-match-${note.id}`

  return (
    <li className="px-3 py-2.5">
      {isPairScope && (
        <p className="mb-1 text-xs text-ink-500">
          {scope.label}
          {scope.detail != null ? ` · vs ${scope.detail}` : ''}
        </p>
      )}
      <p className="text-sm leading-relaxed text-ink-900">
        <span aria-hidden="true">&ldquo;</span>
        {note.body}
        <span aria-hidden="true">&rdquo;</span>
      </p>
      <p className="mt-1.5 text-xs text-ink-500">{formatNoteRecordedSummary(note)}</p>
      <div className="mt-1.5 flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setMatchOpen((value) => !value)}
          aria-expanded={matchOpen}
          aria-controls={matchDetailsId}
          className="inline-flex min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-ink-100 bg-ink-50/70 px-2.5 py-1.5 text-left text-xs font-medium text-ink-700 transition hover:border-ink-200 hover:bg-ink-100"
        >
          <span className="min-w-0 truncate">
            {matchOpen ? 'Hide match result' : 'View match result'}
            <span className="mt-0.5 block truncate font-normal text-ink-500">
              {formatNoteMatchTriggerLabel(note.context)}
            </span>
          </span>
          <ChevronIcon open={matchOpen} className="h-3.5 w-3.5 shrink-0" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Edit note"
          title="Edit note"
          className={OPPONENT_NOTE_ICON_BUTTON_CLASS}
        >
          <FilePenIcon className="h-4 w-4" />
        </button>
      </div>
      {matchOpen && (
        <div id={matchDetailsId} className="mt-2">
          <OpponentNoteMatchFooter context={note.context} match={match} />
        </div>
      )}
    </li>
  )
}

function OpponentNoteGroupSection({
  group,
  matchByKey,
  onOpenNote,
}: {
  group: OpponentNoteGroup
  matchByKey: Map<string, NormalizedMatch>
  onOpenNote: (note: OpponentNote) => void
}) {
  const [open, setOpen] = useState(true)

  return (
    <section className="overflow-hidden rounded-xl card-frame bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-base font-semibold text-ink-900">{group.opponentName}</h4>
          <p className="text-xs text-ink-500">
            {group.notes.length} note{group.notes.length === 1 ? '' : 's'}
          </p>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="border-t border-ink-100">
          {group.notes.map((note) => (
            <NoteEntry
              key={`${group.opponentName}-${note.id}`}
              note={note}
              groupOpponentName={group.opponentName}
              match={matchByKey.get(note.context.matchKey) ?? null}
              onOpen={() => onOpenNote(note)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function ChevronIcon({ open, className = 'h-4 w-4' }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`shrink-0 text-ink-500 transition ${className} ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

export function OpponentNotesSection({ allMatches }: Props) {
  const { allNotes } = useOpponentNotesContext()
  const [search, setSearch] = useState('')
  const [activeNote, setActiveNote] = useState<OpponentNote | null>(null)

  const matchByKey = useMemo(() => {
    const map = new Map<string, NormalizedMatch>()
    for (const match of allMatches) {
      map.set(recapMatchKey(match), match)
    }
    return map
  }, [allMatches])

  const groups = useMemo(() => {
    const filtered = allNotes.filter((note) => noteMatchesSearch(note, search))
    return groupNotesByOpponent(filtered)
  }, [allNotes, search])

  return (
    <section className="overflow-hidden rounded-2xl card-frame bg-white shadow-sm">
      <div className="border-b border-ink-100 px-4 py-4 sm:px-5">
        <h3 className="text-lg font-semibold text-ink-900">Opponent notes</h3>
        <p className="mt-1 text-sm text-ink-600">
          Scouting notes grouped by opponent. Use <strong>View match result</strong> to see the
          game a note came from.
        </p>
        {allNotes.length > 0 && (
          <div className="mt-3">
            <label htmlFor="opponent-notes-search" className="sr-only">
              Search notes
            </label>
            <input
              id="opponent-notes-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by opponent, competition, or note text…"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </div>
        )}
      </div>

      <div className="px-4 py-4 sm:px-5">
        {allNotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center">
            <p className="text-sm font-medium text-ink-800">No notes yet</p>
            <p className="mt-1 text-sm text-ink-600">
              Open the Events tab and tap the note icon beside a match to capture scouting
              notes on your opponents.
            </p>
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm text-ink-600">No notes match your search.</p>
        ) : (
          <ul className="space-y-3">
            {groups.map((group) => (
              <li key={group.opponentName}>
                <OpponentNoteGroupSection
                  group={group}
                  matchByKey={matchByKey}
                  onOpenNote={setActiveNote}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {activeNote != null && (
        <OpponentNoteModal
          open
          onClose={() => setActiveNote(null)}
          context={activeNote.context}
          initialTarget={activeNote.target}
        />
      )}
    </section>
  )
}
