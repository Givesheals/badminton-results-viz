import { useEffect, useId, useState, type FormEvent } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import {
  countNotesWithCustomTag,
  formatCustomTagUsageSentence,
  uniqueSubjectsForCustomTag,
} from '../../lib/customTagNoteUpdates'
import {
  CUSTOM_TAG_MAX_LENGTH,
  CUSTOM_TAG_MAX_PER_GROUP,
  ensureScoutingChipLibrary,
  loadRememberedCustomTags,
  normalizeCustomTagLabel,
  rememberCustomTag,
  removeRememberedCustomTag,
  SCOUTING_TAG_LIBRARY_GROUP,
  type CustomTagGroup,
} from '../../lib/customNoteTags'
import { MATCH_JOURNAL_UI_ENABLED } from '../../lib/opponentNotes'
import { Modal } from '../ui/Modal'

type TagLibraryGroup = {
  group: CustomTagGroup
  title: string | null
}

const SCOUTING_GROUP: TagLibraryGroup = {
  group: SCOUTING_TAG_LIBRARY_GROUP,
  title: null,
}

const JOURNAL_GROUPS: TagLibraryGroup[] = [
  { group: 'selfFeel', title: 'How I played' },
  { group: 'gameEvents', title: 'What happened' },
]

function loadLibrary(
  playerName: string | null,
  group: CustomTagGroup,
  scouting: boolean,
): string[] {
  if (scouting) {
    return ensureScoutingChipLibrary(playerName)[group]
  }
  return loadRememberedCustomTags(playerName)[group]
}

function TagChipList({
  labels,
  onRemove,
}: {
  labels: string[]
  onRemove: (label: string) => void
}) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <li key={label}>
          <span className="inline-flex items-center gap-1 rounded-md border border-notes-amber/35 bg-notes-amber-soft py-0.5 pl-2 pr-1 text-xs font-medium text-notes-amber-ink">
            {label}
            <button
              type="button"
              onClick={() => onRemove(label)}
              className="rounded px-1 text-notes-amber-ink transition hover:bg-notes-amber/15 hover:text-notes-amber"
              aria-label={`Remove ${label} from your note tags`}
              title="Remove from your note tags"
            >
              ×
            </button>
          </span>
        </li>
      ))}
    </ul>
  )
}

function TagUsageBlock({
  heading,
  labels,
  onRemove,
}: {
  heading: string
  labels: string[]
  onRemove: (label: string) => void
}) {
  if (labels.length === 0) return null

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-ink-600">{heading}</p>
      <TagChipList labels={labels} onRemove={onRemove} />
    </div>
  )
}

function TagLibraryBlock({
  group,
  title,
  playerName,
  revision,
}: {
  group: CustomTagGroup
  title: string | null
  playerName: string | null
  revision: number
}) {
  const { allNotes, removeCustomTagEverywhere } = useOpponentNotesContext()
  const addInputId = useId()
  const isScouting = group === 'opponentStyles' || group === 'pairStyles'
  const [tags, setTags] = useState(() => loadLibrary(playerName, group, isScouting))
  const [addDraft, setAddDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)

  useEffect(() => {
    setTags(loadLibrary(playerName, group, isScouting))
    setPendingRemove(null)
    setMessage(null)
  }, [playerName, group, isScouting, revision])

  const atLimit = tags.length >= CUSTOM_TAG_MAX_PER_GROUP
  const canSubmit = normalizeCustomTagLabel(addDraft) != null

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const label = normalizeCustomTagLabel(addDraft)
    if (label == null) return

    if (tags.some((tag) => tag.toLowerCase() === label.toLowerCase())) {
      setAddDraft('')
      setMessage(null)
      return
    }

    const updated = rememberCustomTag(playerName, group, label)
    if (updated == null) {
      setMessage(`You can save up to ${CUSTOM_TAG_MAX_PER_GROUP} tags`)
      return
    }
    setTags(updated)
    setAddDraft('')
    setMessage(null)
  }

  function removeFromList(label: string) {
    const updated = removeRememberedCustomTag(playerName, group, label)
    if (updated != null) setTags(updated)
  }

  function handleRemoveClick(label: string) {
    setMessage(null)
    if (countNotesWithCustomTag(allNotes, group, label) === 0) {
      removeFromList(label)
      return
    }
    setPendingRemove(label)
  }

  function confirmRemoveFromList() {
    if (pendingRemove == null) return
    removeFromList(pendingRemove)
    setPendingRemove(null)
  }

  function confirmRemoveFromListAndNotes() {
    if (pendingRemove == null) return
    const label = pendingRemove
    removeFromList(label)
    removeCustomTagEverywhere(group, label)
    setPendingRemove(null)
  }

  const pendingUsageCount =
    pendingRemove == null ? 0 : countNotesWithCustomTag(allNotes, group, pendingRemove)
  const pendingUsageSentence =
    pendingRemove == null
      ? ''
      : formatCustomTagUsageSentence(
          pendingUsageCount,
          uniqueSubjectsForCustomTag(allNotes, group, pendingRemove),
        )

  const inUseTags = tags.filter(
    (label) => countNotesWithCustomTag(allNotes, group, label) > 0,
  )
  const unusedTags = tags.filter(
    (label) => countNotesWithCustomTag(allNotes, group, label) === 0,
  )

  return (
    <div className="space-y-3">
      {title != null && <p className="text-xs font-medium text-ink-600">{title}</p>}

      {tags.length === 0 ? (
        <p className="text-xs text-ink-500">No tags yet. Add one below.</p>
      ) : (
        <div className="space-y-3">
          <TagUsageBlock heading="In use" labels={inUseTags} onRemove={handleRemoveClick} />
          <TagUsageBlock
            heading="Not in use"
            labels={unusedTags}
            onRemove={handleRemoveClick}
          />
        </div>
      )}

      <Modal
        open={pendingRemove != null}
        onClose={() => setPendingRemove(null)}
        title={
          pendingRemove != null ? `Remove \u201c${pendingRemove}\u201d?` : 'Remove tag'
        }
        footer={
          <div className="flex w-full flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPendingRemove(null)}
              className="rounded-lg border border-ink-100 px-2.5 py-1.5 text-xs text-ink-700 hover:bg-ink-50"
            >
              Cancel
            </button>
            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={confirmRemoveFromListAndNotes}
                className="rounded-lg border border-loss-200 px-2.5 py-1.5 text-xs font-medium text-loss-700 hover:bg-loss-50"
              >
                Remove from list & notes
              </button>
              <button
                type="button"
                onClick={confirmRemoveFromList}
                className="rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
              >
                Remove from list
              </button>
            </div>
          </div>
        }
      >
        <p className="text-sm text-ink-700">{pendingUsageSentence}</p>
        <p className="mt-2 text-sm text-ink-600">
          &ldquo;Remove from list&rdquo; keeps it on those notes.
          &ldquo;Remove from list &amp; notes&rdquo; strips it from them too.
        </p>
      </Modal>

      <form onSubmit={handleAdd} className="flex items-center gap-1.5">
        <label htmlFor={addInputId} className="sr-only">
          Add a tag{title != null ? ` to ${title}` : ''}
        </label>
        <input
          id={addInputId}
          type="text"
          value={addDraft}
          maxLength={CUSTOM_TAG_MAX_LENGTH}
          disabled={atLimit}
          placeholder={atLimit ? 'Tag limit reached' : 'Add a tag…'}
          onChange={(event) => {
            setAddDraft(event.target.value)
            setMessage(null)
          }}
          className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-100 disabled:bg-ink-50"
        />
        <button
          type="submit"
          disabled={atLimit || !canSubmit}
          className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-40"
        >
          Add
        </button>
      </form>
      {message != null && <p className="text-xs text-ink-500">{message}</p>}
    </div>
  )
}

type Props = {
  /** Bump when the compose modal closes so the list reloads from storage. */
  revision?: number
}

export function YourTagsSection({ revision = 0 }: Props) {
  const { playerName } = useOpponentNotesContext()
  const groups = MATCH_JOURNAL_UI_ENABLED
    ? [SCOUTING_GROUP, ...JOURNAL_GROUPS]
    : [SCOUTING_GROUP]

  return (
    <section className="overflow-hidden rounded-2xl card-frame bg-white shadow-sm">
      <div className="px-4 py-4 sm:px-5">
        <h4 className="text-sm font-semibold text-ink-900">Your note tags</h4>
        <p className="mt-1 text-xs text-ink-500">
          Labels you can tap when writing notes. Remove anytime.
        </p>
        <div className="mt-4 space-y-5">
          {groups.map(({ group, title }) => (
            <TagLibraryBlock
              key={group}
              group={group}
              title={title}
              playerName={playerName}
              revision={revision}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
