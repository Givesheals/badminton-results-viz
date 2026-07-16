import { describe, expect, it } from 'vitest'
import {
  buildNoteContextFromMatch,
  buildDirectNoteContext,
  collectKnownOpponentNames,
  defaultAppliesToDisciplineFamilies,
  defaultAppliesToDisciplines,
  defaultScoutingAppliesToDisciplineCodes,
  defaultNoteTarget,
  deleteNote,
  disciplineCodesFromFamilies,
  disciplineFamiliesFromCodes,
  getNoteAppliesToDisciplineFamilies,
  getNoteAppliesToDisciplines,
  getNoteScoutingAppliesToDisciplineCodes,
  getMatchJournalFields,
  getNoteForMatchTarget,
  getMatchJournalNotes,
  groupNotesByOpponent,
  isMatchNoteTarget,
  MATCH_NOTE_TARGET,
  matchJournalHasContent,
  noteHasStoredContent,
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
    expect(defaultNoteTarget(['Smith', 'Jones'])).toEqual({ kind: 'opponent', name: 'Smith' })
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

  it('excludes match journal notes from opponent lookup', () => {
    const scouting = note()
    const journal = note({
      id: 'journal',
      body: 'I was exhausted',
      target: MATCH_NOTE_TARGET,
    })
    const notes = [scouting, journal]
    expect(getNotesForOpponent(notes, 'Smith')).toHaveLength(1)
    expect(getNotesForOpponent(notes, 'Jones')).toHaveLength(1)
    expect(getMatchJournalNotes(notes)).toHaveLength(1)
    expect(isMatchNoteTarget(journal.target)).toBe(true)
    expect(noteHasStoredContent(journal)).toBe(true)
  })

  it('upserts match journal notes separately from scouting targets', () => {
    const ctx = makeContext()
    const families = ['mixed'] as const
    const withScouting = upsertNote([], ctx, 'Weak serve', { kind: 'pair' }, [...families])
    const withJournal = upsertNote(
      withScouting,
      ctx,
      '',
      MATCH_NOTE_TARGET,
      [],
      { selfFeel: ['tired'], matchFlow: ['comeback_us'] },
      { selfReflection: 'Faded in game 2', gameEvents: 'Long day' },
    )
    expect(withJournal).toHaveLength(2)
    const journal = getNoteForMatchTarget(withJournal, ctx.matchKey, MATCH_NOTE_TARGET)
    expect(journal?.tags).toEqual({
      selfFeel: ['tired'],
      matchFlow: ['comeback_us'],
    })
    expect(journal?.matchJournal).toEqual({
      selfReflection: 'Faded in game 2',
      gameEvents: 'Long day',
    })
    expect(journal?.body).toBe('')
  })

  it('reads legacy match journal body as game events', () => {
    const legacy = note({
      body: 'Partner got injured',
      target: MATCH_NOTE_TARGET,
    })
    expect(getMatchJournalFields(legacy)).toEqual({
      selfReflection: '',
      gameEvents: 'Partner got injured',
    })
    expect(matchJournalHasContent(getMatchJournalFields(legacy), legacy.tags)).toBe(true)
  })

  it('allows tags-only personal notes without body text', () => {
    const ctx = makeContext({ discipline: 'MS', disciplineLabel: "Men's singles" })
    const created = upsertNote(
      [],
      ctx,
      '',
      { kind: 'opponent', name: 'Smith' },
      ['singles'],
      { opponentStyles: ['front_court', 'flat_pace'] },
    )
    expect(created).toHaveLength(1)
    expect(created[0]?.body).toBe('')
    expect(created[0]?.tags).toEqual({
      opponentStyles: ['front_court', 'flat_pace'],
    })
    expect(noteHasStoredContent(created[0]!)).toBe(true)
  })

  it('groups only personal notes under opponents', () => {
    const pairNote = note({
      id: 'pair-1',
      body: 'Strong rotation',
      target: { kind: 'pair' },
    })
    const journal = note({
      id: 'journal',
      body: 'Partner injured',
      target: MATCH_NOTE_TARGET,
    })
    const groups = groupNotesByOpponent([pairNote, journal])
    expect(groups).toHaveLength(2)
    expect(groups.every((group) => group.notes.every((n) => !isMatchNoteTarget(n.target)))).toBe(
      true,
    )
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

  it('defaults scouting discipline scope to S, D, and XD for direct notes', () => {
    const ctx = buildDirectNoteContext('Smith')
    expect(defaultScoutingAppliesToDisciplineCodes(ctx)).toEqual(['S', 'D', 'XD'])
  })

  it('maps match discipline to scouting scope codes S, D, or XD', () => {
    expect(defaultScoutingAppliesToDisciplineCodes(makeContext({ discipline: 'MD' }))).toEqual(['D'])
    expect(defaultScoutingAppliesToDisciplineCodes(makeContext({ discipline: 'MS' }))).toEqual(['S'])
    expect(defaultScoutingAppliesToDisciplineCodes(makeContext({ discipline: 'WS' }))).toEqual(['S'])
    expect(defaultScoutingAppliesToDisciplineCodes(makeContext({ discipline: 'XD' }))).toEqual(['XD'])
  })

  it('collapses legacy stored codes to scouting scope chips', () => {
    const legacy = note({ appliesToDisciplines: ['MS', 'WS', 'OS', 'MD', 'WD'] })
    expect(getNoteScoutingAppliesToDisciplineCodes(legacy)).toEqual(['S', 'D'])
  })

  it('stores scouting appliesToDisciplines as S, D, XD scope codes on upsert', () => {
    const ctx = makeContext()
    const created = upsertNote([], ctx, 'Weak serve', { kind: 'pair' }, [], undefined, undefined, [
      'S',
      'XD',
    ])
    expect(created[0]?.appliesToDisciplines).toEqual(['S', 'XD'])
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
      kind: 'pair',
      primary: 'Pair note — not about Scott Carter alone',
      secondary: 'About how they played together · Scott Carter & Martin Crossley',
    })
    expect(formatNoteScopeInGroup(scottOnly, 'Scott Carter')).toEqual({
      kind: 'opponent',
      label: 'About this player',
    })
  })

  it('explains when a pair note was recorded with a different partner in the draw', () => {
    const pairNote = note({
      target: { kind: 'pair' },
      context: makeContext({
        opponentNames: ['Dan Martyres', 'Jane Smith'],
        opponentsDisplay: 'Dan Martyres & Jane Smith',
      }),
    })

    expect(
      formatNoteScopeInGroup(pairNote, 'Dan Martyres', {
        drawnCoOpponent: 'Sarah Brown',
        context: 'draw-scout',
      }),
    ).toEqual({
      kind: 'pair',
      primary: 'Pair note — about how they played together',
      secondary: 'Recorded as Dan Martyres & Jane Smith. Different partner in this draw.',
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
