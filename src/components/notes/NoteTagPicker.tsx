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
  renameRememberedCustomTag,
  type CustomTagGroup,
} from '../../lib/customNoteTags'
import {
  MATCH_FLOW_LABELS,
  MATCH_FLOW_TAGS,
  OPPONENT_STYLE_HINTS,
  OPPONENT_STYLE_LABELS,
  OPPONENT_STYLE_TAGS,
  PAIR_STYLE_LABELS,
  PAIR_STYLE_TAGS,
  PARTNER_CONTEXT_LABELS,
  PARTNER_CONTEXT_TAGS,
  SELF_FEEL_LABELS,
  SELF_FEEL_TAGS,
  type MatchFlowTag,
  type OpponentStyleTag,
  type PairStyleTag,
  type PartnerContextTag,
  type SelfFeelTag,
} from '../../lib/noteTags'

type BuiltInOption<T extends string> = {
  value: T
  label: string
  hint?: string
}

const COMBO_BOX_CLASS =
  'rounded-lg border border-ink-200 transition focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-100'

const COMBO_TEXTAREA_CLASS =
  'w-full resize-y border-0 bg-transparent px-3 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-0'

const BADGE_CLASS =
  'inline-flex shrink-0 items-center rounded-md border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800 transition hover:bg-brand-100'

const ADD_TAG_CLASS =
  'inline-flex items-center gap-0.5 rounded-lg border border-ink-100 bg-white px-2 py-1 text-xs font-medium text-ink-600 transition hover:bg-ink-50'

function TaggedNoteComboBox({
  textareaId,
  body,
  onBodyChange,
  placeholder,
  rows = 2,
  selectedLabels,
  onRemoveLabel,
}: {
  textareaId: string
  body: string
  onBodyChange: (value: string) => void
  placeholder: string
  rows?: number
  selectedLabels: string[]
  onRemoveLabel: (label: string) => void
}) {
  const hasChips = selectedLabels.length > 0

  return (
    <div className={COMBO_BOX_CLASS}>
      {hasChips && (
        <div className="flex flex-wrap gap-1.5 px-3 pt-2.5" role="list" aria-label="Selected tags">
          {selectedLabels.map((label) => (
            <button
              key={label}
              type="button"
              role="listitem"
              onClick={() => onRemoveLabel(label)}
              className={BADGE_CLASS}
              title="Remove tag"
            >
              {label}
            </button>
          ))}
        </div>
      )}
      <textarea
        id={textareaId}
        value={body}
        onChange={(event) => onBodyChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`${COMBO_TEXTAREA_CLASS} ${hasChips ? 'pb-2 pt-1.5' : 'py-2'}`}
      />
    </div>
  )
}

const MORE_BUTTON_CLASS =
  'inline-flex items-center rounded-lg border border-ink-100 bg-white px-2.5 py-1 text-xs font-medium text-ink-600 transition hover:bg-ink-50'

const EDIT_CHIPS_BUTTON_CLASS =
  'inline-flex items-center gap-1 rounded-lg border border-brand-300 bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-800 shadow-sm transition hover:bg-brand-100'

function CustomTagManagePanel({
  customTagGroup,
  playerName,
  rememberedTags,
  onRememberedChange,
  selectedCustom,
  onSelectedCustomChange,
  onClose,
  diyLibrary = false,
}: {
  customTagGroup: CustomTagGroup
  playerName: string | null
  rememberedTags: string[]
  onRememberedChange: (tags: string[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  onClose: () => void
  diyLibrary?: boolean
}) {
  const { allNotes, renameCustomTagEverywhere, removeCustomTagEverywhere } =
    useOpponentNotesContext()
  const addInputId = useId()
  const [addDraft, setAddDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const [removeFromNotes, setRemoveFromNotes] = useState(false)
  const [pendingRename, setPendingRename] = useState<{
    oldLabel: string
    newLabel: string
  } | null>(null)
  const [renameOnNotes, setRenameOnNotes] = useState(true)

  const atLimit = rememberedTags.length >= CUSTOM_TAG_MAX_PER_GROUP
  const panelTitle = diyLibrary ? 'Your note tags' : 'Your tags'
  const newLabel = 'New tag'
  const emptyCopy = diyLibrary
    ? 'No tags yet. Add one above.'
    : 'No custom tags yet. Add one above.'
  const removeCopy = 'quick-add tags'
  const footerCopy =
    'Removing a tag hides it from quick-add. Saved notes keep the tag unless you choose to remove it from them too.'

  function syncSelectedCustom(oldLabel: string, newLabel?: string) {
    const oldKey = oldLabel.toLowerCase()
    if (newLabel != null) {
      onSelectedCustomChange(
        selectedCustom.map((tag) => (tag.toLowerCase() === oldKey ? newLabel : tag)),
      )
      return
    }
    onSelectedCustomChange(selectedCustom.filter((tag) => tag.toLowerCase() !== oldKey))
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const label = normalizeCustomTagLabel(addDraft)
    if (label == null) return
    const updated = rememberCustomTag(playerName, customTagGroup, label)
    if (updated == null) {
      setMessage(`You can save up to ${CUSTOM_TAG_MAX_PER_GROUP} tags`)
      return
    }
    onRememberedChange(updated)
    setAddDraft('')
    setMessage(null)
  }

  function startRename(label: string) {
    setEditingLabel(label)
    setEditDraft(label)
    setPendingRemove(null)
    setPendingRename(null)
    setMessage(null)
  }

  function startRemove(label: string) {
    const usageCount = countNotesWithCustomTag(allNotes, customTagGroup, label)
    setPendingRemove(label)
    setRemoveFromNotes(usageCount > 0)
    setEditingLabel(null)
    setPendingRename(null)
    setMessage(null)
  }

  function confirmRemove() {
    if (pendingRemove == null) return
    const label = pendingRemove
    const usageCount = countNotesWithCustomTag(allNotes, customTagGroup, label)

    const updated = removeRememberedCustomTag(playerName, customTagGroup, label)
    if (updated != null) onRememberedChange(updated)

    if (removeFromNotes && usageCount > 0) {
      removeCustomTagEverywhere(customTagGroup, label)
      syncSelectedCustom(label)
    }

    setPendingRemove(null)
    setRemoveFromNotes(false)
  }

  function submitRename(oldLabel: string) {
    const newLabel = normalizeCustomTagLabel(editDraft)
    if (newLabel == null) return
    if (newLabel.toLowerCase() === oldLabel.toLowerCase()) {
      setEditingLabel(null)
      return
    }

    const usageCount = countNotesWithCustomTag(allNotes, customTagGroup, oldLabel)
    if (usageCount > 0) {
      setPendingRename({ oldLabel, newLabel })
      setRenameOnNotes(true)
      return
    }

    const updated = renameRememberedCustomTag(playerName, customTagGroup, oldLabel, newLabel)
    if (updated == null) {
      setMessage('That tag name is already in use')
      return
    }
    onRememberedChange(updated)
    syncSelectedCustom(oldLabel, newLabel)
    setEditingLabel(null)
    setMessage(null)
  }

  function confirmRename() {
    if (pendingRename == null) return
    const { oldLabel, newLabel } = pendingRename
    const usageCount = countNotesWithCustomTag(allNotes, customTagGroup, oldLabel)

    const updated = renameRememberedCustomTag(playerName, customTagGroup, oldLabel, newLabel)
    if (updated == null) {
      setMessage('That tag name is already in use')
      setPendingRename(null)
      return
    }
    onRememberedChange(updated)

    if (renameOnNotes && usageCount > 0) {
      renameCustomTagEverywhere(customTagGroup, oldLabel, newLabel)
    }
    syncSelectedCustom(oldLabel, newLabel)

    setPendingRename(null)
    setEditingLabel(null)
    setMessage(null)
  }

  return (
    <div className="rounded-lg border border-ink-200 bg-ink-50/80 p-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-ink-700">{panelTitle}</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700"
        >
          Done
        </button>
      </div>

      <form onSubmit={handleAdd} className="mb-3 flex items-center gap-1.5">
        <label htmlFor={addInputId} className="sr-only">
          {newLabel}
        </label>
        <input
          id={addInputId}
          type="text"
          value={addDraft}
          maxLength={CUSTOM_TAG_MAX_LENGTH}
          disabled={atLimit}
          placeholder={atLimit ? 'Tag limit reached' : newLabel}
          onChange={(event) => setAddDraft(event.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1.5 text-xs text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-100 disabled:bg-ink-50"
        />
        <button
          type="submit"
          disabled={atLimit || normalizeCustomTagLabel(addDraft) == null}
          className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-100 disabled:opacity-40"
        >
          Add
        </button>
      </form>

      {rememberedTags.length === 0 ? (
        <p className="text-xs text-ink-500">{emptyCopy}</p>
      ) : (
        <ul className="space-y-2">
          {rememberedTags.map((label) => (
            <li key={label} className="rounded-lg border border-ink-100 bg-white px-2.5 py-2">
              {editingLabel === label ? (
                <form
                  className="flex flex-wrap items-center gap-1.5"
                  onSubmit={(event) => {
                    event.preventDefault()
                    submitRename(label)
                  }}
                >
                  <input
                    type="text"
                    value={editDraft}
                    maxLength={CUSTOM_TAG_MAX_LENGTH}
                    autoFocus
                    onChange={(event) => setEditDraft(event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1 text-xs text-ink-900 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-100"
                  />
                  <button
                    type="submit"
                    disabled={normalizeCustomTagLabel(editDraft) == null}
                    className="rounded-lg border border-ink-100 px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-50 disabled:opacity-40"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingLabel(null)}
                    className="px-1.5 py-1 text-xs text-ink-500 hover:text-ink-700"
                  >
                    Cancel
                  </button>
                </form>
              ) : pendingRemove === label ? (
                <div className="space-y-2">
                  <p className="text-xs text-ink-700">
                    Remove &ldquo;{label}&rdquo; from your {removeCopy}?
                  </p>
                  {countNotesWithCustomTag(allNotes, customTagGroup, label) > 0 && (
                    <label className="flex items-start gap-2 text-xs text-ink-600">
                      <input
                        type="checkbox"
                        checked={removeFromNotes}
                        onChange={(event) => setRemoveFromNotes(event.target.checked)}
                        className="mt-0.5"
                      />
                      <span>
                        Also remove from{' '}
                        {countNotesWithCustomTag(allNotes, customTagGroup, label)} saved note
                        {countNotesWithCustomTag(allNotes, customTagGroup, label) === 1 ? '' : 's'}
                      </span>
                    </label>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={confirmRemove}
                      className="rounded-lg border border-loss-200 px-2 py-1 text-xs font-medium text-loss-700 hover:bg-loss-50"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemove(null)}
                      className="px-2 py-1 text-xs text-ink-500 hover:text-ink-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-ink-800">{label}</span>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => startRename(label)}
                      className="text-xs font-medium text-brand-600 hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => startRemove(label)}
                      className="text-xs font-medium text-ink-500 hover:text-ink-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {pendingRename != null && (
        <div className="mt-3 rounded-lg border border-ink-200 bg-white p-2.5">
          <p className="text-xs text-ink-700">
            Rename &ldquo;{pendingRename.oldLabel}&rdquo; to &ldquo;{pendingRename.newLabel}
            &rdquo;?
          </p>
          {countNotesWithCustomTag(allNotes, customTagGroup, pendingRename.oldLabel) > 0 && (
            <label className="mt-2 flex items-start gap-2 text-xs text-ink-600">
              <input
                type="checkbox"
                checked={renameOnNotes}
                onChange={(event) => setRenameOnNotes(event.target.checked)}
                className="mt-0.5"
              />
              <span>
                Also rename on{' '}
                {countNotesWithCustomTag(allNotes, customTagGroup, pendingRename.oldLabel)} saved
                note
                {countNotesWithCustomTag(allNotes, customTagGroup, pendingRename.oldLabel) === 1
                  ? ''
                  : 's'}
              </span>
            </label>
          )}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={confirmRename}
              className="rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              Rename
            </button>
            <button
              type="button"
              onClick={() => setPendingRename(null)}
              className="px-2 py-1 text-xs text-ink-500 hover:text-ink-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message != null && <p className="mt-2 text-xs text-ink-500">{message}</p>}
      <p className="mt-3 text-[11px] leading-relaxed text-ink-500">{footerCopy}</p>
    </div>
  )
}

function TagAddRow({
  unselectedOptions,
  onAdd,
  customTagGroup,
  playerName,
  rememberedTags,
  onRememberedChange,
  selectedCustom,
  onSelectedCustomChange,
  emphasizeAddLabel,
  diyLibrary = false,
}: {
  unselectedOptions: { label: string; hint?: string }[]
  onAdd: (label: string) => void
  customTagGroup: CustomTagGroup
  playerName: string | null
  rememberedTags: string[]
  onRememberedChange: (tags: string[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  emphasizeAddLabel?: string | null
  diyLibrary?: boolean
}) {
  const [manageOpen, setManageOpen] = useState(false)

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {unselectedOptions.map((option) => (
          <button
            key={option.label}
            type="button"
            title={option.hint}
            onClick={() => onAdd(option.label)}
            className={`${ADD_TAG_CLASS} ${
              emphasizeAddLabel === option.label
                ? 'premium-notes-demo-chip-press scale-95 border-brand-300 bg-brand-50 text-brand-800 ring-2 ring-brand-200'
                : ''
            }`}
          >
            <span aria-hidden="true">+</span>
            {option.label}
          </button>
        ))}
        {diyLibrary ? (
          <button
            type="button"
            onClick={() => setManageOpen((open) => !open)}
            aria-expanded={manageOpen}
            aria-label={manageOpen ? 'Close tag editor' : 'Edit tags'}
            title="Edit tags"
            className={EDIT_CHIPS_BUTTON_CLASS}
          >
            Edit tags
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setManageOpen((open) => !open)}
            aria-expanded={manageOpen}
            aria-label={manageOpen ? 'Close tag manager' : 'Manage your tags'}
            title="Manage your tags"
            className={MORE_BUTTON_CLASS}
          >
            <span aria-hidden="true">···</span>
          </button>
        )}
      </div>
      {manageOpen && (
        <CustomTagManagePanel
          customTagGroup={customTagGroup}
          playerName={playerName}
          rememberedTags={rememberedTags}
          onRememberedChange={onRememberedChange}
          selectedCustom={selectedCustom}
          onSelectedCustomChange={onSelectedCustomChange}
          onClose={() => setManageOpen(false)}
          diyLibrary={diyLibrary}
        />
      )}
    </div>
  )
}

function TaggedNoteSection<T extends string>({
  sectionTitle,
  textareaId,
  body,
  onBodyChange,
  placeholder,
  rows = 2,
  builtInOptions,
  selectedBuiltIn,
  onSelectedBuiltInChange,
  selectedCustom,
  onSelectedCustomChange,
  customTagGroup,
  playerName,
  emphasizeAddLabel,
  diyLibrary = false,
}: {
  sectionTitle?: string
  textareaId: string
  body: string
  onBodyChange: (value: string) => void
  placeholder: string
  rows?: number
  builtInOptions: BuiltInOption<T>[]
  selectedBuiltIn: T[]
  onSelectedBuiltInChange: (values: T[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  customTagGroup: CustomTagGroup
  playerName: string | null
  emphasizeAddLabel?: string | null
  /** About them: library-only quick-add + Edit tags CTA. Built-ins stay for legacy note display. */
  diyLibrary?: boolean
}) {
  const [rememberedCustom, setRememberedCustom] = useState(() =>
    diyLibrary
      ? ensureScoutingChipLibrary(playerName)[customTagGroup]
      : loadRememberedCustomTags(playerName)[customTagGroup],
  )

  useEffect(() => {
    setRememberedCustom(
      diyLibrary
        ? ensureScoutingChipLibrary(playerName)[customTagGroup]
        : loadRememberedCustomTags(playerName)[customTagGroup],
    )
  }, [playerName, customTagGroup, diyLibrary])

  const builtInLabelByValue = new Map(builtInOptions.map((option) => [option.value, option.label]))
  const selectedBuiltInLabels = selectedBuiltIn.map((value) => builtInLabelByValue.get(value)!)
  const selectedLabels = [...selectedBuiltInLabels, ...selectedCustom]

  const unselectedBuiltIn = diyLibrary
    ? []
    : builtInOptions.filter((option) => !selectedBuiltIn.includes(option.value))
  const unselectedRememberedCustom = rememberedCustom
    .filter((tag) => !selectedCustom.some((selected) => selected.toLowerCase() === tag.toLowerCase()))
    .map((label) => ({ label }))
  const unselectedOptions = [
    ...unselectedBuiltIn.map((option) => ({ label: option.label, hint: option.hint })),
    ...unselectedRememberedCustom,
  ]

  function addByLabel(label: string) {
    if (!diyLibrary) {
      const builtIn = builtInOptions.find((option) => option.label === label)
      if (builtIn != null) {
        if (!selectedBuiltIn.includes(builtIn.value)) {
          onSelectedBuiltInChange([...selectedBuiltIn, builtIn.value])
        }
        return
      }
    }
    const normalized = normalizeCustomTagLabel(label)
    if (normalized == null) return
    if (!selectedCustom.some((tag) => tag.toLowerCase() === normalized.toLowerCase())) {
      onSelectedCustomChange([...selectedCustom, normalized])
    }
  }

  function removeByLabel(label: string) {
    const builtIn = builtInOptions.find((option) => option.label === label)
    if (builtIn != null && selectedBuiltIn.includes(builtIn.value)) {
      onSelectedBuiltInChange(selectedBuiltIn.filter((value) => value !== builtIn.value))
      return
    }
    onSelectedCustomChange(
      selectedCustom.filter((tag) => tag.toLowerCase() !== label.toLowerCase()),
    )
  }

  return (
    <section className="space-y-2">
      {sectionTitle != null && (
        <h3 className="text-xs font-medium text-ink-600">{sectionTitle}</h3>
      )}
      <TaggedNoteComboBox
        textareaId={textareaId}
        body={body}
        onBodyChange={onBodyChange}
        placeholder={placeholder}
        rows={rows}
        selectedLabels={selectedLabels}
        onRemoveLabel={removeByLabel}
      />
      <TagAddRow
        unselectedOptions={unselectedOptions}
        onAdd={addByLabel}
        customTagGroup={customTagGroup}
        playerName={playerName}
        rememberedTags={rememberedCustom}
        onRememberedChange={setRememberedCustom}
        selectedCustom={selectedCustom}
        onSelectedCustomChange={onSelectedCustomChange}
        emphasizeAddLabel={emphasizeAddLabel}
        diyLibrary={diyLibrary}
      />
    </section>
  )
}

const OPPONENT_STYLE_OPTIONS: BuiltInOption<OpponentStyleTag>[] = OPPONENT_STYLE_TAGS.map(
  (value) => ({
    value,
    label: OPPONENT_STYLE_LABELS[value],
    hint: OPPONENT_STYLE_HINTS[value],
  }),
)

const PAIR_STYLE_OPTIONS: BuiltInOption<PairStyleTag>[] = PAIR_STYLE_TAGS.map((value) => ({
  value,
  label: PAIR_STYLE_LABELS[value],
}))

const SELF_FEEL_OPTIONS: BuiltInOption<SelfFeelTag>[] = SELF_FEEL_TAGS.map((value) => ({
  value,
  label: SELF_FEEL_LABELS[value],
}))

const PARTNER_CONTEXT_OPTIONS: BuiltInOption<PartnerContextTag>[] = PARTNER_CONTEXT_TAGS.map(
  (value) => ({
    value,
    label: PARTNER_CONTEXT_LABELS[value],
  }),
)

const MATCH_FLOW_OPTIONS: BuiltInOption<MatchFlowTag>[] = MATCH_FLOW_TAGS.map((value) => ({
  value,
  label: MATCH_FLOW_LABELS[value],
}))

export function OpponentStyleNoteSection({
  body,
  onBodyChange,
  selected,
  onSelectedChange,
  selectedCustom,
  onSelectedCustomChange,
  playerName,
  emphasizeAddLabel,
}: {
  body: string
  onBodyChange: (value: string) => void
  selected: OpponentStyleTag[]
  onSelectedChange: (values: OpponentStyleTag[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  playerName: string | null
  emphasizeAddLabel?: string | null
}) {
  return (
    <TaggedNoteSection
      textareaId="opponent-note-body"
      body={body}
      onBodyChange={onBodyChange}
      placeholder="Weak backhand, slow to the net, favourite serve wide…"
      rows={4}
      builtInOptions={OPPONENT_STYLE_OPTIONS}
      selectedBuiltIn={selected}
      onSelectedBuiltInChange={onSelectedChange}
      selectedCustom={selectedCustom}
      onSelectedCustomChange={onSelectedCustomChange}
      customTagGroup="opponentStyles"
      playerName={playerName}
      emphasizeAddLabel={emphasizeAddLabel}
      diyLibrary
    />
  )
}

export function PairStyleNoteSection({
  body,
  onBodyChange,
  selected,
  onSelectedChange,
  selectedCustom,
  onSelectedCustomChange,
  playerName,
}: {
  body: string
  onBodyChange: (value: string) => void
  selected: PairStyleTag[]
  onSelectedChange: (values: PairStyleTag[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  playerName: string | null
}) {
  return (
    <TaggedNoteSection
      textareaId="opponent-note-body"
      body={body}
      onBodyChange={onBodyChange}
      placeholder="Weak backhand, slow to the net, favourite serve wide…"
      rows={4}
      builtInOptions={PAIR_STYLE_OPTIONS}
      selectedBuiltIn={selected}
      onSelectedBuiltInChange={onSelectedChange}
      selectedCustom={selectedCustom}
      onSelectedCustomChange={onSelectedCustomChange}
      customTagGroup="pairStyles"
      playerName={playerName}
      diyLibrary
    />
  )
}

export function SelfFeelNoteSection({
  body,
  onBodyChange,
  selected,
  onSelectedChange,
  selectedCustom,
  onSelectedCustomChange,
  playerName,
}: {
  body: string
  onBodyChange: (value: string) => void
  selected: SelfFeelTag[]
  onSelectedChange: (values: SelfFeelTag[]) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  playerName: string | null
}) {
  return (
    <TaggedNoteSection
      sectionTitle="How I played"
      textareaId="self-reflection-body"
      body={body}
      onBodyChange={onBodyChange}
      placeholder="Want to work on serve receive, felt nervous at the net…"
      builtInOptions={SELF_FEEL_OPTIONS}
      selectedBuiltIn={selected}
      onSelectedBuiltInChange={onSelectedChange}
      selectedCustom={selectedCustom}
      onSelectedCustomChange={onSelectedCustomChange}
      customTagGroup="selfFeel"
      playerName={playerName}
    />
  )
}

type GameEventBuiltIn = MatchFlowTag | PartnerContextTag

function splitGameEventBuiltIn(values: GameEventBuiltIn[]): {
  matchFlow: MatchFlowTag[]
  partnerContext: PartnerContextTag[]
} {
  return {
    matchFlow: values.filter((value): value is MatchFlowTag =>
      MATCH_FLOW_TAGS.includes(value as MatchFlowTag),
    ),
    partnerContext: values.filter((value): value is PartnerContextTag =>
      PARTNER_CONTEXT_TAGS.includes(value as PartnerContextTag),
    ),
  }
}

export function GameEventNoteSection({
  body,
  onBodyChange,
  selectedMatchFlow,
  selectedPartnerContext,
  onGameEventBuiltInChange,
  selectedCustom,
  onSelectedCustomChange,
  showPartnerTag = false,
  playerName,
}: {
  body: string
  onBodyChange: (value: string) => void
  selectedMatchFlow: MatchFlowTag[]
  selectedPartnerContext: PartnerContextTag[]
  onGameEventBuiltInChange: (
    matchFlow: MatchFlowTag[],
    partnerContext: PartnerContextTag[],
  ) => void
  selectedCustom: string[]
  onSelectedCustomChange: (values: string[]) => void
  showPartnerTag?: boolean
  playerName: string | null
}) {
  const builtInOptions: BuiltInOption<GameEventBuiltIn>[] = showPartnerTag
    ? [...MATCH_FLOW_OPTIONS, ...PARTNER_CONTEXT_OPTIONS]
    : MATCH_FLOW_OPTIONS

  const selectedBuiltIn: GameEventBuiltIn[] = [...selectedMatchFlow, ...selectedPartnerContext]

  function onSelectedBuiltInChange(values: GameEventBuiltIn[]) {
    const { matchFlow, partnerContext } = splitGameEventBuiltIn(values)
    onGameEventBuiltInChange(matchFlow, partnerContext)
  }

  return (
    <TaggedNoteSection
      sectionTitle="What happened"
      textareaId="game-events-body"
      body={body}
      onBodyChange={onBodyChange}
      placeholder="Faded in game 2, partner injured early on, long day…"
      builtInOptions={builtInOptions}
      selectedBuiltIn={selectedBuiltIn}
      onSelectedBuiltInChange={onSelectedBuiltInChange}
      selectedCustom={selectedCustom}
      onSelectedCustomChange={onSelectedCustomChange}
      customTagGroup="gameEvents"
      playerName={playerName}
    />
  )
}

export function NoteTagChips({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <span
          key={label}
          className="inline-flex rounded-md border border-brand-300 bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-800"
        >
          {label}
        </span>
      ))}
    </div>
  )
}
