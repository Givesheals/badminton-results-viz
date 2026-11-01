import type { SelectableDisciplineFamily } from './disciplineStyle'

/**
 * County team card.
 * Eleven rubbers: 2 men's singles, 2 women's singles, 2 men's doubles,
 * 2 women's doubles, 3 mixed doubles.
 * A player takes at most one singles, one doubles, and one mixed.
 * Only one man and one woman can take all three.
 */

export type TeamGender = 'man' | 'woman'

export type SlotId =
  | 'MS1'
  | 'MS2'
  | 'WS1'
  | 'WS2'
  | 'MD1A'
  | 'MD1B'
  | 'MD2A'
  | 'MD2B'
  | 'WD1A'
  | 'WD1B'
  | 'WD2A'
  | 'WD2B'
  | 'XD1M'
  | 'XD1W'
  | 'XD2M'
  | 'XD2W'
  | 'XD3M'
  | 'XD3W'

export type SquadPlayer = {
  id: string
  name: string
  gender: TeamGender
}

/** How much the two players have played together. */
export type PartnershipStrength = 'lots' | 'bit'

export type Partnership = {
  id: string
  playerIds: [string, string]
  strength: PartnershipStrength
}

export type TeamSheetState = {
  players: SquadPlayer[]
  slots: Record<SlotId, string | null>
  partnerships: Partnership[]
}

export type SheetIssue = {
  id: string
  text: string
  tone: 'warning' | 'note'
}

export type RubberSlotDef = {
  id: SlotId
  gender: TeamGender
  emptyLabel: string
  /** Set when the two places in a rubber are different, as in mixed. */
  placeLabel: string | null
}

export type RubberDef = {
  id: string
  label: string
  slots: RubberSlotDef[]
}

export type RubberGroupDef = {
  id: string
  title: string
  family: SelectableDisciplineFamily
  rubbers: RubberDef[]
}

export type PickerStatus = 'selected' | 'available' | 'blocked'

export type PickerRow = {
  player: SquadPlayer
  status: PickerStatus
  note: string | null
}

export type SummaryEntry = {
  player: SquadPlayer
  matchCount: number
  rubbers: string[]
  allThree: boolean
}

export type AddPlayerResult =
  | { ok: true; sheet: TeamSheetState }
  | { ok: false; error: string }

export type AddPartnershipResult = AddPlayerResult

const RUBBER_CODES = ['MS1', 'MS2', 'WS1', 'WS2', 'MD1', 'MD2', 'WD1', 'WD2', 'XD1', 'XD2', 'XD3'] as const

function place(
  id: SlotId,
  gender: TeamGender,
  emptyLabel: string,
  placeLabel: string | null = null,
): RubberSlotDef {
  return { id, gender, emptyLabel, placeLabel }
}

export const RUBBER_GROUPS: RubberGroupDef[] = [
  {
    id: 'mens-singles',
    title: "Men's singles",
    family: 'singles',
    rubbers: [
      { id: 'MS1', label: '1', slots: [place('MS1', 'man', 'Choose player')] },
      { id: 'MS2', label: '2', slots: [place('MS2', 'man', 'Choose player')] },
    ],
  },
  {
    id: 'womens-singles',
    title: "Women's singles",
    family: 'singles',
    rubbers: [
      { id: 'WS1', label: '1', slots: [place('WS1', 'woman', 'Choose player')] },
      { id: 'WS2', label: '2', slots: [place('WS2', 'woman', 'Choose player')] },
    ],
  },
  {
    id: 'mens-doubles',
    title: "Men's doubles",
    family: 'doubles',
    rubbers: [
      {
        id: 'MD1',
        label: '1',
        slots: [place('MD1A', 'man', 'Choose player'), place('MD1B', 'man', 'Choose player')],
      },
      {
        id: 'MD2',
        label: '2',
        slots: [place('MD2A', 'man', 'Choose player'), place('MD2B', 'man', 'Choose player')],
      },
    ],
  },
  {
    id: 'womens-doubles',
    title: "Women's doubles",
    family: 'doubles',
    rubbers: [
      {
        id: 'WD1',
        label: '1',
        slots: [place('WD1A', 'woman', 'Choose player'), place('WD1B', 'woman', 'Choose player')],
      },
      {
        id: 'WD2',
        label: '2',
        slots: [place('WD2A', 'woman', 'Choose player'), place('WD2B', 'woman', 'Choose player')],
      },
    ],
  },
  {
    id: 'mixed',
    title: 'Mixed doubles',
    family: 'mixed',
    rubbers: [
      {
        id: 'XD1',
        label: '1',
        slots: [place('XD1M', 'man', 'Man', 'Man'), place('XD1W', 'woman', 'Woman', 'Woman')],
      },
      {
        id: 'XD2',
        label: '2',
        slots: [place('XD2M', 'man', 'Man', 'Man'), place('XD2W', 'woman', 'Woman', 'Woman')],
      },
      {
        id: 'XD3',
        label: '3',
        slots: [place('XD3M', 'man', 'Man', 'Man'), place('XD3W', 'woman', 'Woman', 'Woman')],
      },
    ],
  },
]

export const SLOT_IDS: SlotId[] = RUBBER_GROUPS.flatMap((group) =>
  group.rubbers.flatMap((rubber) => rubber.slots.map((slot) => slot.id)),
)

type SlotMeta = {
  id: SlotId
  gender: TeamGender
  family: SelectableDisciplineFamily
  rubberId: string
  partnerId: SlotId | null
}

const SLOT_META = new Map<SlotId, SlotMeta>()

for (const group of RUBBER_GROUPS) {
  for (const rubber of group.rubbers) {
    for (const slot of rubber.slots) {
      const partner = rubber.slots.find((other) => other.id !== slot.id) ?? null
      SLOT_META.set(slot.id, {
        id: slot.id,
        gender: slot.gender,
        family: group.family,
        rubberId: rubber.id,
        partnerId: partner?.id ?? null,
      })
    }
  }
}

export function createEmptyTeamSheet(): TeamSheetState {
  const slots = {} as Record<SlotId, string | null>
  for (const id of SLOT_IDS) slots[id] = null
  return { players: [], slots, partnerships: [] }
}

export function normalisePlayerName(name: string): string {
  return name.trim().replace(/\s+/g, ' ')
}

export function addPlayer(
  state: TeamSheetState,
  player: { id: string; name: string; gender: TeamGender },
): AddPlayerResult {
  const name = normalisePlayerName(player.name)
  if (!name) return { ok: false, error: 'Enter a name.' }
  const duplicate = state.players.some((existing) => existing.name.toLowerCase() === name.toLowerCase())
  if (duplicate) return { ok: false, error: 'That name is already in the squad.' }
  return {
    ok: true,
    sheet: {
      ...state,
      players: [...state.players, { id: player.id, name, gender: player.gender }],
    },
  }
}

export function removePlayer(state: TeamSheetState, playerId: string): TeamSheetState {
  if (!state.players.some((player) => player.id === playerId)) return state
  const slots = { ...state.slots }
  for (const id of SLOT_IDS) {
    if (slots[id] === playerId) slots[id] = null
  }
  return {
    ...state,
    players: state.players.filter((player) => player.id !== playerId),
    slots,
    partnerships: state.partnerships.filter((pair) => !pair.playerIds.includes(playerId)),
  }
}

export function setPlayerGender(state: TeamSheetState, playerId: string, gender: TeamGender): TeamSheetState {
  const player = state.players.find((item) => item.id === playerId)
  if (!player || player.gender === gender) return state
  const slots = { ...state.slots }
  for (const id of SLOT_IDS) {
    if (slots[id] === playerId) slots[id] = null
  }
  return {
    ...state,
    players: state.players.map((item) => (item.id === playerId ? { ...item, gender } : item)),
    slots,
  }
}

export function addPartnership(
  state: TeamSheetState,
  playerAId: string,
  playerBId: string,
  strength: PartnershipStrength,
): AddPartnershipResult {
  if (!playerAId || !playerBId || playerAId === playerBId) {
    return { ok: false, error: 'Choose two different players.' }
  }
  const players = new Map(state.players.map((player) => [player.id, player]))
  if (!players.has(playerAId) || !players.has(playerBId)) {
    return { ok: false, error: 'Choose two players from the squad.' }
  }
  const id = partnershipId(playerAId, playerBId)
  if (state.partnerships.some((pair) => pair.id === id)) {
    return { ok: false, error: 'That partnership is already recorded.' }
  }
  const order = new Map(state.players.map((player, index) => [player.id, index]))
  const playerIds: [string, string] =
    (order.get(playerAId) ?? 0) <= (order.get(playerBId) ?? 0)
      ? [playerAId, playerBId]
      : [playerBId, playerAId]
  return {
    ok: true,
    sheet: {
      ...state,
      partnerships: [...state.partnerships, { id, playerIds, strength }],
    },
  }
}

export function setPartnershipStrength(
  state: TeamSheetState,
  partnershipId: string,
  strength: PartnershipStrength,
): TeamSheetState {
  if (!state.partnerships.some((pair) => pair.id === partnershipId && pair.strength !== strength)) return state
  return {
    ...state,
    partnerships: state.partnerships.map((pair) => (pair.id === partnershipId ? { ...pair, strength } : pair)),
  }
}

export function removePartnership(state: TeamSheetState, partnershipId: string): TeamSheetState {
  if (!state.partnerships.some((pair) => pair.id === partnershipId)) return state
  return {
    ...state,
    partnerships: state.partnerships.filter((pair) => pair.id !== partnershipId),
  }
}

export function clearSlot(state: TeamSheetState, slotId: SlotId): TeamSheetState {
  if (!state.slots[slotId]) return state
  return { ...state, slots: { ...state.slots, [slotId]: null } }
}

export function assignPlayer(state: TeamSheetState, slotId: SlotId, playerId: string): TeamSheetState {
  const meta = SLOT_META.get(slotId)
  const player = state.players.find((item) => item.id === playerId)
  if (!meta || !player || player.gender !== meta.gender) return state
  if (decidePick(state, slotId, player).status !== 'available') return state

  const slots = { ...state.slots }
  for (const otherId of slotsInFamily(meta.family, meta.gender)) {
    if (otherId !== slotId && slots[otherId] === playerId) slots[otherId] = null
  }
  slots[slotId] = playerId
  return { ...state, slots }
}

export function pickerRows(state: TeamSheetState, slotId: SlotId): PickerRow[] {
  const meta = SLOT_META.get(slotId)
  if (!meta) return []
  return state.players
    .filter((player) => player.gender === meta.gender)
    .map((player) => {
      const decision = decidePick(state, slotId, player)
      return { player, status: decision.status, note: decision.note }
    })
}

export function countOpenPlaces(state: TeamSheetState): number {
  return SLOT_IDS.reduce((count, id) => count + (state.slots[id] ? 0 : 1), 0)
}

export function openPlacesLabel(count: number): string {
  if (count === 0) return 'Sheet complete'
  if (count === 1) return '1 match place still open'
  return `${count} match places still open`
}

export function summariseTeamSheet(state: TeamSheetState): {
  openPlaces: number
  men: SummaryEntry[]
  women: SummaryEntry[]
} {
  const order = new Map(state.players.map((player, index) => [player.id, index]))
  const entries = state.players.map((player) => toSummaryEntry(state, player))
  const byLoad = (a: SummaryEntry, b: SummaryEntry) =>
    b.matchCount - a.matchCount || (order.get(a.player.id) ?? 0) - (order.get(b.player.id) ?? 0)

  return {
    openPlaces: countOpenPlaces(state),
    men: entries.filter((entry) => entry.player.gender === 'man').sort(byLoad),
    women: entries.filter((entry) => entry.player.gender === 'woman').sort(byLoad),
  }
}

export function sheetIssues(state: TeamSheetState): SheetIssue[] {
  const issues: SheetIssue[] = []
  if (state.players.length === 0) {
    issues.push({
      id: 'empty-sheet',
      text: "Bruh... you haven't set your team up at all...",
      tone: 'note',
    })
  }
  pushLoadIssues(state, 'man', issues)
  pushLoadIssues(state, 'woman', issues)
  const names = new Map(state.players.map((player) => [player.id, player.name]))
  for (const pair of state.partnerships) {
    const [firstId, secondId] = pair.playerIds
    const first = names.get(firstId)
    const second = names.get(secondId)
    if (!first || !second || pairedRubber(state, firstId, secondId)) continue
    const experience = pair.strength === 'lots' ? 'lots of experience' : 'a bit of experience'
    issues.push({
      id: `pair:${pair.id}`,
      text: `${first} has ${experience} with ${second}, and they are not paired.`,
      tone: 'note',
    })
  }
  return issues
}

export function disciplineFamilyForRubber(code: string): SelectableDisciplineFamily {
  if (code.startsWith('XD')) return 'mixed'
  if (code.startsWith('MD') || code.startsWith('WD')) return 'doubles'
  return 'singles'
}

export function rubberCodeForSlot(slotId: SlotId): string {
  return slotId.slice(0, 3)
}

/** True when the address is the standalone team sheet, with or without a trailing slash. */
export function isTeamSheetPath(pathname: string, baseUrl = '/'): boolean {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
  const normalizedPath = pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
  return normalizedPath === `${normalizedBase}/team-sheet`
}

export function isTeamSheetPage(): boolean {
  if (typeof window === 'undefined') return false
  return isTeamSheetPath(window.location.pathname, import.meta.env.BASE_URL)
}

function pushLoadIssues(state: TeamSheetState, gender: TeamGender, issues: SheetIssue[]) {
  const players = state.players.filter((player) => player.gender === gender)
  const onThree = players.filter((player) => familiesOf(state, player.id).size === 3)
  const onZero = players.filter((player) => familiesOf(state, player.id).size === 0)
  const people = (count: number) => {
    if (gender === 'man') return count === 1 ? '1 man' : `${count} men`
    return count === 1 ? '1 woman' : `${count} women`
  }

  if (onThree.length > 1) {
    issues.push({
      id: `triple-limit:${gender}`,
      text: `You have ${people(onThree.length)} playing 3 disciplines. This is not allowed.`,
      tone: 'warning',
    })
  } else if (onThree[0]) {
    issues.push({
      id: `all-three:${onThree[0].id}`,
      text: `${onThree[0].name} is playing all three.`,
      tone: 'note',
    })
  }

  if (onZero.length > 0) {
    issues.push({
      id: `spare:${gender}`,
      text: `You have ${people(onZero.length)} playing 0 disciplines. This is allowed.`,
      tone: 'note',
    })
  }
}

function partnershipId(playerAId: string, playerBId: string): string {
  return [playerAId, playerBId].sort().join('|')
}

function pairedRubber(state: TeamSheetState, playerAId: string, playerBId: string): string | null {
  for (const group of RUBBER_GROUPS) {
    for (const rubber of group.rubbers) {
      if (rubber.slots.length < 2) continue
      const occupants = rubber.slots.map((slot) => state.slots[slot.id])
      if (occupants.includes(playerAId) && occupants.includes(playerBId)) return rubber.id
    }
  }
  return null
}

function slotsInFamily(family: SelectableDisciplineFamily, gender: TeamGender): SlotId[] {
  return SLOT_IDS.filter((id) => {
    const meta = SLOT_META.get(id)
    return meta?.family === family && meta.gender === gender
  })
}

function familiesOf(state: TeamSheetState, playerId: string): Set<SelectableDisciplineFamily> {
  const families = new Set<SelectableDisciplineFamily>()
  for (const id of SLOT_IDS) {
    if (state.slots[id] !== playerId) continue
    const meta = SLOT_META.get(id)
    if (meta) families.add(meta.family)
  }
  return families
}

function triplePlayer(state: TeamSheetState, gender: TeamGender): SquadPlayer | null {
  return (
    state.players.find((player) => player.gender === gender && familiesOf(state, player.id).size === 3) ??
    null
  )
}

function currentRubberInFamily(
  state: TeamSheetState,
  playerId: string,
  family: SelectableDisciplineFamily,
  gender: TeamGender,
): string | null {
  for (const id of slotsInFamily(family, gender)) {
    if (state.slots[id] === playerId) return SLOT_META.get(id)?.rubberId ?? null
  }
  return null
}

function decidePick(
  state: TeamSheetState,
  slotId: SlotId,
  player: SquadPlayer,
): { status: PickerStatus; note: string | null } {
  const meta = SLOT_META.get(slotId)
  if (!meta) return { status: 'blocked', note: null }
  if (state.slots[slotId] === player.id) return { status: 'selected', note: null }
  if (meta.partnerId && state.slots[meta.partnerId] === player.id) {
    return { status: 'blocked', note: 'Already in this pair' }
  }

  const families = familiesOf(state, player.id)
  families.add(meta.family)
  if (families.size === 3) {
    const triple = triplePlayer(state, player.gender)
    if (triple && triple.id !== player.id) {
      return { status: 'blocked', note: `${triple.name} is already playing all three` }
    }
  }

  const current = currentRubberInFamily(state, player.id, meta.family, meta.gender)
  if (current && current !== meta.rubberId) {
    return { status: 'available', note: `Currently ${current}` }
  }
  return { status: 'available', note: null }
}

function toSummaryEntry(state: TeamSheetState, player: SquadPlayer): SummaryEntry {
  const found = new Set<string>()
  for (const id of SLOT_IDS) {
    if (state.slots[id] === player.id) found.add(rubberCodeForSlot(id))
  }
  const rubbers = RUBBER_CODES.filter((code) => found.has(code))
  return {
    player,
    matchCount: rubbers.length,
    rubbers: [...rubbers],
    allThree: familiesOf(state, player.id).size === 3,
  }
}
