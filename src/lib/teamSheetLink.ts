import {
  SLOT_IDS,
  addPlayer,
  assignPlayer,
  createEmptyTeamSheet,
  type SlotId,
  type TeamSheetState,
} from './teamSheet'

const HASH_PREFIX = 's='
const MAX_PLAYERS = 40
const MAX_NAME_LENGTH = 80
const SLOT_ID_SET = new Set<string>(SLOT_IDS)

type PackedSheet = {
  v: 1
  p: [string, 'm' | 'w'][]
  s: [SlotId, number][]
}

export type TeamSheetLinkResult =
  | { status: 'empty' }
  | { status: 'invalid' }
  | { status: 'ok'; sheet: TeamSheetState }

/** Compact hash payload for the current sheet. The same sheet always produces the same text. */
export function encodeTeamSheet(state: TeamSheetState): string {
  const indexById = new Map(state.players.map((player, index) => [player.id, index]))
  const packed: PackedSheet = {
    v: 1,
    p: state.players.map((player) => [player.name, player.gender === 'man' ? 'm' : 'w']),
    s: [],
  }
  for (const slotId of SLOT_IDS) {
    const playerId = state.slots[slotId]
    if (!playerId) continue
    const playerIndex = indexById.get(playerId)
    if (playerIndex === undefined) continue
    packed.s.push([slotId, playerIndex])
  }
  return encodeBase64Url(new TextEncoder().encode(JSON.stringify(packed)))
}

export function teamSheetHash(state: TeamSheetState): string {
  return `#${HASH_PREFIX}${encodeTeamSheet(state)}`
}

/** Reads a shared team-sheet address. A missing or unrelated hash is an empty sheet. */
export function readTeamSheetLink(hash: string): TeamSheetLinkResult {
  const raw = hash.startsWith('#') ? hash.slice(1) : hash
  if (!raw || !raw.startsWith(HASH_PREFIX)) return { status: 'empty' }
  const sheet = decodeTeamSheet(raw.slice(HASH_PREFIX.length))
  if (!sheet) return { status: 'invalid' }
  return { status: 'ok', sheet }
}

function decodeTeamSheet(payload: string): TeamSheetState | null {
  if (payload.length === 0 || payload.length > 8000) return null
  const bytes = decodeBase64Url(payload)
  if (!bytes) return null

  let packed: unknown
  try {
    packed = JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
  if (!isPackedSheet(packed)) return null

  let sheet = createEmptyTeamSheet()
  for (let index = 0; index < packed.p.length; index += 1) {
    const [name, genderCode] = packed.p[index]!
    const added = addPlayer(sheet, {
      id: `p${index}`,
      name,
      gender: genderCode === 'm' ? 'man' : 'woman',
    })
    if (!added.ok) return null
    sheet = added.sheet
  }

  for (const [slotId, playerIndex] of packed.s) {
    sheet = assignPlayer(sheet, slotId, `p${playerIndex}`)
  }
  return sheet
}

function isPackedSheet(value: unknown): value is PackedSheet {
  if (!value || typeof value !== 'object') return false
  const record = value as { v?: unknown; p?: unknown; s?: unknown }
  if (record.v !== 1 || !Array.isArray(record.p) || !Array.isArray(record.s)) return false
  if (record.p.length > MAX_PLAYERS || record.s.length > SLOT_IDS.length) return false

  for (const player of record.p) {
    if (!Array.isArray(player) || player.length !== 2) return false
    const [name, gender] = player
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > MAX_NAME_LENGTH) return false
    if (gender !== 'm' && gender !== 'w') return false
  }

  const seen = new Set<string>()
  for (const slot of record.s) {
    if (!Array.isArray(slot) || slot.length !== 2) return false
    const [slotId, playerIndex] = slot
    if (typeof slotId !== 'string' || !SLOT_ID_SET.has(slotId) || seen.has(slotId)) return false
    seen.add(slotId)
    if (!Number.isInteger(playerIndex) || playerIndex < 0 || playerIndex >= record.p.length) return false
  }
  return true
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function decodeBase64Url(value: string): Uint8Array | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return null
  const padded = value + '='.repeat((4 - (value.length % 4)) % 4)
  try {
    const binary = atob(padded.replaceAll('-', '+').replaceAll('_', '/'))
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
    return bytes
  } catch {
    return null
  }
}
