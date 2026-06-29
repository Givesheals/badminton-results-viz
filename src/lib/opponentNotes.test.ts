import { describe, expect, it } from 'vitest'
import {
  buildNoteContextFromMatch,
  buildDirectNoteContext,
  collectKnownOpponentNames,
  defaultAppliesToDisciplineFamilies,
  defaultAppliesToDisciplines,
  defaultNoteTarget,
  deleteNote,
  disciplineCodesFromFamilies,
  disciplineFamiliesFromCodes,
  getNoteAppliesToDisciplineFamilies,
  getNoteAppliesToDisciplines,
  getNoteForMatchTarget,
  groupNotesByOpponent,
  isDirectNoteContext,
  formatNoteMatchTriggerLabel,
  formatNoteScopeInGroup,
  formatIsoTimestampShort,
  formatMatchDateShort,
  formatNoteRecordedSummary,
  getNotesForOpponent,
  normalizeAppliesToDisciplines,
  noteMatchesSearch,
  opponentNotesStorageKey,
  sortNotesNewestFirst,
  upsertNote,
  type OpponentNote,
  type OpponentNoteMatchContext,
} from './opponentNotes'
import type { NormalizedMatch } from '../types/matchHistory'

function makeContext(overrides: Partial<OpponentNoteMatchContext> = {}): OpponentNoteMatchContext {
  return {
    matchKey: 'comp\x002025-06-01\x00XD\x00Smith & Jones',
    competitionName: 'County Champs',
    date: '2025-06-01',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    partnerName: 'Alex',
    opponentNames: ['Smith', 'Jones'],
    opponentsDisplay: 'Smith & Jones',
    roundLabel: 'QF',
    outcome: 'loss',
    scoreSummary: '18-21, 15-21',
    ...overrides,
  }
}

function note(overrides: Partial<OpponentNote> = {}): OpponentNote {
  const { context: contextOverrides, ...rest } = overrides
  return {
    id: 'note-1',
    body: 'Weak backhand',
    target: { kind: 'pair' },
    createdAt: '2025-06-02T10:00:00.000Z',
    updatedAt: '2025-06-02T10:00:00.000Z',
    ...rest,
    context: makeContext(contextOverrides),
  }
}

describe('opponentNotes', () => {
  it('builds a stable storage key from player name', () => {
    expect(opponentNotesStorageKey('  Jane Doe  ')).toBe('opponent-notes:jane doe')
  })

  it('defaults target to pair for doubles and opponent for singles', () => {
    expect(defaultNoteTarget(['Smith', 'Jones'])).toEqual({ kind: 'pair' })
    expect(defaultNoteTarget(['Smith'])).toEqual({ kind: 'opponent', name: 'Smith' })
  })

  it('finds pair-targeted notes for either opponent name', () => {
    const notes = [note()]
    expect(getNotesForOpponent(notes, 'Smith')).toHaveLength(1)
    expect(getNotesForOpponent(notes, 'Jones')).toHaveLength(1)
    expect(getNotesForOpponent(notes, 'Other')).toHaveLength(0)
  })

  it('finds assigned-opponent notes only for that opponent', () => {
    const notes = [note({ target: { kind: 'opponent', name: 'Smith' } })]
    expect(getNotesForOpponent(notes, 'Smith')).toHaveLength(1)
    expect(getNotesForOpponent(notes, 'Jones')).toHaveLength(0)
  })

  it('upserts by matchKey and target, allowing separate notes per opponent', () => {
    const ctx = makeContext()
    const families = ['mixed'] as const
    const pair = upsertNote([], ctx, 'Good rotation', { kind: 'pair' }, [...families])
    expect(pair).toHaveLength(1)

    const both = upsertNote(pair, ctx, 'Weak backhand', {
      kind: 'opponent',
      name: 'Smith',
    }, [...families])
    expect(both).toHaveLength(2)

    const allThree = upsertNote(both, ctx, 'Fast at net', {
      kind: 'opponent',
      name: 'Jones',
    }, [...families])
    expect(allThree).toHaveLength(3)

    expect(
      getNoteForMatchTarget(allThree, ctx.matchKey, { kind: 'opponent', name: 'Smith' })?.body,
    ).toBe('Weak backhand')
    expect(
      getNoteForMatchTarget(allThree, ctx.matchKey, { kind: 'opponent', name: 'Jones' })?.body,
    ).toBe('Fast at net')

    const removedSmith = upsertNote(allThree, ctx, '   ', {
      kind: 'opponent',
      name: 'Smith',
    }, [...families])
    expect(removedSmith).toHaveLength(2)
  })

  it('defaults discipline scope to the source match family', () => {
    const ctx = makeContext({ discipline: 'MD', disciplineLabel: "Men's doubles" })
    expect(defaultAppliesToDisciplineFamilies(ctx)).toEqual(['doubles'])
    expect(defaultAppliesToDisciplines(ctx)).toEqual(['MD', 'WD', 'OD'])
  })

  it('falls back to match discipline family for legacy notes without appliesToDisciplines', () => {
    const legacy = note({ appliesToDisciplines: undefined })
    expect(getNoteAppliesToDisciplineFamilies(legacy)).toEqual(['mixed'])
    expect(getNoteAppliesToDisciplines(legacy)).toEqual(['XD'])
  })

  it('stores and updates appliesToDisciplines from selected families on upsert', () => {
    const ctx = makeContext()
    const created = upsertNote([], ctx, 'Weak serve', { kind: 'pair' }, ['singles'])
    expect(created[0]?.appliesToDisciplines).toEqual(['MS', 'WS', 'OS'])

    const updated = upsertNote(created, ctx, 'Weak serve', { kind: 'pair' }, ['doubles', 'mixed'])
    expect(updated[0]?.appliesToDisciplines).toEqual(['MD', 'WD', 'OD', 'XD'])
  })

  it('normalizes appliesToDisciplines to known codes in canonical order', () => {
    expect(normalizeAppliesToDisciplines(['XD', 'MS', 'INVALID', 'MS'])).toEqual(['MS', 'XD'])
  })

  it('maps discipline families to codes and back', () => {
    expect(disciplineCodesFromFamilies(['singles', 'mixed'])).toEqual(['MS', 'WS', 'OS', 'XD'])
    expect(disciplineFamiliesFromCodes(['MS', 'WD', 'INVALID'])).toEqual(['singles', 'doubles'])
  })

  it('matches search queries against discipline families and codes', () => {
    const scoped = note({
      appliesToDisciplines: ['MS', 'WD'],
      context: makeContext({ disciplineLabel: "Men's singles" }),
    })
    expect(noteMatchesSearch(scoped, 'singles')).toBe(true)
    expect(noteMatchesSearch(scoped, 'doubles')).toBe(true)
    expect(noteMatchesSearch(scoped, 'ms')).toBe(true)
    expect(noteMatchesSearch(scoped, 'mixed')).toBe(false)
  })

  it('deletes by id', () => {
    const notes = [note({ id: 'a' }), note({ id: 'b', context: makeContext({ matchKey: 'other' }) })]
    expect(deleteNote(notes, 'a')).toHaveLength(1)
  })

  it('sorts notes newest first by match date then updatedAt', () => {
    const older = note({
      id: 'older',
      context: makeContext({ date: '2025-05-01' }),
      updatedAt: '2025-05-02T10:00:00.000Z',
    })
    const newer = note({
      id: 'newer',
      context: makeContext({ date: '2025-06-01', matchKey: 'other' }),
      updatedAt: '2025-06-02T10:00:00.000Z',
    })
    expect(sortNotesNewestFirst([older, newer]).map((n) => n.id)).toEqual(['newer', 'older'])
  })

  it('filters notes by search query', () => {
    const notes = [
      note({ body: 'Lobs a lot' }),
      note({
        id: 'two',
        body: 'Fast smashes',
        context: makeContext({ opponentsDisplay: 'Taylor' }),
        target: { kind: 'opponent', name: 'Taylor' },
      }),
    ]
    expect(noteMatchesSearch(notes[0]!, 'lobs')).toBe(true)
    expect(noteMatchesSearch(notes[1]!, 'taylor')).toBe(true)
    expect(noteMatchesSearch(notes[0]!, 'taylor')).toBe(false)
  })

  it('groups notes by opponent including pair notes under each player', () => {
    const scottOnly = note({
      id: 'scott-1',
      body: 'Lobs a lot',
      target: { kind: 'opponent', name: 'Scott Carter' },
      context: makeContext({
        opponentNames: ['Scott Carter', 'Martin Crossley'],
        opponentsDisplay: 'Scott Carter & Martin Crossley',
      }),
    })
    const scottAgain = note({
      id: 'scott-2',
      body: 'Slow recovery',
      target: { kind: 'opponent', name: 'Scott Carter' },
      context: makeContext({
        matchKey: 'other-match',
        opponentNames: ['Scott Carter'],
        opponentsDisplay: 'Scott Carter',
      }),
    })
    const pairNote = note({
      id: 'pair-1',
      body: 'Strong rotation',
      target: { kind: 'pair' },
      context: makeContext({
        matchKey: 'pair-match',
        opponentNames: ['Scott Carter', 'Martin Crossley'],
        opponentsDisplay: 'Scott Carter & Martin Crossley',
      }),
    })

    const groups = groupNotesByOpponent([scottOnly, scottAgain, pairNote])
    const scottGroup = groups.find((g) => g.opponentName === 'Scott Carter')
    const martinGroup = groups.find((g) => g.opponentName === 'Martin Crossley')

    expect(scottGroup?.notes).toHaveLength(3)
    expect(martinGroup?.notes).toHaveLength(1)
    expect(formatNoteScopeInGroup(pairNote, 'Scott Carter')).toEqual({
      label: 'About the pair',
      detail: 'Scott Carter & Martin Crossley',
    })
    expect(formatNoteScopeInGroup(scottOnly, 'Scott Carter')).toEqual({
      label: 'About this player',
    })
  })

  it('formats recorded and edited timestamps for note summaries', () => {
    expect(
      formatNoteRecordedSummary(
        note({
          createdAt: '2025-06-02T10:00:00.000Z',
          updatedAt: '2025-06-02T10:00:00.000Z',
        }),
      ),
    ).toBe('Recorded 2 Jun 2025')

    expect(
      formatNoteRecordedSummary(
        note({
          createdAt: '2025-06-02T10:00:00.000Z',
          updatedAt: '2025-06-10T18:30:00.000Z',
        }),
      ),
    ).toBe('Recorded 2 Jun 2025 · edited 10 Jun 2025')
  })

  it('formats match and ISO dates for display', () => {
    expect(formatMatchDateShort('2025-06-01')).toBe('1 Jun 2025')
    expect(formatIsoTimestampShort('2025-06-02T10:00:00.000Z')).toBe('2 Jun 2025')
  })

  it('formats match trigger label for note accordions', () => {
    expect(formatNoteMatchTriggerLabel(makeContext())).toBe('1 Jun 2025 · County Champs')
  })

  it('builds note context from a normalized match', () => {
    const match = {
      competitionName: 'Open',
      tournamentCategoryLabel: 'Bronze',
      date: '2025-01-15',
      discipline: 'MS',
      disciplineLabel: "Men's singles",
      partnerName: null,
      opponents: 'Lee',
      outcome: 'win',
      scoreSummary: '21-18',
      raw: {
        'Opponent 1 Name': 'Lee',
        'Opponent 1 Rating': 1200,
        Round: 'R16',
      },
    } as unknown as NormalizedMatch

    const built = buildNoteContextFromMatch(match)
    expect(built.opponentNames).toEqual(['Lee'])
    expect(built.tournamentCategoryLabel).toBe('Bronze')
    expect(built.roundLabel).toBeTruthy()
    expect(built.matchKey).toContain('Open')
  })

  it('builds direct note context for notes tab capture', () => {
    const context = buildDirectNoteContext('Taylor Swift')
    expect(isDirectNoteContext(context)).toBe(true)
    expect(context.opponentNames).toEqual(['Taylor Swift'])
    expect(context.opponentsDisplay).toBe('Taylor Swift')
    expect(defaultAppliesToDisciplineFamilies(context)).toEqual(['singles', 'doubles', 'mixed'])
  })

  it('collects unique opponent names from match history', () => {
    const matches = [
      {
        raw: { 'Opponent 1 Name': 'Lee', 'Opponent 2 Name': 'Kim' },
      },
      {
        raw: { 'Opponent 1 Name': 'Lee' },
      },
    ] as unknown as NormalizedMatch[]

    expect(collectKnownOpponentNames(matches)).toEqual(['Kim', 'Lee'])
  })
})
