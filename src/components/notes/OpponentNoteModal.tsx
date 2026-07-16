import { useState } from 'react'
import { useOpponentNotesContext } from '../../context/OpponentNotesContext'
import {
  journalTagsFromNote,
  noteHasContent,
  normalizeNoteTags,
  type MatchFlowTag,
  type NoteTags,
  type OpponentStyleTag,
  type PairStyleTag,
  type PartnerContextTag,
  type SelfFeelTag,
} from '../../lib/noteTags'
import {
  defaultScoutingAppliesToDisciplineCodes,
  defaultNoteTarget,
  getMatchJournalFields,
  getNoteScoutingAppliesToDisciplineCodes,
  isDirectNoteContext,
  isMatchNoteTarget,
  MATCH_JOURNAL_UI_ENABLED,
  MATCH_NOTE_TARGET,
  matchJournalHasContent,
  isScoutingNote,
  noteHasStoredContent,
  noteTargetKey,
  noteTargetsEqual,
  SCOUTING_APPLIES_TO_DISCIPLINE_CODES,
  type MatchJournalFields,
  type OpponentNote,
  type OpponentNoteMatchContext,
  type OpponentNoteTarget,
} from '../../lib/opponentNotes'
import { Modal } from '../ui/Modal'
import { DisciplineChip } from '../discipline/DisciplineChip'
import {
  GameEventNoteSection,
  OpponentStyleNoteSection,
  PairStyleNoteSection,
  SelfFeelNoteSection,
} from './NoteTagPicker'

type Props = {
  open: boolean
  onClose: () => void
  context: OpponentNoteMatchContext
  initialTarget?: OpponentNoteTarget
}

type ModalMode = 'scout' | 'game'

function buildMatchJournalFromStored(note: OpponentNote | null): MatchJournalFields {
  if (note == null) return {}
  const fields = getMatchJournalFields(note)
  return {
    selfReflection: fields.selfReflection,
    gameEvents: fields.gameEvents,
  }
}

function matchNoteHasDraft(
  matchJournalDraft: MatchJournalFields,
  journalTags?: NoteTags,
): boolean {
  return matchJournalHasContent(
    {
      selfReflection: matchJournalDraft.selfReflection?.trim() ?? '',
      gameEvents: matchJournalDraft.gameEvents?.trim() ?? '',
    },
    journalTags,
  )
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

function buildCodesFromStored(
  getNotesForMatch: (matchKey: string) => OpponentNote[],
  matchKey: string,
): Record<string, string[]> {
  const codes: Record<string, string[]> = {}
  for (const note of getNotesForMatch(matchKey)) {
    if (!isMatchNoteTarget(note.target)) {
      codes[noteTargetKey(note.target)] = getNoteScoutingAppliesToDisciplineCodes(note)
    }
  }
  return codes
}

function buildTagsFromStored(
  getNotesForMatch: (matchKey: string) => OpponentNote[],
  matchKey: string,
): Record<string, NoteTags> {
  const tagsByTarget: Record<string, NoteTags> = {}
  for (const note of getNotesForMatch(matchKey)) {
    if (note.tags != null) {
      tagsByTarget[noteTargetKey(note.target)] = note.tags
    }
  }
  return tagsByTarget
}

function scoutingTagsForTargetState(
  target: OpponentNoteTarget,
  tags?: NoteTags,
): NoteTags | undefined {
  if (tags == null) return undefined
  if (target.kind === 'pair') {
    const pairStyles = tags.pairStyles ?? []
    const customPairStyles = tags.customPairStyles ?? []
    if (pairStyles.length === 0 && customPairStyles.length === 0) return undefined
    return {
      ...(pairStyles.length > 0 ? { pairStyles } : {}),
      ...(customPairStyles.length > 0 ? { customPairStyles } : {}),
    }
  }
  if (target.kind === 'opponent') {
    const opponentStyles = tags.opponentStyles ?? []
    const customOpponentStyles = tags.customOpponentStyles ?? []
    if (opponentStyles.length === 0 && customOpponentStyles.length === 0) return undefined
    return {
      ...(opponentStyles.length > 0 ? { opponentStyles } : {}),
      ...(customOpponentStyles.length > 0 ? { customOpponentStyles } : {}),
    }
  }
  return undefined
}

function DisciplineAppliesToPicker({
  selectedCodes,
  onChange,
}: {
  selectedCodes: string[]
  onChange: (codes: string[]) => void
}) {
  const [editing, setEditing] = useState(false)

  function toggleCode(code: string) {
    const next = selectedCodes.includes(code)
      ? selectedCodes.filter((item) => item !== code)
      : [...selectedCodes, code]
    onChange(next)
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-ink-500">
        <span>Applies to:</span>
        {selectedCodes.length === 0 ? (
          <span className="text-ink-400">None selected</span>
        ) : (
          selectedCodes.map((code) => <DisciplineChip key={code} code={code} />)
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="font-medium text-brand-600 hover:underline"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <span className="text-xs text-ink-500">Applies to:</span>
        <div className="flex flex-wrap gap-1">
          {SCOUTING_APPLIES_TO_DISCIPLINE_CODES.map((code) => {
            const isSelected = selectedCodes.includes(code)
            return (
              <button
                key={code}
                type="button"
                aria-pressed={isSelected}
                aria-label={`${code}${isSelected ? ', selected' : ''}`}
                onClick={() => toggleCode(code)}
                className={`rounded transition ${isSelected ? '' : 'opacity-35 hover:opacity-60'}`}
              >
                <DisciplineChip code={code} />
              </button>
            )
          })}
        </div>
      </div>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="text-xs font-medium text-brand-600 hover:underline"
      >
        Done
      </button>
    </div>
  )
}

function doublesTargetOptions(
  opponentNames: string[],
): { value: OpponentNoteTarget; label: string }[] {
  return [
    ...opponentNames.map((name) => ({
      value: { kind: 'opponent' as const, name },
      label: name,
    })),
    { value: { kind: 'pair' as const }, label: 'The pair' },
  ]
}

function shouldPromptForNoteTarget(
  context: OpponentNoteMatchContext,
  initialTarget: OpponentNoteTarget | undefined,
  getNotesForMatch: (matchKey: string) => OpponentNote[],
): boolean {
  if (isDirectNoteContext(context)) return false
  if (context.opponentNames.length < 2) return false
  if (initialTarget != null && !isMatchNoteTarget(initialTarget)) return false
  return !getNotesForMatch(context.matchKey).some(
    (note) => isScoutingNote(note) && noteHasStoredContent(note),
  )
}

function OpponentSegmentedControl({
  opponentNames,
  target,
  onChange,
}: {
  opponentNames: string[]
  target: OpponentNoteTarget
  onChange: (target: OpponentNoteTarget) => void
}) {
  if (opponentNames.length < 2) return null

  const options = doublesTargetOptions(opponentNames)

  return (
    <div
      className="flex w-full gap-1 rounded-lg border border-ink-200 bg-ink-50 p-1"
      role="tablist"
      aria-label="Who is this note about?"
    >
      {options.map((option) => {
        const selected = noteTargetsEqual(option.value, target)
        return (
          <button
            key={option.label}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={`min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-center text-xs font-medium leading-snug transition ${
              selected
                ? 'bg-white text-ink-900 shadow-sm'
                : 'text-ink-600 hover:text-ink-800'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function NoteTargetChooser({
  opponentNames,
  onChange,
}: {
  opponentNames: string[]
  onChange: (target: OpponentNoteTarget) => void
}) {
  const options = doublesTargetOptions(opponentNames)

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-sm font-medium text-ink-900">Who is this note about?</p>
        <p className="text-sm text-ink-600">
          Pick a player or the pair to start. You can add notes for the others next. If
          you&apos;re not sure which player is which, or who the note is about, choose{' '}
          <span className="font-medium text-ink-800">The pair</span>.
        </p>
      </div>
      <div className="flex flex-col gap-2" role="group" aria-label="Who is this note about?">
        {options.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => onChange(option.value)}
            className="rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-ink-800 transition hover:border-brand-300 hover:bg-brand-50 hover:text-ink-900"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModalModeTabs({
  mode,
  onChange,
  showGameTab,
}: {
  mode: ModalMode
  onChange: (mode: ModalMode) => void
  showGameTab: boolean
}) {
  return (
    <div
      className="flex rounded-lg border border-ink-200 bg-ink-50 p-1"
      role="tablist"
      aria-label="Note type"
    >
      <button
        type="button"
        role="tab"
        aria-selected={mode === 'scout'}
        onClick={() => onChange('scout')}
        className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
          mode === 'scout' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-800'
        }`}
      >
        About them
      </button>
      {showGameTab && (
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'game'}
          onClick={() => onChange('game')}
          className={`flex flex-1 items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition ${
            mode === 'game' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-800'
          }`}
        >
          My game
        </button>
      )}
    </div>
  )
}

type FormProps = {
  context: OpponentNoteMatchContext
  initialTarget?: OpponentNoteTarget
  onClose: () => void
}

function OpponentNoteForm({ context, initialTarget, onClose }: FormProps) {
  const { playerName, getNotesForMatch, getNoteForMatchTarget, upsertNote, deleteNote } =
    useOpponentNotesContext()

  const isDirectNote = isDirectNoteContext(context)
  const promptForTarget = shouldPromptForNoteTarget(
    context,
    initialTarget,
    getNotesForMatch,
  )
  const resolvedInitialTarget =
    initialTarget != null && !isMatchNoteTarget(initialTarget)
      ? initialTarget
      : defaultNoteTarget(context.opponentNames)

  const [mode, setMode] = useState<ModalMode>(() => {
    if (!MATCH_JOURNAL_UI_ENABLED) return 'scout'
    if (isDirectNote) return 'scout'
    if (initialTarget != null && isMatchNoteTarget(initialTarget)) return 'game'
    return 'scout'
  })
  const [target, setTarget] = useState<OpponentNoteTarget | null>(() =>
    promptForTarget ? null : resolvedInitialTarget,
  )
  const [draftsByTarget, setDraftsByTarget] = useState<Record<string, string>>(() =>
    buildDraftsFromStored(getNotesForMatch, context.matchKey),
  )
  const [codesByTarget, setCodesByTarget] = useState<Record<string, string[]>>(() =>
    buildCodesFromStored(getNotesForMatch, context.matchKey),
  )
  const [tagsByTarget, setTagsByTarget] = useState<Record<string, NoteTags>>(() =>
    buildTagsFromStored(getNotesForMatch, context.matchKey),
  )
  const existingMatchNote = getNoteForMatchTarget(context.matchKey, MATCH_NOTE_TARGET)
  const [matchJournalDraft, setMatchJournalDraft] = useState<MatchJournalFields>(() =>
    buildMatchJournalFromStored(existingMatchNote),
  )

  const awaitingTarget = target == null
  const targetKey = target != null ? noteTargetKey(target) : ''
  const body = draftsByTarget[targetKey] ?? ''
  const existingScoutingNote =
    target != null ? getNoteForMatchTarget(context.matchKey, target) : null
  const appliesToDisciplineCodes =
    codesByTarget[targetKey] ??
    (existingScoutingNote != null
      ? getNoteScoutingAppliesToDisciplineCodes(existingScoutingNote)
      : defaultScoutingAppliesToDisciplineCodes(context))
  const scoutingTags = tagsByTarget[targetKey]
  const opponentStyles = scoutingTags?.opponentStyles ?? []
  const pairStyles = scoutingTags?.pairStyles ?? []
  const journalTags = tagsByTarget.match
  const { selfFeel, partnerContext, matchFlow, customSelfFeel, customGameEvents } =
    journalTagsFromNote(journalTags)
  const customOpponentStyles = scoutingTags?.customOpponentStyles ?? []
  const customPairStyles = scoutingTags?.customPairStyles ?? []
  const scoutingTagsToSave =
    target != null ? scoutingTagsForTargetState(target, scoutingTags) : undefined
  const scoutingHasContent = noteHasContent(body, scoutingTagsToSave)
  const gameHasContent = matchNoteHasDraft(matchJournalDraft, journalTags)
  const scoutingCanSave =
    !scoutingHasContent || appliesToDisciplineCodes.length > 0
  const hasAnyStoredNote = getNotesForMatch(context.matchKey).some(
    (note) =>
      noteHasStoredContent(note) &&
      (MATCH_JOURNAL_UI_ENABLED || isScoutingNote(note)),
  )
  const gameTabHasNote =
    existingMatchNote != null && noteHasStoredContent(existingMatchNote)
  const hasEdits =
    scoutingHasContent ||
    (MATCH_JOURNAL_UI_ENABLED && gameHasContent) ||
    hasAnyStoredNote
  const title = hasEdits ? 'Edit personal notes' : 'Add personal notes'
  const canSave =
    !awaitingTarget &&
    (scoutingHasContent ? scoutingCanSave : true) &&
    (scoutingHasContent ||
      (MATCH_JOURNAL_UI_ENABLED && gameHasContent) ||
      hasAnyStoredNote)

  function setBody(text: string) {
    setDraftsByTarget((prev) => ({ ...prev, [targetKey]: text }))
  }

  function setMatchJournalField(field: keyof MatchJournalFields, text: string) {
    setMatchJournalDraft((prev) => ({ ...prev, [field]: text }))
  }

  function setJournalTags(updater: (prev: NoteTags | undefined) => NoteTags | undefined) {
    setTagsByTarget((prev) => {
      const updated = { ...prev }
      const normalized = normalizeNoteTags(updater(prev.match))
      if (normalized != null) updated.match = normalized
      else delete updated.match
      return updated
    })
  }

  function setJournalTagGroup<K extends 'selfFeel' | 'partnerContext' | 'matchFlow'>(
    key: K,
    values: K extends 'selfFeel'
      ? SelfFeelTag[]
      : K extends 'partnerContext'
        ? PartnerContextTag[]
        : MatchFlowTag[],
  ) {
    setJournalTags((prev) => ({ ...prev, [key]: values }))
  }

  function setJournalGameEventTags(
    matchFlow: MatchFlowTag[],
    partnerContext: PartnerContextTag[],
  ) {
    setJournalTags((prev) => ({ ...prev, matchFlow, partnerContext }))
  }

  function setCustomSelfFeel(values: string[]) {
    setJournalTags((prev) => ({ ...prev, customSelfFeel: values }))
  }

  function setCustomGameEvents(values: string[]) {
    setJournalTags((prev) => ({ ...prev, customGameEvents: values }))
  }

  function setAppliesToDisciplineCodes(codes: string[]) {
    setCodesByTarget((prev) => ({ ...prev, [targetKey]: codes }))
  }

  function setOpponentStyles(styles: OpponentStyleTag[]) {
    setTagsByTarget((prev) => {
      const next = { ...prev }
      const normalized = normalizeNoteTags({
        ...prev[targetKey],
        opponentStyles: styles,
      })
      if (normalized != null) next[targetKey] = normalized
      else delete next[targetKey]
      return next
    })
  }

  function setCustomOpponentStyles(values: string[]) {
    setTagsByTarget((prev) => {
      const next = { ...prev }
      const normalized = normalizeNoteTags({
        ...prev[targetKey],
        customOpponentStyles: values,
      })
      if (normalized != null) next[targetKey] = normalized
      else delete next[targetKey]
      return next
    })
  }

  function setPairStyles(styles: PairStyleTag[]) {
    setTagsByTarget((prev) => {
      const next = { ...prev }
      const normalized = normalizeNoteTags({ ...prev[targetKey], pairStyles: styles })
      if (normalized != null) next[targetKey] = normalized
      else delete next[targetKey]
      return next
    })
  }

  function setCustomPairStyles(values: string[]) {
    setTagsByTarget((prev) => {
      const next = { ...prev }
      const normalized = normalizeNoteTags({
        ...prev[targetKey],
        customPairStyles: values,
      })
      if (normalized != null) next[targetKey] = normalized
      else delete next[targetKey]
      return next
    })
  }

  function persistScoutingDraft() {
    if (target == null) return
    if (scoutingHasContent && scoutingCanSave) {
      upsertNote(
        context,
        body,
        target,
        [],
        scoutingTagsToSave,
        undefined,
        appliesToDisciplineCodes,
      )
    } else if (!scoutingHasContent) {
      upsertNote(context, '', target, [], undefined, undefined, appliesToDisciplineCodes)
    }
  }

  function handleModeChange(newMode: ModalMode) {
    if (mode === 'scout' && newMode === 'game') {
      persistScoutingDraft()
    }
    setMode(newMode)
  }

  function handleTargetChange(newTarget: OpponentNoteTarget) {
    if (target != null && noteTargetsEqual(target, newTarget)) return
    if (target != null) {
      persistScoutingDraft()
      setDraftsByTarget((prev) => {
        const next = { ...prev, [targetKey]: body }
        if (!noteHasContent(body, scoutingTagsToSave)) delete next[targetKey]
        return next
      })
      setCodesByTarget((prev) => ({ ...prev, [targetKey]: appliesToDisciplineCodes }))
      setTagsByTarget((prev) => {
        const next = { ...prev }
        const normalized = scoutingTagsForTargetState(target, scoutingTags)
        if (normalized != null) next[targetKey] = normalized
        else delete next[targetKey]
        return next
      })
    }
    setTarget(newTarget)
  }

  function handleSave() {
    if (awaitingTarget) return
    persistScoutingDraft()

    // Skip match-journal upsert while MVP hides "My game" so existing
    // journal notes are not wiped by a scout-only save.
    if (MATCH_JOURNAL_UI_ENABLED && !isDirectNote) {
      upsertNote(
        context,
        '',
        MATCH_NOTE_TARGET,
        [],
        gameHasContent ? journalTags : undefined,
        gameHasContent ? matchJournalDraft : undefined,
      )
    }

    onClose()
  }

  function handleDeleteScouting() {
    if (existingScoutingNote != null) deleteNote(existingScoutingNote.id)
    setDraftsByTarget((prev) => {
      const next = { ...prev }
      delete next[targetKey]
      return next
    })
    setCodesByTarget((prev) => {
      const next = { ...prev }
      delete next[targetKey]
      return next
    })
    setTagsByTarget((prev) => {
      const next = { ...prev }
      delete next[targetKey]
      return next
    })
    onClose()
  }

  function handleDeleteMatchNote() {
    if (existingMatchNote != null) deleteNote(existingMatchNote.id)
    setMatchJournalDraft({})
    setTagsByTarget((prev) => {
      const next = { ...prev }
      delete next.match
      return next
    })
    onClose()
  }

  const showDeleteScouting = mode === 'scout' && existingScoutingNote != null
  const showDeleteGame =
    MATCH_JOURNAL_UI_ENABLED && mode === 'game' && gameTabHasNote
  const showModeTabs = MATCH_JOURNAL_UI_ENABLED && !isDirectNote && !awaitingTarget
  const showScoutPanel = !MATCH_JOURNAL_UI_ENABLED || mode === 'scout'

  return (
    <Modal
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          {showDeleteScouting && (
            <button
              type="button"
              onClick={handleDeleteScouting}
              className="mr-auto rounded-lg border border-loss-200 px-3 py-1.5 text-sm text-loss-700 hover:bg-loss-50"
            >
              Delete opponent note
            </button>
          )}
          {showDeleteGame && (
            <button
              type="button"
              onClick={handleDeleteMatchNote}
              className="mr-auto rounded-lg border border-loss-200 px-3 py-1.5 text-sm text-loss-700 hover:bg-loss-50"
            >
              Delete game note
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink-100 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
          >
            Cancel
          </button>
          {!awaitingTarget && (
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {awaitingTarget ? (
          <NoteTargetChooser
            opponentNames={context.opponentNames}
            onChange={handleTargetChange}
          />
        ) : (
          <>
            {showModeTabs && (
              <ModalModeTabs mode={mode} onChange={handleModeChange} showGameTab />
            )}

            {showScoutPanel ? (
              <div className="space-y-3" role={showModeTabs ? 'tabpanel' : undefined}>
                {!isDirectNote && context.opponentNames.length >= 2 && (
                  <>
                    <OpponentSegmentedControl
                      opponentNames={context.opponentNames}
                      target={target}
                      onChange={handleTargetChange}
                    />
                    {target.kind === 'pair' && (
                      <p className="text-xs text-ink-600">
                        This note is about how they played together as a pair — not about either
                        opponent on their own.
                      </p>
                    )}
                  </>
                )}
                {target.kind === 'pair' ? (
                  <PairStyleNoteSection
                    body={body}
                    onBodyChange={setBody}
                    selected={pairStyles}
                    onSelectedChange={setPairStyles}
                    selectedCustom={customPairStyles}
                    onSelectedCustomChange={setCustomPairStyles}
                    playerName={playerName}
                  />
                ) : target.kind === 'opponent' ? (
                  <OpponentStyleNoteSection
                    body={body}
                    onBodyChange={setBody}
                    selected={opponentStyles}
                    onSelectedChange={setOpponentStyles}
                    selectedCustom={customOpponentStyles}
                    onSelectedCustomChange={setCustomOpponentStyles}
                    playerName={playerName}
                  />
                ) : null}
                <DisciplineAppliesToPicker
                  selectedCodes={appliesToDisciplineCodes}
                  onChange={setAppliesToDisciplineCodes}
                />
              </div>
            ) : (
              <div className="space-y-4" role="tabpanel">
                <SelfFeelNoteSection
                  body={matchJournalDraft.selfReflection ?? ''}
                  onBodyChange={(value) => setMatchJournalField('selfReflection', value)}
                  selected={selfFeel}
                  onSelectedChange={(values) => setJournalTagGroup('selfFeel', values)}
                  selectedCustom={customSelfFeel}
                  onSelectedCustomChange={setCustomSelfFeel}
                  playerName={playerName}
                />
                <GameEventNoteSection
                  body={matchJournalDraft.gameEvents ?? ''}
                  onBodyChange={(value) => setMatchJournalField('gameEvents', value)}
                  selectedMatchFlow={matchFlow}
                  selectedPartnerContext={partnerContext}
                  onGameEventBuiltInChange={setJournalGameEventTags}
                  selectedCustom={customGameEvents}
                  onSelectedCustomChange={setCustomGameEvents}
                  showPartnerTag={context.partnerName != null}
                  playerName={playerName}
                />
              </div>
            )}
          </>
        )}
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
