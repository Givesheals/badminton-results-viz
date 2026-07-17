import { useEffect, useId, useState, type FormEvent } from 'react'
import {
  CUSTOM_TAG_MAX_LENGTH,
  CUSTOM_TAG_MAX_PER_GROUP,
  ensureScoutingChipLibrary,
  loadRememberedCustomTags,
  normalizeCustomTagLabel,
  rememberCustomTag,
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

function TagAddRow({
  unselectedOptions,
  onAdd,
  customTagGroup,
  playerName,
  rememberedTags,
  onRememberedChange,
  emphasizeAddLabel,
}: {
  unselectedOptions: { label: string; hint?: string }[]
  onAdd: (label: string) => void
  customTagGroup: CustomTagGroup
  playerName: string | null
  rememberedTags: string[]
  onRememberedChange: (tags: string[]) => void
  emphasizeAddLabel?: string | null
}) {
  const addInputId = useId()
  const [addDraft, setAddDraft] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const atLimit = rememberedTags.length >= CUSTOM_TAG_MAX_PER_GROUP
  const canSubmit = normalizeCustomTagLabel(addDraft) != null

  function handleAdd(event: FormEvent) {
    event.preventDefault()
    const label = normalizeCustomTagLabel(addDraft)
    if (label == null) return

    const existing = rememberedTags.find((tag) => tag.toLowerCase() === label.toLowerCase())
    if (existing == null) {
      if (atLimit) {
        setMessage(`You can save up to ${CUSTOM_TAG_MAX_PER_GROUP} tags`)
        return
      }
      const updated = rememberCustomTag(playerName, customTagGroup, label)
      onRememberedChange(updated ?? [...rememberedTags, label])
    }

    onAdd(existing ?? label)
    setAddDraft('')
    setMessage(null)
  }

  return (
    <div className="space-y-2">
      {unselectedOptions.length > 0 && (
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
        </div>
      )}
      <form onSubmit={handleAdd} className="flex items-center gap-1.5">
        <label htmlFor={addInputId} className="sr-only">
          Add a tag
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
  /** About them: library-only quick-add. Built-ins stay for legacy note display. */
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
        emphasizeAddLabel={emphasizeAddLabel}
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
