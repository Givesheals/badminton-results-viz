import { describe, expect, it } from 'vitest'
import {
  addPartnership,
  addPlayer,
  assignPlayer,
  createEmptyTeamSheet,
  type SlotId,
  type TeamGender,
} from './teamSheet'
import { encodeTeamSheet, readTeamSheetLink, teamSheetHash } from './teamSheetLink'

function build(players: Array<[string, TeamGender]>, assignments: Array<[SlotId, string]> = []) {
  let state = createEmptyTeamSheet()
  const id: Record<string, string> = {}
  for (const [name, gender] of players) {
    const playerId = name.toLowerCase().replace(/\s+/g, '-')
    id[name] = playerId
    const added = addPlayer(state, { id: playerId, name, gender })
    if (!added.ok) throw new Error(added.error)
    state = added.sheet
  }
  for (const [slot, name] of assignments) state = assignPlayer(state, slot, id[name]!)
  return state
}

function rubbers(hash: string) {
  const result = readTeamSheetLink(hash)
  if (result.status !== 'ok') return result.status
  return {
    players: result.sheet.players.map((player) => [player.name, player.gender]),
    slots: Object.entries(result.sheet.slots).filter(([, playerId]) => playerId),
  }
}

describe('team sheet links', () => {
  it('round-trips the squad, the card, and spare players', () => {
    const sheet = build(
      [
        ['Alex Morgan', 'man'],
        ['Sam Okonkwo', 'man'],
        ['Priya Shah', 'woman'],
        ['Noël Åse', 'woman'],
      ],
      [
        ['MS1', 'Alex Morgan'],
        ['MD1A', 'Alex Morgan'],
        ['XD1M', 'Alex Morgan'],
        ['MS2', 'Sam Okonkwo'],
        ['MD1B', 'Sam Okonkwo'],
        ['WS1', 'Priya Shah'],
      ],
    )

    const hash = teamSheetHash(sheet)
    const restored = rubbers(hash)
    expect(restored).toMatchObject({
      players: [
        ['Alex Morgan', 'man'],
        ['Sam Okonkwo', 'man'],
        ['Priya Shah', 'woman'],
        ['Noël Åse', 'woman'],
      ],
    })
    if (typeof restored === 'string') return
    const bySlot = Object.fromEntries(restored.slots)
    expect(bySlot.MS1).toBeTruthy()
    expect(bySlot.MD1A).toBe(bySlot.MS1)
    expect(bySlot.XD1M).toBe(bySlot.MS1)
    expect(bySlot.MS2).toBeTruthy()
    expect(bySlot.MS2).not.toBe(bySlot.MS1)
    expect(bySlot.MD1B).toBe(bySlot.MS2)
    expect(bySlot.WS1).toBeTruthy()
    expect(teamSheetHash(readOk(hash))).toBe(hash)
  })

  it('uses the same link text for the same sheet', () => {
    const sheet = build([['Alex', 'man']], [['MS1', 'Alex']])
    expect(encodeTeamSheet(sheet)).toBe(encodeTeamSheet(sheet))
  })

  it('keeps partnership strength in the shared link', () => {
    const sheet = build(
      [
        ['Martin Crossley', 'man'],
        ['Polly Thisdell', 'woman'],
        ['Sara Moore', 'woman'],
      ],
      [['XD3M', 'Martin Crossley'], ['XD3W', 'Polly Thisdell']],
    )
    const withLots = addPartnership(sheet, sheet.players[0]!.id, sheet.players[1]!.id, 'lots')
    if (!withLots.ok) throw new Error(withLots.error)
    const withBit = addPartnership(withLots.sheet, sheet.players[2]!.id, sheet.players[0]!.id, 'bit')
    if (!withBit.ok) throw new Error(withBit.error)

    const hash = teamSheetHash(withBit.sheet)
    const restored = readOk(hash)
    expect(restored.partnerships.map((pair) => pair.strength)).toEqual(['lots', 'bit'])
    expect(restored.players.map((player) => player.name)).toEqual([
      'Martin Crossley',
      'Polly Thisdell',
      'Sara Moore',
    ])
    expect(teamSheetHash(restored)).toBe(hash)
  })

  it('treats a blank address as a new sheet and rejects a broken one', () => {
    expect(readTeamSheetLink('')).toEqual({ status: 'empty' })
    expect(readTeamSheetLink('#other')).toEqual({ status: 'empty' })
    expect(readTeamSheetLink('#s=not-json')).toEqual({ status: 'invalid' })
    expect(readTeamSheetLink('#s=')).toEqual({ status: 'invalid' })
  })
})

function readOk(hash: string) {
  const result = readTeamSheetLink(hash)
  if (result.status !== 'ok') throw new Error(result.status)
  return result.sheet
}
