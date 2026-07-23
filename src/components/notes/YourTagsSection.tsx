import { useEffect, useId, useState, type FormEvent } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import { countNotesWithCustomTag } from '../../lib/customTagNoteUpdates'
import {
  CUSTOM_TAG_MAX_LENGTH,
  CUSTOM_TAG_MAX_PER_GROUP,
  ensureScoutingChipLibrary,
  loadRememberedCustomTags,
  normalizeCustomTagLabel,
  rememberCustomTag,
  removeRememberedCustomTag,
  type CustomTagGroup,
} from '../../lib/customNoteTags'
import { MATCH_JOURNAL_UI_ENABLED } from '../../lib/opponentNotes'

type TagLibraryGroup = {
  group: CustomTagGroup
  title: string
}

const SCOUTING_GROUPS: TagLibraryGroup[] = [
  { group: 'opponentStyles', title: 'Opponent' },
  { group: 'pairStyles', title: 'The pair' },
]

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

function TagLibraryBlock({
  group,
  title,
  playerName,
  revision,
}: {
  group: CustomTagGroup
  title: string
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

  function confirmRemoveFromList() {
    if (pendingRemove == null) return
    const updated = removeRememberedCustomTag(playerName, group, pendingRemove)
    if (updated != null) setTags(updated)
    setPendingRemove(null)
  }

  function confirmRemoveFromListAndNotes() {
    if (pendingRemove == null) return
    const label = pendingRemove
    const updated = removeRememberedCustomTag(playerName, group, label)
    if (updated != null) setTags(updated)
    removeCustomTagEverywhere(group, label)
    setPendingRemove(null)
  }

  const pendingUsageCount =
    pendingRemove == null ? 0 : countNotesWithCustomTag(allNotes, group, pendingRemove)

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-ink-600">{title}</p>

      {tags.length === 0 ? (
        <p className="text-xs text-ink-500">No tags yet. Add one below.</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {tags.map((label) => (
            <li key={label}>
              <span className="inline-flex items-center gap-1 rounded-md border border-brand-300 bg-brand-50 py-0.5 pl-2 pr-1 text-xs font-medium text-brand-800">
                {label}
                <button
                  type="button"
                  onClick={() => {
                    setPendingRemove(label)
                    setMessage(null)
                  }}
                  className="rounded px-1 text-brand-700 transition hover:bg-brand-100 hover:text-brand-900"
                  aria-label={`Remove ${label} from your tags`}
                  title="Remove from your tags"
                >
                  ×
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      {pendingRemove != null && (
        <div className="rounded-lg border border-ink-200 bg-white px-3 py-2.5">
          <p className="text-xs text-ink-700">
            Remove &ldquo;{pendingRemove}&rdquo; from your quick-add tags?
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-ink-500">
            {pendingUsageCount > 0
              ? 'Saved notes keep this tag unless you choose to strip it.'
              : 'It is not used on any saved notes.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={confirmRemoveFromList}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
            >
              {pendingUsageCount > 0 ? 'Keep on notes' : 'Remove'}
            </button>
            {pendingUsageCount > 0 && (
              <button
                type="button"
                onClick={confirmRemoveFromListAndNotes}
                className="rounded-lg border border-loss-200 px-2.5 py-1 text-xs font-medium text-loss-700 transition hover:bg-loss-50"
              >
                Also remove from {pendingUsageCount} note
                {pendingUsageCount === 1 ? '' : 's'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setPendingRemove(null)}
              className="px-2 py-1 text-xs text-ink-500 transition hover:text-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleAdd} className="flex items-center gap-1.5">
        <label htmlFor={addInputId} className="sr-only">
          Add a tag to {title}
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
    ? [...SCOUTING_GROUPS, ...JOURNAL_GROUPS]
    : SCOUTING_GROUPS

  return (
    <section>
      <h4 className="text-sm font-semibold text-ink-900">Your tags</h4>
      <p className="mt-1 text-xs text-ink-500">
        Quick-add labels for notes. Remove here anytime — renaming comes later.
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
    </section>
  )
}
