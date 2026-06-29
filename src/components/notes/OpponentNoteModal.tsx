import { useState } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import {
  DISCIPLINE_FAMILY_LABELS,
  getDisciplineFamilyStyle,
  SELECTABLE_DISCIPLINE_FAMILIES,
  type SelectableDisciplineFamily,
} from '../../lib/disciplineStyle'
import {
  defaultAppliesToDisciplineFamilies,
  defaultNoteTarget,
  getNoteAppliesToDisciplineFamilies,
  isDirectNoteContext,
  noteTargetKey,
  noteTargetsEqual,
  type OpponentNote,
  type OpponentNoteMatchContext,
  type OpponentNoteTarget,
} from '../../lib/opponentNotes'
import { Modal } from '../ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
  context: OpponentNoteMatchContext
  /** When opening from the Notes tab, start on this target. */
  initialTarget?: OpponentNoteTarget
}

function buildDraftsFromStored(
  getNotesForMatch: (matchKey: string) => OpponentNote[],
  matchKey: string,
): Record<string, string> {
  const drafts: Record<string, string> = {}
  for (const note of getNotesForMatch(matchKey)) {
    drafts[noteTargetKey(note.target)] = note.body
  }
  return drafts
}

function buildFamiliesFromStored(
  getNotesForMatch: (matchKey: string) => OpponentNote[],
  matchKey: string,
): Record<string, SelectableDisciplineFamily[]> {
  const families: Record<string, SelectableDisciplineFamily[]> = {}
  for (const note of getNotesForMatch(matchKey)) {
    families[noteTargetKey(note.target)] = getNoteAppliesToDisciplineFamilies(note)
  }
  return families
}

function TargetPicker({
  opponentNames,
  target,
  draftsByTarget,
  onChange,
}: {
  opponentNames: string[]
  target: OpponentNoteTarget
  draftsByTarget: Record<string, string>
  onChange: (target: OpponentNoteTarget) => void
}) {
  if (opponentNames.length < 2) return null

  const options: { value: OpponentNoteTarget; label: string }[] = [
    { value: { kind: 'pair' }, label: 'The pair' },
    ...opponentNames.map((name) => ({
      value: { kind: 'opponent' as const, name },
      label: name,
    })),
  ]

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-ink-600">Who is this note about?</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const selected = noteTargetsEqual(option.value, target)
          const hasDraft = (draftsByTarget[noteTargetKey(option.value)] ?? '').trim() !== ''
          return (
            <button
              key={option.label}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                selected
                  ? 'border-brand-300 bg-brand-50 text-brand-800'
                  : 'border-ink-100 bg-white text-ink-700 hover:bg-ink-50'
              }`}
            >
              {option.label}
              {hasDraft && !selected && (
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-brand-500"
                  aria-label="Has note"
                />
              )}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

function DisciplineFamilyPicker({
  selected,
  onChange,
}: {
  selected: SelectableDisciplineFamily[]
  onChange: (families: SelectableDisciplineFamily[]) => void
}) {
  function toggle(family: SelectableDisciplineFamily) {
    if (selected.includes(family)) {
      onChange(selected.filter((item) => item !== family))
    } else {
      onChange([...selected, family])
    }
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-medium text-ink-600">
        Which disciplines does this note apply to?
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {SELECTABLE_DISCIPLINE_FAMILIES.map((family) => {
          const isSelected = selected.includes(family)
          const style = getDisciplineFamilyStyle(family)
          const label = DISCIPLINE_FAMILY_LABELS[family]
          return (
            <button
              key={family}
              type="button"
              aria-pressed={isSelected}
              onClick={() => toggle(family)}
              className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                isSelected
                  ? `${style.chipClass} border-transparent`
                  : `${style.rowBgClass} border-ink-200 text-ink-700 hover:brightness-95`
              }`}
            >
              {label}
            </button>
          )
        })}
        <span className="mx-0.5 self-center text-ink-300" aria-hidden="true">
          |
        </span>
        <button
          type="button"
          onClick={() => onChange([...SELECTABLE_DISCIPLINE_FAMILIES])}
          className="px-1 py-0.5 text-xs font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => onChange([])}
          className="px-1 py-0.5 text-xs font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
        >
          Clear
        </button>
      </div>
    </fieldset>
  )
}

type FormProps = {
  context: OpponentNoteMatchContext
  initialTarget?: OpponentNoteTarget
  onClose: () => void
}

function OpponentNoteForm({ context, initialTarget, onClose }: FormProps) {
  const { getNotesForMatch, getNoteForMatchTarget, upsertNote, deleteNote } =
    useOpponentNotesContext()

  const [target, setTarget] = useState<OpponentNoteTarget>(
    () => initialTarget ?? defaultNoteTarget(context.opponentNames),
  )
  const [draftsByTarget, setDraftsByTarget] = useState<Record<string, string>>(() =>
    buildDraftsFromStored(getNotesForMatch, context.matchKey),
  )
  const [familiesByTarget, setFamiliesByTarget] = useState<
    Record<string, SelectableDisciplineFamily[]>
  >(() => buildFamiliesFromStored(getNotesForMatch, context.matchKey))

  const targetKey = noteTargetKey(target)
  const body = draftsByTarget[targetKey] ?? ''
  const existingNote = getNoteForMatchTarget(context.matchKey, target)
  const appliesToDisciplineFamilies =
    familiesByTarget[targetKey] ??
    (existingNote != null
      ? getNoteAppliesToDisciplineFamilies(existingNote)
      : defaultAppliesToDisciplineFamilies(context))
  const isDirectNote = isDirectNoteContext(context)
  const isEditing = existingNote != null || body.trim() !== ''
  const title = isEditing ? 'Edit opponent note' : 'Add opponent note'
  const canSave = body.trim() !== '' && appliesToDisciplineFamilies.length > 0

  function setBody(text: string) {
    setDraftsByTarget((prev) => ({ ...prev, [targetKey]: text }))
  }

  function setAppliesToDisciplineFamilies(families: SelectableDisciplineFamily[]) {
    setFamiliesByTarget((prev) => ({ ...prev, [targetKey]: families }))
  }

  function handleTargetChange(newTarget: OpponentNoteTarget) {
    if (noteTargetsEqual(target, newTarget)) return
    upsertNote(context, body, target, appliesToDisciplineFamilies)
    setDraftsByTarget((prev) => {
      const next = { ...prev, [targetKey]: body }
      if (body.trim() === '') delete next[targetKey]
      return next
    })
    setFamiliesByTarget((prev) => ({ ...prev, [targetKey]: appliesToDisciplineFamilies }))
    setTarget(newTarget)
  }

  function handleSave() {
    upsertNote(context, body, target, appliesToDisciplineFamilies)
    onClose()
  }

  function handleDelete() {
    if (existingNote != null) deleteNote(existingNote.id)
    setDraftsByTarget((prev) => {
      const next = { ...prev }
      delete next[targetKey]
      return next
    })
    setFamiliesByTarget((prev) => {
      const next = { ...prev }
      delete next[targetKey]
      return next
    })
    onClose()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          {existingNote != null && (
            <button
              type="button"
              onClick={handleDelete}
              className="mr-auto rounded-lg border border-loss-200 px-3 py-1.5 text-sm text-loss-700 hover:bg-loss-50"
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-100 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Save
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {!isDirectNote && (
          <TargetPicker
            opponentNames={context.opponentNames}
            target={target}
            draftsByTarget={draftsByTarget}
            onChange={handleTargetChange}
          />
        )}
        <DisciplineFamilyPicker
          selected={appliesToDisciplineFamilies}
          onChange={setAppliesToDisciplineFamilies}
        />
        <div className="space-y-1.5">
          <label htmlFor="opponent-note-body" className="text-xs font-medium text-ink-600">
            Your notes
          </label>
          <textarea
            id="opponent-note-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={6}
            placeholder="Weak backhand, slow to the net, favourite serve wide…"
            className="w-full resize-y rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
      </div>
    </Modal>
  )
}

export function OpponentNoteModal({ open, onClose, context, initialTarget }: Props) {
  if (!open) return null

  return (
    <OpponentNoteForm
      key={`${context.matchKey}:${initialTarget ? noteTargetKey(initialTarget) : 'default'}`}
      context={context}
      initialTarget={initialTarget}
      onClose={onClose}
    />
  )
}
