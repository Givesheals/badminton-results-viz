import { describe, expect, it } from 'vitest'
import {
  addPartnership,
  addPlayer,
  assignPlayer,
  clearSlot,
  countOpenPlaces,
  createEmptyTeamSheet,
  isTeamSheetPath,
  openPlacesLabel,
  pickerRows,
  removePlayer,
  setPlayerGender,
  sheetIssues,
  summariseTeamSheet,
  type SlotId,
  type TeamGender,
  type TeamSheetState,
} from './teamSheet'

function build(
  players: Array<[string, TeamGender]>,
  assignments: Array<[SlotId, string]> = [],
): { state: TeamSheetState; id: Record<string, string> } {
  let state = createEmptyTeamSheet()
  const id: Record<string, string> = {}
  for (const [name, gender] of players) {
    const playerId = name.toLowerCase().replace(/\s+/g, '-')
    id[name] = playerId
    const added = addPlayer(state, { id: playerId, name, gender })
    if (!added.ok) throw new Error(added.error)
    state = added.sheet
  }
  for (const [slot, name] of assignments) {
    state = assignPlayer(state, slot, id[name]!)
  }
  return { state, id }
}

describe('addPlayer', () => {
  it('trims a name and keeps the typed capitals', () => {
    const added = addPlayer(createEmptyTeamSheet(), { id: 'sam', name: '  Sam   Okonkwo  ', gender: 'man' })
    expect(added.ok).toBe(true)
    if (!added.ok) return
    expect(added.sheet.players[0]?.name).toBe('Sam Okonkwo')
  })

  it('rejects a blank name and a duplicate', () => {
    const first = addPlayer(createEmptyTeamSheet(), { id: 'sam', name: 'Sam', gender: 'man' })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(addPlayer(first.sheet, { id: 'blank', name: '   ', gender: 'man' })).toEqual({
      ok: false,
      error: 'Enter a name.',
    })
    expect(addPlayer(first.sheet, { id: 'sam-2', name: 'sam', gender: 'woman' }).ok).toBe(false)
  })
})

describe('assignPlayer', () => {
  it('moves a player from one singles rubber to the other', () => {
    const { state, id } = build(
      [
        ['Sam', 'man'],
        ['Alex', 'man'],
      ],
      [['MS2', 'Sam']],
    )
    const next = assignPlayer(state, 'MS1', id.Sam!)
    expect(next.slots.MS1).toBe(id.Sam)
    expect(next.slots.MS2).toBeNull()
  })

  it('replaces whoever was already in the place', () => {
    const { state, id } = build(
      [
        ['Alex', 'man'],
        ['Sam', 'man'],
      ],
      [['MS1', 'Alex']],
    )
    const next = assignPlayer(state, 'MS1', id.Sam!)
    expect(next.slots.MS1).toBe(id.Sam)
    expect(Object.values(next.slots).filter((playerId) => playerId === id.Alex)).toEqual([])
  })

  it('refuses the other side of the same pair', () => {
    const { state, id } = build([['Alex', 'man']], [['MD1A', 'Alex']])
    expect(assignPlayer(state, 'MD1B', id.Alex!)).toBe(state)
    expect(pickerRows(state, 'MD1B')[0]).toMatchObject({
      status: 'blocked',
      note: 'Already in this pair',
    })
  })

  it('lets one man play all three and blocks a second', () => {
    const { state, id } = build(
      [
        ['Alex', 'man'],
        ['Sam', 'man'],
        ['Jordan', 'man'],
      ],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
        ['XD1M', 'Alex'],
        ['MS2', 'Sam'],
        ['MD1B', 'Sam'],
        ['MD2A', 'Jordan'],
      ],
    )

    expect(assignPlayer(state, 'XD2M', id.Sam!)).toBe(state)
    expect(pickerRows(state, 'XD2M').find((row) => row.player.id === id.Sam)).toMatchObject({
      status: 'blocked',
      note: 'Alex is already playing all three',
    })

    const jordan = assignPlayer(state, 'XD2M', id.Jordan!)
    expect(jordan.slots.XD2M).toBe(id.Jordan)
  })

  it('still lets the player on all three move within a discipline', () => {
    const { state, id } = build(
      [['Alex', 'man']],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
        ['XD1M', 'Alex'],
      ],
    )
    const next = assignPlayer(state, 'XD2M', id.Alex!)
    expect(next.slots.XD2M).toBe(id.Alex)
    expect(next.slots.XD1M).toBeNull()
    expect(next.slots.MS1).toBe(id.Alex)
  })

  it('allows a woman to play all three while a man already does', () => {
    const { state, id } = build(
      [
        ['Alex', 'man'],
        ['Priya', 'woman'],
      ],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
        ['XD1M', 'Alex'],
        ['WS1', 'Priya'],
        ['WD1A', 'Priya'],
      ],
    )
    const next = assignPlayer(state, 'XD1W', id.Priya!)
    expect(next.slots.XD1W).toBe(id.Priya)
  })

  it('ignores a player of the wrong gender', () => {
    const { state, id } = build([['Priya', 'woman']])
    expect(assignPlayer(state, 'MS1', id.Priya!)).toBe(state)
    expect(pickerRows(state, 'MS1')).toEqual([])
  })

  it('offers a move when the player is already on another rubber in that discipline', () => {
    const { state } = build(
      [
        ['Sam', 'man'],
        ['Alex', 'man'],
      ],
      [['MS2', 'Sam']],
    )
    expect(pickerRows(state, 'MS1')[0]).toMatchObject({
      status: 'available',
      note: 'Currently MS2',
    })
  })
})

describe('squad edits', () => {
  it('clears every rubber when a player leaves the squad', () => {
    const { state, id } = build(
      [['Alex', 'man']],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
      ],
    )
    const next = removePlayer(state, id.Alex!)
    expect(next.players).toEqual([])
    expect(next.slots.MS1).toBeNull()
    expect(next.slots.MD1A).toBeNull()
  })

  it('clears one place without touching the rest of that player', () => {
    const { state, id } = build(
      [['Alex', 'man']],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
      ],
    )
    const next = clearSlot(state, 'MS1')
    expect(next.slots.MS1).toBeNull()
    expect(next.slots.MD1A).toBe(id.Alex)
  })
})

describe('summariseTeamSheet', () => {
  it('counts rubbers, names them, and keeps spares on the list', () => {
    const { state } = build(
      [
        ['Jordan', 'man'],
        ['Sam', 'man'],
        ['Alex', 'man'],
      ],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
        ['XD1M', 'Alex'],
        ['MS2', 'Sam'],
        ['MD1B', 'Sam'],
      ],
    )
    const summary = summariseTeamSheet(state)
    expect(summary.men.map((entry) => [entry.player.name, entry.matchCount, entry.rubbers, entry.allThree])).toEqual([
      ['Alex', 3, ['MS1', 'MD1', 'XD1'], true],
      ['Sam', 2, ['MS2', 'MD1'], false],
      ['Jordan', 0, [], false],
    ])
    expect(summary.women).toEqual([])
    expect(summary.openPlaces).toBe(countOpenPlaces(state))
    expect(openPlacesLabel(summary.openPlaces)).toBe(`${summary.openPlaces} places still open`)
    expect(openPlacesLabel(1)).toBe('1 place still open')
    expect(openPlacesLabel(0)).toBe('Sheet complete')
  })
})

describe('setPlayerGender', () => {
  it('switches the player and clears places that no longer fit', () => {
    const { state, id } = build(
      [['Alex', 'man']],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
      ],
    )
    const next = setPlayerGender(state, id.Alex!, 'woman')
    expect(next.players[0]?.gender).toBe('woman')
    expect(next.slots.MS1).toBeNull()
    expect(next.slots.MD1A).toBeNull()
  })
})

describe('partnerships', () => {
  it('records two intensities and flags a pair that is not on the card', () => {
    const { state, id } = build([
      ['Martin', 'man'],
      ['Polly', 'woman'],
      ['Sara', 'woman'],
    ])
    const lots = addPartnership(state, id.Martin!, id.Polly!, 'lots')
    expect(lots.ok).toBe(true)
    if (!lots.ok) return
    const bit = addPartnership(lots.sheet, id.Sara!, id.Martin!, 'bit')
    expect(bit.ok).toBe(true)
    if (!bit.ok) return
    expect(bit.sheet.partnerships.map((pair) => [pair.playerIds.map((playerId) => playerId), pair.strength])).toEqual([
      [[id.Martin, id.Polly], 'lots'],
      [[id.Martin, id.Sara], 'bit'],
    ])
    expect(addPartnership(bit.sheet, id.Polly!, id.Martin!, 'lots').ok).toBe(false)
    expect(sheetIssues(bit.sheet).map((issue) => issue.text)).toEqual([
      'You have 1 man playing 0 disciplines. This is allowed.',
      'You have 2 women playing 0 disciplines. This is allowed.',
      'Martin has lots of experience with Polly, and they are not paired.',
      'Martin has a bit of experience with Sara, and they are not paired.',
    ])

    const paired = assignPlayer(assignPlayer(bit.sheet, 'XD1M', id.Martin!), 'XD1W', id.Polly!)
    expect(sheetIssues(paired).map((issue) => issue.text)).toEqual([
      'You have 1 woman playing 0 disciplines. This is allowed.',
      'Martin has a bit of experience with Sara, and they are not paired.',
    ])
  })

  it('names a player who is on all three', () => {
    const { state } = build(
      [
        ['Alex', 'man'],
        ['Sam', 'man'],
      ],
      [
        ['MS1', 'Alex'],
        ['MD1A', 'Alex'],
        ['XD1M', 'Alex'],
        ['MD1B', 'Sam'],
      ],
    )
    expect(sheetIssues(state).map((issue) => issue.text)).toEqual(['Alex is playing all three.'])
  })

  it('rejects two players of one gender on all three, and notes a spare', () => {
    const { state, id } = build([
      ['Alex', 'man'],
      ['Sam', 'man'],
      ['Jordan', 'man'],
      ['Priya', 'woman'],
    ])
    const next = {
      ...state,
      slots: {
        ...state.slots,
        MS1: id.Alex!,
        MD1A: id.Alex!,
        XD1M: id.Alex!,
        MS2: id.Sam!,
        MD2A: id.Sam!,
        XD2M: id.Sam!,
      },
    }
    expect(sheetIssues(next).map((issue) => issue.text)).toEqual([
      'You have 2 men playing 3 disciplines. This is not allowed.',
      'You have 1 man playing 0 disciplines. This is allowed.',
      'You have 1 woman playing 0 disciplines. This is allowed.',
    ])
    expect(sheetIssues(next).find((issue) => issue.id === 'triple-limit:man')?.tone).toBe('warning')
  })

  it('drops a partnership when one player leaves the squad', () => {
    const { state, id } = build([
      ['Martin', 'man'],
      ['Polly', 'woman'],
    ])
    const added = addPartnership(state, id.Martin!, id.Polly!, 'lots')
    if (!added.ok) throw new Error(added.error)
    expect(removePlayer(added.sheet, id.Polly!).partnerships).toEqual([])
  })
})

describe('isTeamSheetPath', () => {
  it('matches the team sheet address and ignores the rest of the app', () => {
    expect(isTeamSheetPath('/team-sheet', '/')).toBe(true)
    expect(isTeamSheetPath('/team-sheet/', '/')).toBe(true)
    expect(isTeamSheetPath('/badminton-results-viz/team-sheet', '/badminton-results-viz/')).toBe(true)
    expect(isTeamSheetPath('/', '/')).toBe(false)
    expect(isTeamSheetPath('/team-sheet/extra', '/')).toBe(false)
  })
})
