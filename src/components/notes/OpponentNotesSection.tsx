import { useMemo, useState } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import {
  formatGameEventTagsForDisplay,
  formatScoutingTagsForDisplay,
  formatSelfFeelTagsForDisplay,
} from '../../lib/noteTags'
import {
  getNotesBuildFeatures,
  NOTES_BUILD_STAGE_META,
  NOTES_BUILD_STAGES,
  type NotesBuildFeatures,
  type NotesBuildStage,
} from '../../lib/notesBuildStage'
import {
  countMeetingsByOpponentName,
  formatOpponentMeetingsLabel,
  formatOpponentNotesLabel,
} from '../../lib/opponentNoteIdentity'
import {
  buildDirectNoteContext,
  collectKnownOpponentNames,
  formatIsoTimestampShort,
  formatNoteRecordedSummary,
  formatNoteScopeInGroup,
  getMatchJournalFields,
  getMatchJournalNotes,
  groupNotesByOpponent,
  isDirectNoteContext,
  isScoutingNote,
  MATCH_JOURNAL_UI_ENABLED,
  noteMatchesSearch,
  type OpponentNote,
  type OpponentNoteGroup,
  type OpponentNoteMatchContext,
} from '../../lib/opponentNotes'
import { recapMatchKey } from '../../lib/tournamentRecap'
import type { NormalizedMatch } from '../../types/matchHistory'
import {
  FileCirclePlusIcon,
  FilePenIcon,
  OPPONENT_NOTE_ICON_BUTTON_CLASS,
} from './OpponentNoteIcons'
import { NoteTagChips } from './NoteTagPicker'
import { OpponentNoteMatchFooter } from './OpponentNoteMatchFooter'
import { OpponentNoteModal } from './OpponentNoteModal'
import { OpponentPickerModal } from './OpponentPickerModal'
import { OpponentRatingChips } from './OpponentRatingChips'
import { YourTagsSection } from './YourTagsSection'

const MATCH_RESULT_TOGGLE_CLASS =
  'inline-flex items-center gap-1 text-left text-xs font-medium text-brand-600 underline decoration-brand-600 underline-offset-2 transition hover:text-brand-700 hover:decoration-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

type Props = {
  allMatches: NormalizedMatch[]
}

type AddNoteState =
  | { step: 'closed' }
  | { step: 'pick-opponent' }
  | { step: 'compose'; context: OpponentNoteMatchContext; fromPicker?: boolean }

function NoteEntry({
  note,
  groupOpponentName,
  match,
  onOpen,
  features,
}: {
  note: OpponentNote
  groupOpponentName: string
  match: NormalizedMatch | null
  onOpen: () => void
  features: NotesBuildFeatures
}) {
  const [matchOpen, setMatchOpen] = useState(false)
  const scope = formatNoteScopeInGroup(note, groupOpponentName, { context: 'notes-list' })
  const isPairScope = scope.kind === 'pair'
  const matchDetailsId = `note-match-${note.id}`
  const isDirectNote = isDirectNoteContext(note.context)
  const tagLabels = formatScoutingTagsForDisplay(note.tags)
  const hasBody = note.body.trim() !== ''

  const pairScopeLine =
    isPairScope
      ? scope.secondary != null && scope.secondary !== ''
        ? `${scope.primary} · ${scope.secondary}`
        : scope.primary
      : null

  const recordedSummary = features.showEdit
    ? formatNoteRecordedSummary(note)
    : `Recorded ${formatIsoTimestampShort(note.createdAt)}`

  const showMatchResultToggle = features.showMatchResult && !isDirectNote

  return (
    <li className="px-3 py-2.5">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          {features.showTagsOnNotes && tagLabels.length > 0 && (
            <NoteTagChips labels={tagLabels} />
          )}
          {hasBody && (
            <p className="text-sm leading-relaxed text-ink-900">
              <span aria-hidden="true">&ldquo;</span>
              {note.body}
              <span aria-hidden="true">&rdquo;</span>
            </p>
          )}
        </div>
        {features.showEdit && (
          <button
            type="button"
            onClick={onOpen}
            aria-label="Edit note"
            title="Edit note"
            className={OPPONENT_NOTE_ICON_BUTTON_CLASS}
          >
            <FilePenIcon className="h-4 w-4" />
          </button>
        )}
      </div>
      {features.showPairScope && pairScopeLine != null && (
        <p className="mt-1.5 text-xs text-ink-600">{pairScopeLine}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
        <span>{recordedSummary}</span>
        {showMatchResultToggle && (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setMatchOpen((value) => !value)}
              aria-expanded={matchOpen}
              aria-controls={matchDetailsId}
              className={MATCH_RESULT_TOGGLE_CLASS}
            >
              <span>{matchOpen ? 'Hide match result' : 'View match result'}</span>
              <ChevronIcon open={matchOpen} className="h-3 w-3 text-brand-600" />
            </button>
          </>
        )}
      </div>
      {showMatchResultToggle && matchOpen && (
        <div id={matchDetailsId} className="mt-1.5">
          <OpponentNoteMatchFooter context={note.context} match={match} />
        </div>
      )}
    </li>
  )
}

function MatchJournalEntry({
  note,
  match,
  onOpen,
}: {
  note: OpponentNote
  match: NormalizedMatch | null
  onOpen: () => void
}) {
  const [matchOpen, setMatchOpen] = useState(false)
  const matchDetailsId = `journal-match-${note.id}`
  const journal = getMatchJournalFields(note)
  const selfFeelLabels = formatSelfFeelTagsForDisplay(note.tags)
  const gameEventLabels = formatGameEventTagsForDisplay(note.tags)
  const hasSelfReflection = journal.selfReflection !== ''
  const hasGameEvents = journal.gameEvents !== ''

  return (
    <li className="px-3 py-2.5">
      <p className="mb-1 text-xs font-medium text-ink-600">
        {note.context.competitionName}
        <span className="font-normal text-ink-500"> · vs {note.context.opponentsDisplay}</span>
      </p>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1 space-y-3">
          {(hasSelfReflection || selfFeelLabels.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-600">How I played</p>
              {selfFeelLabels.length > 0 && <NoteTagChips labels={selfFeelLabels} />}
              {hasSelfReflection && (
                <p className="text-sm leading-relaxed text-ink-900">
                  <span aria-hidden="true">&ldquo;</span>
                  {journal.selfReflection}
                  <span aria-hidden="true">&rdquo;</span>
                </p>
              )}
            </div>
          )}
          {(hasGameEvents || gameEventLabels.length > 0) && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-ink-600">What happened</p>
              {gameEventLabels.length > 0 && <NoteTagChips labels={gameEventLabels} />}
              {hasGameEvents && (
                <p className="text-sm leading-relaxed text-ink-900">
                  <span aria-hidden="true">&ldquo;</span>
                  {journal.gameEvents}
                  <span aria-hidden="true">&rdquo;</span>
                </p>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onOpen}
          aria-label="Edit game note"
          title="Edit game note"
          className={OPPONENT_NOTE_ICON_BUTTON_CLASS}
        >
          <FilePenIcon className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-500">
        <span>{formatNoteRecordedSummary(note)}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => setMatchOpen((value) => !value)}
          aria-expanded={matchOpen}
          aria-controls={matchDetailsId}
          className={MATCH_RESULT_TOGGLE_CLASS}
        >
          <span>{matchOpen ? 'Hide match result' : 'View match result'}</span>
          <ChevronIcon open={matchOpen} className="h-3 w-3 text-brand-600" />
        </button>
      </div>
      {matchOpen && (
        <div id={matchDetailsId} className="mt-1.5">
          <OpponentNoteMatchFooter context={note.context} match={match} />
        </div>
      )}
    </li>
  )
}

function MatchJournalSection({
  notes,
  matchByKey,
  onOpenNote,
}: {
  notes: OpponentNote[]
  matchByKey: Map<string, NormalizedMatch>
  onOpenNote: (note: OpponentNote) => void
}) {
  const [open, setOpen] = useState(true)

  if (notes.length === 0) return null

  return (
    <section className="overflow-hidden rounded-xl card-frame bg-white">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <h4 className="text-base font-semibold text-ink-900">Match journal</h4>
          <p className="text-xs text-ink-500">
            {notes.length} game note{notes.length === 1 ? '' : 's'}
          </p>
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && (
        <ul className="border-t border-ink-100">
          {notes.map((note) => (
            <MatchJournalEntry
              key={note.id}
              note={note}
              match={matchByKey.get(note.context.matchKey) ?? null}
              onOpen={() => onOpenNote(note)}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

function OpponentNoteGroupSection({
  group,
  matchByKey,
  meetings,
  onOpenNote,
  onAddNote,
  features,
}: {
  group: OpponentNoteGroup
  matchByKey: Map<string, NormalizedMatch>
  meetings: number
  onOpenNote: (note: OpponentNote) => void
  onAddNote: (opponentName: string) => void
  features: NotesBuildFeatures
}) {
  const [open, setOpen] = useState(false)
  const playedLabel = formatOpponentMeetingsLabel(meetings)

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
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-500">
            <OpponentRatingChips opponentName={group.opponentName} />
            <span aria-hidden className="text-ink-300">
              ·
            </span>
            <span>{formatOpponentNotesLabel(group.notes.length)}</span>
            {playedLabel != null ? (
              <>
                <span aria-hidden className="text-ink-300">
                  ·
                </span>
                <span>{playedLabel}</span>
              </>
            ) : null}
          </div>
        </div>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="border-t border-ink-100">
          <ul>
            {group.notes.map((note) => (
              <NoteEntry
                key={`${group.opponentName}-${note.id}`}
                note={note}
                groupOpponentName={group.opponentName}
                match={matchByKey.get(note.context.matchKey) ?? null}
                onOpen={() => onOpenNote(note)}
                features={features}
              />
            ))}
          </ul>
          {features.showAddNote && (
            <button
              type="button"
              onClick={() => onAddNote(group.opponentName)}
              aria-label={`Add another note for ${group.opponentName}`}
              className="flex w-full items-center gap-2 border-t border-ink-100 px-3 py-2.5 text-left text-sm font-medium text-notes-amber-ink transition hover:bg-notes-amber-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-notes-amber/35"
            >
              <FileCirclePlusIcon className="h-4 w-4 shrink-0" />
              Add another note
            </button>
          )}
        </div>
      )}
    </section>
  )
}

function ChevronIcon({ open, className = 'h-4 w-4 text-ink-500' }: { open: boolean; className?: string }) {
  return (
    <svg
      className={`shrink-0 transition ${className} ${open ? 'rotate-180' : ''}`}
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
  const [buildStage, setBuildStage] = useState<NotesBuildStage>(11)
  const [search, setSearch] = useState('')
  const [activeNote, setActiveNote] = useState<OpponentNote | null>(null)
  const [addNoteState, setAddNoteState] = useState<AddNoteState>({ step: 'closed' })
  const [tagLibraryRevision, setTagLibraryRevision] = useState(0)

  const features = getNotesBuildFeatures(buildStage)

  function bumpTagLibraryRevision() {
    setTagLibraryRevision((value) => value + 1)
  }

  const knownOpponents = useMemo(() => collectKnownOpponentNames(allMatches), [allMatches])

  const matchByKey = useMemo(() => {
    const map = new Map<string, NormalizedMatch>()
    for (const match of allMatches) {
      map.set(recapMatchKey(match), match)
    }
    return map
  }, [allMatches])

  const meetingsByOpponent = useMemo(
    () => countMeetingsByOpponentName(allMatches),
    [allMatches],
  )

  const groups = useMemo(() => {
    const filtered = allNotes.filter((note) => noteMatchesSearch(note, search))
    return groupNotesByOpponent(filtered)
  }, [allNotes, search])

  const journalNotes = useMemo(() => {
    if (!MATCH_JOURNAL_UI_ENABLED) return []
    const filtered = allNotes.filter((note) => noteMatchesSearch(note, search))
    return getMatchJournalNotes(filtered)
  }, [allNotes, search])

  const scoutingNotes = useMemo(
    () => allNotes.filter(isScoutingNote),
    [allNotes],
  )

  const hasReviewableNotes =
    features.showNotesList &&
    (scoutingNotes.length > 0 ||
      (MATCH_JOURNAL_UI_ENABLED && allNotes.some((note) => !isScoutingNote(note))))

  const emptyHint = features.showAddNote
    ? 'Tap Add new note above, or open the Events tab and use the note icon beside a match.'
    : 'Notes you record will show up here.'

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
          <div
            role="group"
            aria-label="Notes ticket build stage"
            className="flex flex-wrap gap-1"
          >
            {NOTES_BUILD_STAGES.map((ticketStage) => {
              const selected = buildStage === ticketStage
              const meta = NOTES_BUILD_STAGE_META[ticketStage]
              return (
                <button
                  key={ticketStage}
                  type="button"
                  title={meta.summary}
                  onClick={() => setBuildStage(ticketStage)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    selected
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50'
                  }`}
                >
                  {ticketStage}. {meta.shortLabel}
                </button>
              )
            })}
          </div>
        </div>
        <p className="mt-1.5 text-[11px] text-ink-500">
          {NOTES_BUILD_STAGE_META[buildStage].summary}
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl card-frame bg-white shadow-sm">
        <div className="border-b border-ink-100 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-ink-900">Notes</h3>
            {features.showAddNote && (
              <button
                type="button"
                onClick={() => setAddNoteState({ step: 'pick-opponent' })}
                className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              >
                Add new note
              </button>
            )}
          </div>
          <p className="mt-1 text-sm text-ink-600">
            {MATCH_JOURNAL_UI_ENABLED
              ? 'Personal notes on opponents for your next draw, plus an optional match journal for how you played.'
              : 'Personal notes on opponents for your next draw.'}
          </p>
        </div>

        <div className="px-4 py-4 sm:px-5">
          {!hasReviewableNotes ? (
            <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-ink-800">No notes yet</p>
              <p className="mt-1 text-sm text-ink-600">{emptyHint}</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-ink-700">Opponent notes</h4>
                <div>
                  <label htmlFor="opponent-notes-search" className="sr-only">
                    Filter notes by opponent, competition, or note text
                  </label>
                  <input
                    id="opponent-notes-search"
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Filter notes by Opponent, competition, or note text."
                    className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
                  />
                </div>
                {groups.length === 0 ? (
                  <p className="text-sm text-ink-600">No notes match your search.</p>
                ) : (
                  <ul className="space-y-3">
                    {groups.map((group) => (
                      <li key={group.opponentName}>
                        <OpponentNoteGroupSection
                          group={group}
                          matchByKey={matchByKey}
                          meetings={
                            meetingsByOpponent.get(group.opponentName.trim().toLowerCase()) ?? 0
                          }
                          onOpenNote={setActiveNote}
                          onAddNote={(opponentName) => {
                            setAddNoteState({
                              step: 'compose',
                              context: buildDirectNoteContext(opponentName),
                            })
                          }}
                          features={features}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {MATCH_JOURNAL_UI_ENABLED && (
                <MatchJournalSection
                  notes={journalNotes}
                  matchByKey={matchByKey}
                  onOpenNote={setActiveNote}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {features.showYourTags && <YourTagsSection revision={tagLibraryRevision} />}

      {activeNote != null && features.showEdit && (
        <OpponentNoteModal
          open
          onClose={() => {
            setActiveNote(null)
            bumpTagLibraryRevision()
          }}
          context={activeNote.context}
          initialTarget={activeNote.target}
          buildFeatures={features}
        />
      )}

      {features.showAddNote && (
        <OpponentPickerModal
          open={addNoteState.step === 'pick-opponent'}
          clearSearch={addNoteState.step === 'closed'}
          onClose={() => setAddNoteState({ step: 'closed' })}
          opponents={knownOpponents}
          onSelect={(opponentName) => {
            setAddNoteState({
              step: 'compose',
              context: buildDirectNoteContext(opponentName),
              fromPicker: true,
            })
          }}
        />
      )}

      {features.showAddNote && addNoteState.step === 'compose' && (
        <OpponentNoteModal
          open
          onClose={() => {
            setAddNoteState({ step: 'closed' })
            bumpTagLibraryRevision()
          }}
          onBack={
            addNoteState.fromPicker
              ? () => setAddNoteState({ step: 'pick-opponent' })
              : undefined
          }
          context={addNoteState.context}
          initialTarget={{ kind: 'opponent', name: addNoteState.context.opponentNames[0]! }}
          buildFeatures={features}
        />
      )}
    </div>
  )
}
