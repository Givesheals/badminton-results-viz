import { describe, expect, it } from 'vitest'
import {
  countDrawOpponentsWithNotes,
  formatMatchupIntelTeaser,
  getDefaultCompetitionSlug,
  getDefaultPlayerName,
  getEventWeekendLastDay,
  getExactDrawPairNotes,
  getIndividualDrawScoutNotes,
  getMatchupIntelCounts,
  groupMatchupsByRound,
  groupLaterOpponentsByRound,
  isDrawScoutCompetitionActive,
  isDrawScoutCompetitionExpired,
  shouldAutoShowDrawScoutCard,
  sortLaterOpponents,
} from './drawScout'
import { drawScoutDemoMatches } from './drawScoutDemoMatches'
import { mergeDrawScoutDisplayNotes } from './drawScoutDemoNotes'
import {
  drawScoutPreviewCompetitions,
  getPrototypeDrawWeekend,
} from './drawScoutPreviewData'
import type { OpponentNote } from './opponentNotes'

const cambs = drawScoutPreviewCompetitions[0]!
const simon = cambs.entrants[0]!

function noteFor(opponentName: string): OpponentNote {
  return {
    id: `note-${opponentName}`,
    body: 'Scouting text',
    target: { kind: 'opponent', name: opponentName },
    context: {
      matchKey: `direct\\0${opponentName}`,
      competitionName: 'Test',
      date: '2026-01-01',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: null,
      opponentNames: [opponentName],
      opponentsDisplay: opponentName,
      roundLabel: null,
      outcome: 'win',
      scoreSummary: '21-15',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

describe('drawScoutDemoNotes', () => {
  it('fills demo notes when the user has none saved', () => {
    const merged = mergeDrawScoutDisplayNotes([])
    expect(merged.some((note) => note.id.startsWith('draw-scout-demo:'))).toBe(true)
    expect(
      merged.some(
        (note) =>
          note.target.kind === 'opponent' &&
          note.target.name === 'Murray Wright',
      ),
    ).toBe(true)
  })

  it('keeps user notes instead of demo for the same opponent', () => {
    const userNote: OpponentNote = {
      id: 'user-murray',
      body: 'My own note',
      target: { kind: 'opponent', name: 'Murray Wright' },
      context: {
        matchKey: 'user',
        competitionName: 'Test',
        date: '2026-01-01',
        discipline: 'XD',
        disciplineLabel: 'Mixed doubles',
        partnerName: null,
        opponentNames: ['Murray Wright'],
        opponentsDisplay: 'Murray Wright',
        roundLabel: null,
        outcome: 'win',
        scoreSummary: '21-15',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    }
    const merged = mergeDrawScoutDisplayNotes([userNote])
    const murrayNotes = merged.filter(
      (note) =>
        note.target.kind === 'opponent' && note.target.name === 'Murray Wright',
    )
    expect(murrayNotes).toHaveLength(1)
    expect(murrayNotes[0]!.id).toBe('user-murray')
  })
})

describe('drawScout', () => {
  it('keeps prototype draws on the current/next weekend', () => {
    expect(getPrototypeDrawWeekend(new Date('2026-07-23T12:00:00'))).toEqual({
      startDate: '2026-07-25',
      endDate: '2026-07-26',
    })
    expect(getPrototypeDrawWeekend(new Date('2026-07-25T09:00:00'))).toEqual({
      startDate: '2026-07-25',
      endDate: '2026-07-26',
    })
    expect(getPrototypeDrawWeekend(new Date('2026-07-26T18:00:00'))).toEqual({
      startDate: '2026-07-25',
      endDate: '2026-07-26',
    })
    expect(isDrawScoutCompetitionActive(cambs)).toBe(true)
  })

  it('uses the last weekend day within the event span', () => {
    expect(getEventWeekendLastDay('2026-07-11', '2026-07-12')).toBe('2026-07-12')
    expect(getEventWeekendLastDay('2026-07-11', '2026-07-11')).toBe('2026-07-11')
    expect(getEventWeekendLastDay('2026-07-11', '2026-07-13')).toBe('2026-07-12')
  })

  it('expires after competition and weekend are both over', () => {
    const fixture = { startDate: '2026-07-11', endDate: '2026-07-12' }
    const during = new Date('2026-07-11T12:00:00')
    const sundayNight = new Date('2026-07-12T20:00:00')
    const monday = new Date('2026-07-13T09:00:00')

    expect(isDrawScoutCompetitionExpired(fixture, during)).toBe(false)
    expect(isDrawScoutCompetitionExpired(fixture, sundayNight)).toBe(false)
    expect(isDrawScoutCompetitionExpired(fixture, monday)).toBe(true)
    expect(isDrawScoutCompetitionActive({ ...cambs, ...fixture }, during)).toBe(true)
    expect(isDrawScoutCompetitionActive({ ...cambs, ...fixture }, monday)).toBe(false)
  })

  it('defaults to the user competition when available', () => {
    const slug = getDefaultCompetitionSlug(drawScoutPreviewCompetitions, {
      youName: 'Simon Parker',
      now: new Date('2026-07-17'),
    })
    expect(slug).toBe(cambs.slug)
  })

  it('prefers deep-linked competition when active', () => {
    const slug = getDefaultCompetitionSlug(drawScoutPreviewCompetitions, {
      deepLinkSlug: 'essex-senior-bronze-july-2026',
      now: new Date('2026-07-17'),
    })
    expect(slug).toBe('essex-senior-bronze-july-2026')
  })

  it('defaults player to you when entered', () => {
    expect(getDefaultPlayerName(cambs, 'Simon Parker')).toBe('Simon Parker')
    expect(getDefaultPlayerName(cambs, 'Someone Else')).toBe('Simon Parker')
  })

  it('counts distinct opponents with personal notes', () => {
    const notes = [
      noteFor('Murray Wright'),
      noteFor('Dan Martyres'),
      noteFor('Daniel Hughes'),
      noteFor('Ben Carter'),
    ]
    expect(countDrawOpponentsWithNotes(cambs, simon, notes)).toBe(4)
  })

  it('auto-shows when user, favourite, or deep link qualifies', () => {
    const now = new Date('2026-07-17')
    expect(
      shouldAutoShowDrawScoutCard(drawScoutPreviewCompetitions, {
        youName: 'Simon Parker',
        now,
      }),
    ).toBe(true)
    expect(
      shouldAutoShowDrawScoutCard(drawScoutPreviewCompetitions, {
        youName: 'Not Entered',
        now,
      }),
    ).toBe(true)
    expect(
      shouldAutoShowDrawScoutCard(drawScoutPreviewCompetitions, {
        deepLinkSlug: cambs.slug,
        now,
      }),
    ).toBe(true)
  })

  it('groups matchups by round while preserving order', () => {
    const grouped = groupMatchupsByRound([
      { id: 'a', roundLabel: 'Group A', yourSide: [], opponentSide: [] },
      { id: 'b', roundLabel: 'Group A', yourSide: [], opponentSide: [] },
      { id: 'c', roundLabel: 'QF', yourSide: [], opponentSide: [] },
    ])
    expect(grouped).toEqual([
      { roundLabel: 'Group A', matchups: expect.arrayContaining([expect.objectContaining({ id: 'a' }), expect.objectContaining({ id: 'b' })]) },
      { roundLabel: 'QF', matchups: [expect.objectContaining({ id: 'c' })] },
    ])
    expect(grouped[0]!.matchups).toHaveLength(2)
  })

  it('sorts later opponents by round earliest first', () => {
    const sorted = sortLaterOpponents([
      { name: 'Tom', disciplineCode: 'XD', roundLabel: 'Semi-finals' },
      { name: 'Ben', disciplineCode: 'OD', roundLabel: 'Quarter-finals' },
    ])
    expect(sorted.map((item) => item.name)).toEqual(['Ben', 'Tom'])
  })

  it('groups later opponents by round after sorting', () => {
    const grouped = groupLaterOpponentsByRound([
      { name: 'Tom', disciplineCode: 'XD', roundLabel: 'Semi-finals' },
      { name: 'Ben', disciplineCode: 'OD', roundLabel: 'Quarter-finals' },
      { name: 'Dan', disciplineCode: 'XD', roundLabel: 'Quarter-finals' },
    ])
    expect(grouped.map((group) => group.roundLabel)).toEqual(['Quarter-finals', 'Semi-finals'])
    expect(grouped[0]!.opponents.map((item) => item.name)).toEqual(['Ben', 'Dan'])
  })

  it('formats matchup intel teasers for notes, history, or both', () => {
    expect(formatMatchupIntelTeaser(0, 0)).toBeNull()
    expect(formatMatchupIntelTeaser(1, 0)).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: null,
    })
    expect(formatMatchupIntelTeaser(2, 0)).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: null,
    })
    expect(formatMatchupIntelTeaser(0, 1)).toEqual({
      hasNotes: false,
      notesCta: null,
      gamesLabel: 'Your games: 1',
    })
    expect(formatMatchupIntelTeaser(0, 3)).toEqual({
      hasNotes: false,
      notesCta: null,
      gamesLabel: 'Your games: 3',
    })
    expect(formatMatchupIntelTeaser(2, 3)).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: 'Your games: 3',
    })
    expect(formatMatchupIntelTeaser(0, 1, { viewingOwnDraw: false })).toEqual({
      hasNotes: false,
      notesCta: null,
      gamesLabel: 'Your games: 1',
    })
    expect(formatMatchupIntelTeaser(2, 3, { viewingOwnDraw: false })).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: 'Your games: 3',
    })
  })

  it('counts notes and unique previous meetings across a matchup', () => {
    const matchup = simon.disciplineGroups[0]!.matchups[0]!
    const counts = getMatchupIntelCounts(
      matchup,
      mergeDrawScoutDisplayNotes([]),
      drawScoutDemoMatches,
      'Simon Parker',
    )
    expect(counts.noteCount).toBeGreaterThan(0)
    expect(counts.gamesPlayed).toBeGreaterThan(0)
  })

  it('puts exact draw-pair notes ahead of individual notes for Dan & Alisha', () => {
    const notes = mergeDrawScoutDisplayNotes([])
    const pairNotes = getExactDrawPairNotes(notes, 'Dan Martyres', 'Alisha Johnson')
    expect(pairNotes.some((note) => note.id === 'draw-scout-demo:dan-alisha-pair')).toBe(true)

    const danSolo = getIndividualDrawScoutNotes(notes, 'Dan Martyres', 'Alisha Johnson')
    expect(danSolo.some((note) => note.id === 'draw-scout-demo:dan-alisha-pair')).toBe(false)
    expect(danSolo.some((note) => note.id === 'draw-scout-demo:dan')).toBe(true)

    const alishaSolo = getIndividualDrawScoutNotes(notes, 'Alisha Johnson', 'Dan Martyres')
    expect(alishaSolo.some((note) => note.id === 'draw-scout-demo:alisha')).toBe(true)
  })
})
