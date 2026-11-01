import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { getDisciplineFamilyStyle } from '../../lib/disciplineStyle'
import { readTeamSheetLink, teamSheetHash } from '../../lib/teamSheetLink'
import {
  addPlayer,
  assignPlayer,
  clearSlot,
  createEmptyTeamSheet,
  disciplineFamilyForRubber,
  openPlacesLabel,
  pickerRows,
  removePlayer,
  RUBBER_GROUPS,
  summariseTeamSheet,
  type RubberDef,
  type RubberGroupDef,
  type RubberSlotDef,
  type SlotId,
  type TeamGender,
  type TeamSheetState,
} from '../../lib/teamSheet'

function loadSharedSheet(): { sheet: TeamSheetState; savedHash: string | null; linkError: boolean } {
  if (typeof window === 'undefined') {
    return { sheet: createEmptyTeamSheet(), savedHash: null, linkError: false }
  }
  const result = readTeamSheetLink(window.location.hash)
  if (result.status === 'ok') {
    return { sheet: result.sheet, savedHash: teamSheetHash(result.sheet), linkError: false }
  }
  return { sheet: createEmptyTeamSheet(), savedHash: null, linkError: result.status === 'invalid' }
}

export function TeamSheetPage() {
  const [loaded] = useState(loadSharedSheet)
  const [sheet, setSheet] = useState<TeamSheetState>(loaded.sheet)
  const [name, setName] = useState('')
  const [gender, setGender] = useState<TeamGender>('man')
  const [nameError, setNameError] = useState<string | null>(null)
  const [openSlot, setOpenSlot] = useState<SlotId | null>(null)
  const [savedHash, setSavedHash] = useState<string | null>(loaded.savedHash)
  const [copyState, setCopyState] = useState<'copied' | 'manual' | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const linkRef = useRef<HTMLInputElement>(null)
  const shouldFocusLink = useRef(false)
  const summary = useMemo(() => summariseTeamSheet(sheet), [sheet])
  const currentHash = teamSheetHash(sheet)
  const linkMatches = savedHash !== null && savedHash === currentHash
  const shareUrl =
    linkMatches && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}${window.location.search}${savedHash}`
      : null

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Team sheet - BadmInfo'
    return () => {
      document.title = previousTitle
    }
  }, [])

  useEffect(() => {
    if (!savedHash || window.location.hash === savedHash) return
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${savedHash}`)
  }, [savedHash])

  useEffect(() => {
    if (!shouldFocusLink.current || !shareUrl) return
    shouldFocusLink.current = false
    linkRef.current?.focus()
    linkRef.current?.select()
  }, [shareUrl])

  useEffect(() => {
    if (!openSlot) return
    function onPointerDown(event: MouseEvent) {
      if (!cardRef.current?.contains(event.target as Node)) setOpenSlot(null)
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenSlot(null)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [openSlot])

  function onAdd(event: FormEvent) {
    event.preventDefault()
    const result = addPlayer(sheet, { id: crypto.randomUUID(), name, gender })
    if (!result.ok) {
      setNameError(result.error)
      return
    }
    setSheet(result.sheet)
    setName('')
    setNameError(null)
    nameInputRef.current?.focus()
  }

  async function onSave() {
    const hash = teamSheetHash(sheet)
    const path = `${window.location.pathname}${window.location.search}${hash}`
    const url = `${window.location.origin}${path}`
    window.history.replaceState(null, '', path)
    shouldFocusLink.current = true
    setSavedHash(hash)
    try {
      await navigator.clipboard.writeText(url)
      setCopyState('copied')
    } catch {
      setCopyState('manual')
    }
  }

  return (
    <div className="min-h-screen bg-ink-50 text-ink-900">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <h1 className="text-2xl font-semibold tracking-tight">Team sheet</h1>
          <button
            type="button"
            onClick={() => void onSave()}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Save
          </button>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">
          Type your squad, then fill in the card. Save makes a link you can open again or share.
        </p>
        {loaded.linkError && (
          <p role="alert" className="mt-3 text-sm text-loss-700">
            This link could not be read. Starting a blank sheet.
          </p>
        )}
        {shareUrl && (
          <div className="mt-4">
            <p className="text-sm text-ink-600" aria-live="polite">
              {copyState === 'copied'
                ? 'Link copied.'
                : copyState === 'manual'
                  ? 'Copy this address to share the sheet.'
                  : 'Share this address to open the same sheet.'}
            </p>
            <input
              ref={linkRef}
              readOnly
              value={shareUrl}
              aria-label="Share link"
              spellCheck={false}
              onFocus={(event) => event.currentTarget.select()}
              className="mt-2 h-11 w-full rounded-lg border border-ink-200 bg-white px-3 font-mono text-xs text-ink-800 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        )}
        {savedHash && !linkMatches && (
          <p className="mt-3 text-sm text-ink-600" aria-live="polite">
            Save again to include your latest changes.
          </p>
        )}

        <div className="mt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start lg:gap-x-6 lg:gap-y-4">
          <section className="rounded-xl border border-ink-200 bg-white p-4">
            <h2 className="text-sm font-semibold">Squad</h2>
            {sheet.players.length === 0 && (
              <p className="mt-1 text-sm text-ink-500">
                Add every player in the squad, including anyone who might not get on the card.
              </p>
            )}
            <form onSubmit={onAdd} className="mt-3 space-y-3">
              <label className="block" htmlFor="squad-name">
                <span className="text-xs font-medium text-ink-500">Name</span>
                <input
                  ref={nameInputRef}
                  id="squad-name"
                  value={name}
                  autoComplete="off"
                  autoCapitalize="words"
                  onChange={(event) => {
                    setName(event.target.value)
                    setNameError(null)
                  }}
                  className="mt-1 h-11 w-full rounded-lg border border-ink-200 bg-white px-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <div className="flex items-center gap-2">
                <div
                  role="group"
                  aria-label="Gender"
                  className="inline-flex rounded-lg border border-ink-200 bg-white p-1"
                >
                  <GenderChoice label="Man" pressed={gender === 'man'} onPress={() => setGender('man')} />
                  <GenderChoice label="Woman" pressed={gender === 'woman'} onPress={() => setGender('woman')} />
                </div>
                <button
                  type="submit"
                  disabled={name.trim().length === 0}
                  className="ml-auto inline-flex h-11 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500"
                >
                  Add
                </button>
              </div>
              {nameError && (
                <p role="alert" className="text-sm text-loss-700">
                  {nameError}
                </p>
              )}
            </form>
            {sheet.players.length > 0 && (
              <ul className="mt-3 border-t border-ink-100">
                {sheet.players.map((player) => (
                  <li key={player.id} className="flex items-center justify-between gap-3 border-b border-ink-100 py-1.5">
                    <p className="min-w-0 truncate text-sm">
                      <span className="font-medium">{player.name}</span>
                      <span className="ml-2 text-ink-500">{player.gender === 'man' ? 'Man' : 'Woman'}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSheet(removePlayer(sheet, player.id))
                        if (openSlot && sheet.slots[openSlot] === player.id) setOpenSlot(null)
                      }}
                      className="shrink-0 rounded-md px-2 py-1 text-sm text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section ref={cardRef} className="mt-4 overflow-hidden rounded-xl border border-ink-200 bg-white lg:col-start-1 lg:mt-0">
            {RUBBER_GROUPS.map((group, groupIndex) => (
              <div key={group.id} className={groupIndex === 0 ? undefined : 'border-t border-ink-200'}>
                {group.rubbers.map((rubber, rubberIndex) => (
                  <RubberRow
                    key={rubber.id}
                    group={group}
                    rubber={rubber}
                    divided={rubberIndex > 0}
                    sheet={sheet}
                    openSlot={openSlot}
                    onToggleSlot={(slotId) => setOpenSlot((current) => (current === slotId ? null : slotId))}
                    onAssign={(slotId, playerId) => {
                      setSheet(assignPlayer(sheet, slotId, playerId))
                      setOpenSlot(null)
                    }}
                    onClear={(slotId) => {
                      setSheet(clearSlot(sheet, slotId))
                      setOpenSlot(null)
                    }}
                  />
                ))}
              </div>
            ))}
          </section>

          <aside className="mt-6 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mt-0">
            <div className="lg:sticky lg:top-6">
              <Summary summary={summary} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function GenderChoice({
  label,
  pressed,
  onPress,
}: {
  label: string
  pressed: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPress}
      className={`h-9 rounded-md px-3 text-sm font-medium ${
        pressed ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-50'
      }`}
    >
      {label}
    </button>
  )
}

function RubberRow({
  group,
  rubber,
  divided,
  sheet,
  openSlot,
  onToggleSlot,
  onAssign,
  onClear,
}: {
  group: RubberGroupDef
  rubber: RubberDef
  divided: boolean
  sheet: TeamSheetState
  openSlot: SlotId | null
  onToggleSlot: (slotId: SlotId) => void
  onAssign: (slotId: SlotId, playerId: string) => void
  onClear: (slotId: SlotId) => void
}) {
  const style = getDisciplineFamilyStyle(group.family)
  const openDef = rubber.slots.find((slot) => slot.id === openSlot) ?? null
  const pair = rubber.slots.length === 2
  return (
    <div className={divided ? 'border-t border-ink-100' : undefined}>
      <div className="flex items-center gap-2 px-2 py-1">
        <span className={`h-5 w-1 shrink-0 rounded-full ${style.accentClass}`} aria-hidden />
        <span className="w-9 shrink-0 text-xs font-semibold tracking-wide text-ink-800">{rubber.id}</span>
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <SlotButton
            slot={rubber.slots[0]!}
            sheet={sheet}
            rubberId={rubber.id}
            sideLabel={pair && !rubber.slots[0]!.placeLabel ? 'first player' : null}
            open={openSlot === rubber.slots[0]!.id}
            onToggle={() => onToggleSlot(rubber.slots[0]!.id)}
          />
          {pair && (
            <>
              <span className="shrink-0 text-xs text-ink-400" aria-hidden>
                &
              </span>
              <SlotButton
                slot={rubber.slots[1]!}
                sheet={sheet}
                rubberId={rubber.id}
                sideLabel={rubber.slots[1]!.placeLabel ? null : 'second player'}
                open={openSlot === rubber.slots[1]!.id}
                onToggle={() => onToggleSlot(rubber.slots[1]!.id)}
              />
            </>
          )}
        </div>
      </div>
      {openDef && (
        <PlayerPicker
          slot={openDef}
          sheet={sheet}
          heading={openDef.placeLabel ? `${rubber.id}, ${openDef.placeLabel}` : rubber.id}
          onAssign={(playerId) => onAssign(openDef.id, playerId)}
          onClear={() => onClear(openDef.id)}
        />
      )}
    </div>
  )
}

function SlotButton({
  slot,
  sheet,
  rubberId,
  sideLabel,
  open,
  onToggle,
}: {
  slot: RubberSlotDef
  sheet: TeamSheetState
  rubberId: string
  sideLabel: string | null
  open: boolean
  onToggle: () => void
}) {
  const player = sheet.players.find((item) => item.id === sheet.slots[slot.id])
  const label = player?.name ?? slot.emptyLabel
  const place = slot.placeLabel ?? sideLabel
  const where = place ? `${rubberId}, ${place}` : rubberId
  const spoken = player ? `${player.name}, ${where}` : place ? where : `${slot.emptyLabel}, ${rubberId}`
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={spoken}
      onClick={onToggle}
      className={`flex h-8 min-w-0 flex-1 items-center rounded-md border bg-white px-2 text-left text-sm ${
        open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-ink-200 hover:border-ink-300'
      }`}
    >
      <span className={`truncate ${player ? 'font-medium text-ink-900' : 'text-ink-400'}`}>{label}</span>
    </button>
  )
}

function PlayerPicker({
  slot,
  sheet,
  heading,
  onAssign,
  onClear,
}: {
  slot: RubberSlotDef
  sheet: TeamSheetState
  heading: string
  onAssign: (playerId: string) => void
  onClear: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const labelId = useId()
  const rows = pickerRows(sheet, slot.id)
  const filled = Boolean(sheet.slots[slot.id])
  const emptyCopy = slot.gender === 'man' ? 'Add a man to the squad first.' : 'Add a woman to the squad first.'

  useEffect(() => {
    panelRef.current?.scrollIntoView({ block: 'nearest' })
  }, [])

  return (
    <div
      ref={panelRef}
      role="group"
      aria-labelledby={labelId}
      className="mx-2 mb-1 rounded-md border border-ink-200 bg-ink-50 p-1"
    >
      <p id={labelId} className="px-2 py-1 text-xs font-medium text-ink-500">
        {heading}
      </p>
      {filled && (
        <button
          type="button"
          onClick={onClear}
          className="flex w-full rounded-md px-2 py-1.5 text-left text-sm font-medium text-ink-800 hover:bg-white"
        >
          Remove from this rubber
        </button>
      )}
      {rows.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-ink-500">{emptyCopy}</p>
      ) : (
        <ul>
          {rows.map((row) => (
            <li key={row.player.id}>
              <button
                type="button"
                disabled={row.status === 'blocked'}
                aria-pressed={row.status === 'selected'}
                onClick={() => {
                  if (row.status === 'available') onAssign(row.player.id)
                }}
                className={`flex w-full items-baseline justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm disabled:cursor-default ${
                  row.status === 'selected' ? 'bg-white font-medium ring-1 ring-brand-300' : 'hover:bg-white'
                }`}
              >
                <span className={`min-w-0 truncate ${row.status === 'blocked' ? 'text-ink-400' : 'text-ink-900'}`}>
                  {row.player.name}
                </span>
                {row.note && (
                  <span className="shrink-0 text-xs text-ink-500">{row.note}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Summary({
  summary,
}: {
  summary: ReturnType<typeof summariseTeamSheet>
}) {
  const status = openPlacesLabel(summary.openPlaces)
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Summary</h2>
      <p className={`mt-2 text-sm font-medium ${summary.openPlaces === 0 ? 'text-court-700' : 'text-ink-700'}`}>
        {status}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">
        Only one man and one woman can play all three.
      </p>
      <SummaryGroup title="Men" entries={summary.men} empty="No men in the squad yet." />
      <SummaryGroup title="Women" entries={summary.women} empty="No women in the squad yet." />
    </section>
  )
}

function SummaryGroup({
  title,
  entries,
  empty,
}: {
  title: string
  entries: ReturnType<typeof summariseTeamSheet>['men']
  empty: string
}) {
  return (
    <div className="mt-3 border-t border-ink-100 pt-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-medium tracking-wide text-ink-500">{title}</h3>
        {entries.length > 0 && (
          <span className="text-xs font-medium text-ink-500" title="Rubbers played in this match">
            Rubbers
          </span>
        )}
      </div>
      {entries.length === 0 ? (
        <p className="mt-1.5 text-sm text-ink-400">{empty}</p>
      ) : (
        <ul className="mt-1">
          {entries.map((entry) => (
            <li key={entry.player.id} className="flex items-center gap-2 py-1">
              <p className="flex min-w-0 flex-1 items-baseline gap-2 text-sm">
                <span className="truncate font-medium">{entry.player.name}</span>
                {entry.allThree && <span className="shrink-0 text-xs font-medium text-brand-700">All three</span>}
              </p>
              {entry.rubbers.length > 0 && (
                <div className="flex shrink-0 gap-1">
                  {entry.rubbers.map((code) => {
                    const style = getDisciplineFamilyStyle(disciplineFamilyForRubber(code))
                    return (
                      <span
                        key={code}
                        className={`rounded px-1 py-0.5 text-[11px] font-semibold tracking-wide text-ink-800 ${style.panelBgClass}`}
                      >
                        {code}
                      </span>
                    )
                  })}
                </div>
              )}
              <p
                className="w-5 shrink-0 text-right text-sm font-semibold tabular-nums"
                aria-label={`${entry.matchCount} rubbers in this match`}
              >
                {entry.matchCount}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
