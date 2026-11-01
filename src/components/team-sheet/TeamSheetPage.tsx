import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type FormEvent,
  type PointerEvent,
} from 'react'
import { getDisciplineFamilyStyle } from '../../lib/disciplineStyle'
import { readTeamSheetLink, teamSheetHash } from '../../lib/teamSheetLink'
import {
  addPartnership,
  addPlayer,
  assignPlayer,
  clearSlot,
  createEmptyTeamSheet,
  disciplineFamilyForRubber,
  openPlacesLabel,
  pickerRows,
  removePartnership,
  removePlayer,
  RUBBER_GROUPS,
  setPartnershipStrength,
  setPlayerGender,
  sheetIssues,
  summariseTeamSheet,
  type PartnershipStrength,
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
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [openSlot, setOpenSlot] = useState<SlotId | null>(null)
  const [savedHash, setSavedHash] = useState<string | null>(loaded.savedHash)
  const [copyState, setCopyState] = useState<'copied' | 'manual' | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const playerDragRef = useRef<{ id: string; x: number; y: number; moved: boolean; over: TeamGender | null } | null>(null)
  const [playerDrag, setPlayerDrag] = useState<{ id: string; x: number; y: number; over: TeamGender | null } | null>(null)
  const nativeDragId = useRef<string | null>(null)
  const gestureHandled = useRef(false)
  const [dropOver, setDropOver] = useState<TeamGender | null>(null)
  const linkRef = useRef<HTMLInputElement>(null)
  const shouldFocusLink = useRef(false)
  const summary = useMemo(() => summariseTeamSheet(sheet), [sheet])
  const issues = useMemo(() => sheetIssues(sheet), [sheet])
  const [issuesChecked, setIssuesChecked] = useState(false)
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

  useEffect(() => {
    if (addingPlayer) nameInputRef.current?.focus()
  }, [addingPlayer])

  function closePlayerForm() {
    setAddingPlayer(false)
    setName('')
    setNameError(null)
  }

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

  function finishAdding() {
    if (name.trim().length === 0) {
      closePlayerForm()
      return
    }
    const result = addPlayer(sheet, { id: crypto.randomUUID(), name, gender })
    if (!result.ok) {
      setNameError(result.error)
      return
    }
    setSheet(result.sheet)
    closePlayerForm()
  }

  function movePlayer(playerId: string, nextGender: TeamGender) {
    if (gestureHandled.current) return
    const player = sheet.players.find((item) => item.id === playerId)
    if (!player || player.gender === nextGender) return
    gestureHandled.current = true
    setSheet(setPlayerGender(sheet, playerId, nextGender))
    if (openSlot && sheet.slots[openSlot] === playerId) setOpenSlot(null)
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
            <h2 className="text-sm font-semibold">Squad setup</h2>
            {sheet.players.length === 0 && !addingPlayer && (
              <p className="mt-1 text-sm text-ink-500">
                Add every player in the squad, including anyone who might not get on the card.
              </p>
            )}
            {addingPlayer ? (
              <form onSubmit={onAdd} className="mt-3 space-y-3">
                <label className="block" htmlFor="squad-name">
                  <span className="text-xs font-medium text-ink-500">Player name</span>
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
                    className="mt-1 h-8 w-full rounded-md border border-ink-200 bg-white px-2 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Gender"
                    className="inline-flex rounded-md border border-ink-200 bg-white p-0.5"
                  >
                    <GenderChoice label="M" spoken="Man" pressed={gender === 'man'} onPress={() => setGender('man')} />
                    <GenderChoice label="W" spoken="Woman" pressed={gender === 'woman'} onPress={() => setGender('woman')} />
                  </div>
                  <button
                    type="submit"
                    disabled={name.trim().length === 0}
                    className="inline-flex h-8 items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={finishAdding}
                    className="inline-flex h-8 items-center justify-center rounded-md px-2 text-sm text-ink-500 hover:text-ink-900"
                  >
                    Done
                  </button>
                </div>
                {nameError && (
                  <p role="alert" className="text-sm text-loss-700">
                    {nameError}
                  </p>
                )}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingPlayer(true)}
                className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 hover:border-ink-300"
              >
                Add players
              </button>
            )}
            {sheet.players.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {(['man', 'woman'] as const).map((column) => (
                  <PlayerColumn
                    key={column}
                    gender={column}
                    title={column === 'man' ? 'Men' : 'Women'}
                    players={sheet.players.filter((player) => player.gender === column)}
                    sheet={sheet}
                    dragOver={
                      (playerDrag !== null &&
                        playerDrag.over === column &&
                        sheet.players.find((player) => player.id === playerDrag.id)?.gender !== column) ||
                      (dropOver === column &&
                        sheet.players.find((player) => player.id === nativeDragId.current)?.gender !== column)
                    }
                    onGender={(playerId, nextGender) => {
                      gestureHandled.current = false
                      setSheet(setPlayerGender(sheet, playerId, nextGender))
                      if (openSlot && sheet.slots[openSlot] === playerId) setOpenSlot(null)
                    }}
                    onRemove={(playerId) => {
                      setSheet(removePlayer(sheet, playerId))
                      if (openSlot && sheet.slots[openSlot] === playerId) setOpenSlot(null)
                    }}
                    onPointerDown={(event, playerId) => {
                      if ((event.target as HTMLElement).closest('button')) return
                      gestureHandled.current = false
                      playerDragRef.current = {
                        id: playerId,
                        x: event.clientX,
                        y: event.clientY,
                        moved: false,
                        over: null,
                      }
                      try {
                        event.currentTarget.setPointerCapture(event.pointerId)
                      } catch {
                        // A mouse drag the browser handles itself still lands on drop.
                      }
                    }}
                    onPointerMove={(event) => {
                      const drag = playerDragRef.current
                      if (!drag) return
                      const distance = (event.clientX - drag.x) ** 2 + (event.clientY - drag.y) ** 2
                      if (!drag.moved && distance < 36) return
                      drag.moved = true
                      const hit = document.elementFromPoint(event.clientX, event.clientY)
                      const columnHit = hit?.closest('[data-squad-column]')?.getAttribute('data-squad-column')
                      drag.over = columnHit === 'man' || columnHit === 'woman' ? columnHit : null
                      setPlayerDrag({ id: drag.id, x: event.clientX, y: event.clientY, over: drag.over })
                    }}
                    onPointerUp={() => {
                      const drag = playerDragRef.current
                      playerDragRef.current = null
                      setPlayerDrag(null)
                      if (!drag?.moved || !drag.over) return
                      movePlayer(drag.id, drag.over)
                    }}
                    onDragStart={(event, playerId) => {
                      if ((event.target as HTMLElement).closest('button')) {
                        event.preventDefault()
                        return
                      }
                      gestureHandled.current = false
                      nativeDragId.current = playerId
                      event.dataTransfer.setData('text/plain', playerId)
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                    onDragOver={(event, columnGender) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                      setDropOver((current) => (current === columnGender ? current : columnGender))
                    }}
                    onDrop={(event, columnGender) => {
                      event.preventDefault()
                      const playerId = event.dataTransfer.getData('text/plain') || nativeDragId.current
                      nativeDragId.current = null
                      setDropOver(null)
                      if (playerId) movePlayer(playerId, columnGender)
                    }}
                    onDragEnd={() => {
                      nativeDragId.current = null
                      setDropOver(null)
                    }}
                  />
                ))}
              </div>
            )}
            {playerDrag && (
              <div
                className="pointer-events-none fixed z-50 rounded-md border border-ink-200 bg-white px-2 py-1 text-sm font-medium shadow-sm"
                style={{ left: playerDrag.x + 12, top: playerDrag.y + 12 }}
              >
                {sheet.players.find((player) => player.id === playerDrag.id)?.name}
              </div>
            )}
            {sheet.players.length >= 2 && (
              <Partnerships
                sheet={sheet}
                onChange={setSheet}
              />
            )}
          </section>

          <section ref={cardRef} className="mt-4 overflow-hidden rounded-xl border border-ink-200 bg-white lg:col-start-1 lg:mt-0">
            <h2 className="border-b border-ink-100 px-3 py-2 text-sm font-semibold">Team card</h2>
            {RUBBER_GROUPS.map((group, groupIndex) => (
              <div key={group.id} className={groupIndex === 0 ? undefined : 'border-t border-ink-200'}>
                {group.rubbers.map((rubber) => (
                  <RubberRow
                    key={rubber.id}
                    group={group}
                    rubber={rubber}
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
            <div className="space-y-4 lg:sticky lg:top-6">
              <Summary summary={summary} />
              <IssuesPanel
                issues={issues}
                revealed={issuesChecked || summary.openPlaces === 0}
                onCheck={() => setIssuesChecked(true)}
              />
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

function PlayerColumn({
  title,
  gender,
  players,
  sheet,
  dragOver,
  onGender,
  onRemove,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  title: string
  gender: TeamGender
  players: TeamSheetState['players']
  sheet: TeamSheetState
  dragOver: boolean
  onGender: (playerId: string, gender: TeamGender) => void
  onRemove: (playerId: string) => void
  onPointerDown: (event: PointerEvent<HTMLLIElement>, playerId: string) => void
  onPointerMove: (event: PointerEvent<HTMLLIElement>) => void
  onPointerUp: () => void
  onDragStart: (event: DragEvent<HTMLLIElement>, playerId: string) => void
  onDragOver: (event: DragEvent<HTMLDivElement>, gender: TeamGender) => void
  onDrop: (event: DragEvent<HTMLDivElement>, gender: TeamGender) => void
  onDragEnd: () => void
}) {
  return (
    <div
      data-squad-column={gender}
      onDragOver={(event) => onDragOver(event, gender)}
      onDrop={(event) => onDrop(event, gender)}
      className={`min-w-0 rounded-md p-1 ${dragOver ? 'bg-brand-50 ring-2 ring-brand-200' : ''}`}
    >
      <h3
        className={`flex items-center gap-1.5 text-xs font-medium tracking-wide ${
          gender === 'man' ? 'text-[#1577a8]' : 'text-[#a33b6b]'
        }`}
      >
        <GenderMark gender={gender} className="h-4 w-4" />
        <span className="text-ink-500">{title}</span>
      </h3>
      <ul className="mt-1.5 flex min-h-8 flex-col gap-1.5">
        {players.map((player) => {
          const nextGender = player.gender === 'man' ? 'woman' : 'man'
          const onCard = Object.values(sheet.slots).includes(player.id)
          return (
            <li
              key={player.id}
              draggable
              onDragStart={(event) => onDragStart(event, player.id)}
              onDragEnd={onDragEnd}
              onPointerDown={(event) => onPointerDown(event, player.id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              className="flow-root cursor-grab touch-none select-none rounded-md border border-ink-200 bg-ink-50 py-0.5 pl-2 pr-1 active:cursor-grabbing"
            >
              <span className="float-right ml-1 flex items-center">
                <button
                  type="button"
                  aria-label={`${player.name} is a ${player.gender}. Switch to ${nextGender}.`}
                  title={
                    onCard
                      ? `Switch to ${nextGender}. This clears their places on the card.`
                      : `Switch to ${nextGender}.`
                  }
                  onClick={() => onGender(player.id, nextGender)}
                  className={`inline-flex shrink-0 items-center rounded-md px-1 py-0.5 text-[11px] font-medium ring-1 ${
                    player.gender === 'man'
                      ? 'bg-[#e7f4fb] text-[#1577a8] ring-[#c5e4f4]'
                      : 'bg-[#fdeef4] text-[#a33b6b] ring-[#f3d0e0]'
                  }`}
                >
                  {player.gender === 'man' ? 'M' : 'W'}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${player.name}`}
                  onClick={() => onRemove(player.id)}
                  className="shrink-0 rounded-md px-1 text-sm leading-none text-ink-400 hover:text-ink-900"
                >
                  ×
                </button>
              </span>
              <span className="break-words text-sm font-medium">{player.name}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Partnerships({ sheet, onChange }: { sheet: TeamSheetState; onChange: (sheet: TeamSheetState) => void }) {
  const [adding, setAdding] = useState(false)
  const [playerA, setPlayerA] = useState('')
  const [playerB, setPlayerB] = useState('')
  const [strength, setStrength] = useState<PartnershipStrength>('lots')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setPlayerA((current) => (sheet.players.some((player) => player.id === current) ? current : ''))
    setPlayerB((current) => (sheet.players.some((player) => player.id === current) ? current : ''))
  }, [sheet.players])

  function closeForm() {
    setAdding(false)
    setPlayerA('')
    setPlayerB('')
    setStrength('lots')
    setError(null)
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const result = addPartnership(sheet, playerA, playerB, strength)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onChange(result.sheet)
    closeForm()
  }

  return (
    <div className="mt-3 border-t border-ink-100 pt-3">
      <h3 className="text-xs font-medium tracking-wide text-ink-500">Partnerships</h3>
      {sheet.partnerships.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {sheet.partnerships.map((pair) => {
            const first = sheet.players.find((player) => player.id === pair.playerIds[0])
            const second = sheet.players.find((player) => player.id === pair.playerIds[1])
            if (!first || !second) return null
            const next: PartnershipStrength = pair.strength === 'lots' ? 'bit' : 'lots'
            const spoken = pair.strength === 'lots' ? 'lots of experience' : 'a bit of experience'
            return (
              <li
                key={pair.id}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-ink-200 bg-white py-0.5 pl-2 pr-1"
              >
                <span className="truncate text-sm">
                  {first.name} & {second.name}
                </span>
                <button
                  type="button"
                  aria-label={`${first.name} and ${second.name}, ${spoken}. Switch intensity.`}
                  onClick={() => onChange(setPartnershipStrength(sheet, pair.id, next))}
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                    pair.strength === 'lots' ? 'bg-brand-50 text-brand-800' : 'bg-ink-100 text-ink-600'
                  }`}
                >
                  {pair.strength === 'lots' ? 'Lots' : 'A bit'}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${first.name} and ${second.name}`}
                  onClick={() => onChange(removePartnership(sheet, pair.id))}
                  className="shrink-0 rounded-md px-1 text-sm leading-none text-ink-400 hover:text-ink-900"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {adding ? (
        <form onSubmit={onSubmit} className="mt-2 flex flex-wrap items-center gap-2">
          <p className="w-full text-xs text-ink-500">How much they have played together.</p>
          <select
            aria-label="First player"
            value={playerA}
            onChange={(event) => {
              setPlayerA(event.target.value)
              setError(null)
            }}
            className="h-8 min-w-0 flex-1 basis-36 rounded-md border border-ink-200 bg-white px-2 text-sm text-ink-900"
          >
            <option value="">Choose player</option>
            {sheet.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <span className="text-xs text-ink-400" aria-hidden>
            &
          </span>
          <select
            aria-label="Second player"
            value={playerB}
            onChange={(event) => {
              setPlayerB(event.target.value)
              setError(null)
            }}
            className="h-8 min-w-0 flex-1 basis-36 rounded-md border border-ink-200 bg-white px-2 text-sm text-ink-900"
          >
            <option value="">Choose player</option>
            {sheet.players.map((player) => (
              <option key={player.id} value={player.id}>
                {player.name}
              </option>
            ))}
          </select>
          <div role="group" aria-label="Experience together" className="inline-flex rounded-md border border-ink-200 bg-white p-0.5">
            <GenderChoice label="Lots" pressed={strength === 'lots'} onPress={() => setStrength('lots')} />
            <GenderChoice label="A bit" pressed={strength === 'bit'} onPress={() => setStrength('bit')} />
          </div>
          <button
            type="submit"
            disabled={playerA.length === 0 || playerB.length === 0}
            className="inline-flex h-8 items-center justify-center rounded-md bg-brand-600 px-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500"
          >
            Add
          </button>
          <button
            type="button"
            onClick={closeForm}
            className="inline-flex h-8 items-center justify-center rounded-md px-2 text-sm text-ink-500 hover:text-ink-900"
          >
            Cancel
          </button>
          {error && (
            <p role="alert" className="w-full text-sm text-loss-700">
              {error}
            </p>
          )}
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="mt-2 inline-flex h-8 items-center justify-center rounded-md border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 hover:border-ink-300"
        >
          Add pair
        </button>
      )}
    </div>
  )
}

function GenderMark({ gender, className = 'h-3.5 w-3.5' }: { gender: TeamGender; className?: string }) {
  if (gender === 'man') {
    return (
      <svg viewBox="0 0 16 16" className={`${className} shrink-0`} fill="none" aria-hidden>
        <circle cx="6.5" cy="9.2" r="3.1" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8.8 6.9 12.4 3.3M12.4 3.3H9.4M12.4 3.3v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" className={`${className} shrink-0`} fill="none" aria-hidden>
      <circle cx="8" cy="5.6" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8.7v4.6M6 11.2h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function GenderChoice({
  label,
  spoken,
  pressed,
  onPress,
}: {
  label: string
  spoken?: string
  pressed: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-label={spoken}
      aria-pressed={pressed}
      onClick={onPress}
      className={`h-7 rounded-md px-2.5 text-sm font-medium ${
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
  sheet,
  openSlot,
  onToggleSlot,
  onAssign,
  onClear,
}: {
  group: RubberGroupDef
  rubber: RubberDef
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
    <div>
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

function Summary({ summary }: { summary: ReturnType<typeof summariseTeamSheet> }) {
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

function IssuesPanel({
  issues,
  revealed,
  onCheck,
}: {
  issues: ReturnType<typeof sheetIssues>
  revealed: boolean
  onCheck: () => void
}) {
  return (
    <section className="rounded-xl border border-ink-200 bg-white p-4">
      <h2 className="text-sm font-semibold">Potential issues</h2>
      {revealed ? (
        issues.length === 0 ? (
          <p className="mt-2 text-sm text-ink-500">No issues.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {issues.map((issue) => (
              <li
                key={issue.id}
                className={
                  issue.tone === 'warning'
                    ? 'rounded-md bg-loss-50 px-2 py-1.5 text-sm leading-snug text-loss-700'
                    : 'text-sm leading-snug text-ink-700'
                }
              >
                {issue.text}
              </li>
            ))}
          </ul>
        )
      ) : (
        <button
          type="button"
          onClick={onCheck}
          className="mt-3 inline-flex h-8 items-center justify-center rounded-md border border-ink-200 bg-white px-3 text-sm font-medium text-ink-800 hover:border-ink-300"
        >
          Check for issues
        </button>
      )}
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
            <li key={entry.player.id} className="flex items-start gap-2 py-1">
              <p className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
                <span className="break-words font-medium">{entry.player.name}</span>
                {entry.allThree && (
                  <span className="shrink-0 rounded-md bg-loss-50 px-1.5 py-0.5 text-[11px] font-semibold text-loss-700">
                    All three
                  </span>
                )}
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
