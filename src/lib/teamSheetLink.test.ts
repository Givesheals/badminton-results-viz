import { describe, expect, it } from 'vitest'
import { addPlayer, assignPlayer, createEmptyTeamSheet, type SlotId, type TeamGender } from './teamSheet'
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
