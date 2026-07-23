import { describe, expect, it } from 'vitest'
import {
  countDrawOpponentsWithNotes,
  formatMatchupIntelTeaser,
  filterLaterOpponentsByDiscipline,
  formatLaterOpponentProbability,
  getDefaultCompetitionSlug,
  getDefaultPlayerName,
  getEventWeekendLastDay,
  getExactDrawPairNotes,
  getIndividualDrawScoutNotes,
  getLaterOpponentIntelCounts,
  getMatchupIntelCounts,
  groupMatchupsByRound,
  groupLaterOpponentsByRound,
  isDrawScoutCompetitionActive,
  isDrawScoutCompetitionExpired,
  laterOpponentDisplayName,
  shouldAutoShowDrawScoutCard,
  sortLaterOpponents,
  sortLaterOpponentsWithinRound,
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
    expect(isDrawScoutCompetitionActive({ ...cambs, ...fixture, isPrototype: false }, during)).toBe(true)
    expect(isDrawScoutCompetitionActive({ ...cambs, ...fixture, isPrototype: false }, monday)).toBe(false)
  })

  it('keeps prototype preview competitions visible after the fixture weekend', () => {
    const mondayAfter = new Date('2026-07-20T09:00:00')
    expect(isDrawScoutCompetitionActive(cambs, mondayAfter)).toBe(true)
    expect(
      shouldAutoShowDrawScoutCard(drawScoutPreviewCompetitions, {
        youName: 'Simon Parker',
        now: mondayAfter,
      }),
    ).toBe(true)
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
      noteFor('Alisha Johnson'),
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

  it('formats later opponent probability as a whole-number percent', () => {
    expect(formatLaterOpponentProbability(0.53)).toBe('53%')
    expect(formatLaterOpponentProbability(0.385)).toBe('39%')
  })

  it('filters later opponents by discipline', () => {
    const opponents = cambs.laterOpponentsByEntrant['Simon Parker']!
    const xd = filterLaterOpponentsByDiscipline(opponents, 'XD')
    expect(xd.every((item) => item.disciplineCode === 'XD')).toBe(true)
    expect(xd.length).toBeGreaterThan(0)
  })

  it('sorts later opponents by round earliest first, then probability within round', () => {
    const opponents = cambs.laterOpponentsByEntrant['Simon Parker']!
    const sorted = sortLaterOpponents(opponents)
    expect(sorted[0]!.roundLabel).toBe('Quarter-finals')
    expect(sorted[0]!.probability).toBeGreaterThanOrEqual(sorted[1]!.probability)
  })

  it('sorts later opponents within a round by probability descending', () => {
    const qf = cambs.laterOpponentsByEntrant['Simon Parker']!.filter(
      (item) => item.disciplineCode === 'XD' && item.roundLabel === 'Quarter-finals',
    )
    const sorted = sortLaterOpponentsWithinRound(qf)
    expect(sorted.map((item) => item.probability)).toEqual([0.45, 0.35, 0.3, 0.25, 0.2, 0.15])
    expect(laterOpponentDisplayName(sorted[0]!)).toContain('Tom Fielding')
  })

  it('covers notes-only, games-only, both, and neither intel across later rounds', () => {
    const notes = mergeDrawScoutDisplayNotes([])
    const later = cambs.laterOpponentsByEntrant['Simon Parker']!.filter(
      (item) => item.disciplineCode === 'XD',
    )

    const states = later.map((opponent) => {
      const counts = getLaterOpponentIntelCounts(
        opponent,
        notes,
        drawScoutDemoMatches,
        'Simon Parker',
      )
      return {
        name: laterOpponentDisplayName(opponent),
        round: opponent.roundLabel,
        hasNotes: counts.noteCount > 0,
        hasGames: counts.gamesPlayed > 0,
      }
    })

    expect(states.some((s) => s.hasNotes && !s.hasGames)).toBe(true)
    expect(states.some((s) => !s.hasNotes && s.hasGames)).toBe(true)
    expect(states.some((s) => s.hasNotes && s.hasGames)).toBe(true)
    expect(states.some((s) => !s.hasNotes && !s.hasGames)).toBe(true)
    expect(states.some((s) => s.round === 'Quarter-finals' && !s.hasNotes && !s.hasGames)).toBe(
      true,
    )
    expect(states.some((s) => s.round === 'Semi-finals' && s.hasNotes && !s.hasGames)).toBe(true)
  })

  it('groups later opponents by round after sorting by probability within round', () => {
    const opponents = cambs.laterOpponentsByEntrant['Simon Parker']!.filter(
      (item) => item.disciplineCode === 'OD',
    )
    const grouped = groupLaterOpponentsByRound(opponents)
    expect(grouped.map((group) => group.roundLabel)).toEqual(['Quarter-finals'])
    expect(grouped[0]!.opponents.map((item) => item.probability)).toEqual([0.62, 0.38])
  })

  it('aggregates intel counts across a later opponent pair', () => {
    const danAlisha = cambs.laterOpponentsByEntrant['Simon Parker']!.find(
      (item) =>
        item.roundLabel === 'Semi-finals' &&
        item.opponentSide.some((player) => player.name === 'Dan Martyres'),
    )!
    const counts = getLaterOpponentIntelCounts(
      danAlisha,
      mergeDrawScoutDisplayNotes([]),
      drawScoutDemoMatches,
      'Simon Parker',
    )
    expect(counts.noteCount).toBeGreaterThan(0)
    expect(counts.gamesPlayed).toBeGreaterThan(0)
  })

  it('sorts later opponents by round earliest first', () => {
    const sorted = sortLaterOpponents([
      {
        opponentSide: [{ name: 'Tom', url: '' }],
        disciplineCode: 'XD',
        roundLabel: 'Semi-finals',
        probability: 0.5,
      },
      {
        opponentSide: [{ name: 'Ben', url: '' }],
        disciplineCode: 'OD',
        roundLabel: 'Quarter-finals',
        probability: 0.5,
      },
    ])
    expect(laterOpponentDisplayName(sorted[0]!)).toBe('Ben')
  })

  it('groups later opponents by round after sorting', () => {
    const grouped = groupLaterOpponentsByRound([
      {
        opponentSide: [{ name: 'Tom', url: '' }],
        disciplineCode: 'XD',
        roundLabel: 'Semi-finals',
        probability: 0.6,
      },
      {
        opponentSide: [{ name: 'Ben', url: '' }],
        disciplineCode: 'OD',
        roundLabel: 'Quarter-finals',
        probability: 0.7,
      },
      {
        opponentSide: [{ name: 'Dan', url: '' }],
        disciplineCode: 'XD',
        roundLabel: 'Quarter-finals',
        probability: 0.3,
      },
    ])
    expect(grouped.map((group) => group.roundLabel)).toEqual(['Quarter-finals', 'Semi-finals'])
    expect(grouped[0]!.opponents.map((item) => laterOpponentDisplayName(item))).toEqual([
      'Ben',
      'Dan',
    ])
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
      gamesLabel: 'Played you: 1',
    })
    expect(formatMatchupIntelTeaser(0, 3)).toEqual({
      hasNotes: false,
      notesCta: null,
      gamesLabel: 'Played you: 3',
    })
    expect(formatMatchupIntelTeaser(2, 3)).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: 'Played you: 3',
    })
    expect(formatMatchupIntelTeaser(0, 1, { viewingOwnDraw: false })).toEqual({
      hasNotes: false,
      notesCta: null,
      gamesLabel: 'Played you: 1',
    })
    expect(formatMatchupIntelTeaser(2, 3, { viewingOwnDraw: false })).toEqual({
      hasNotes: true,
      notesCta: 'View notes',
      gamesLabel: 'Played you: 3',
    })
  })

  it('counts notes and unique previous meetings across a matchup', () => {
    // Dan & Alisha: notes + games (both). Murray is notes-only in the prototype fixtures.
    const matchup = simon.disciplineGroups[0]!.matchups[1]!
    const counts = getMatchupIntelCounts(
      matchup,
      mergeDrawScoutDisplayNotes([]),
      drawScoutDemoMatches,
      'Simon Parker',
    )
    expect(counts.noteCount).toBeGreaterThan(0)
    expect(counts.gamesPlayed).toBeGreaterThan(0)
  })

  it('covers notes-only, games-only, both, and neither matchup fixtures', () => {
    const notes = mergeDrawScoutDisplayNotes([])
    const [xd, od] = simon.disciplineGroups
    const murray = getMatchupIntelCounts(xd!.matchups[0]!, notes, drawScoutDemoMatches, 'Simon Parker')
    const danAlisha = getMatchupIntelCounts(
      xd!.matchups[1]!,
      notes,
      drawScoutDemoMatches,
      'Simon Parker',
    )
    const gilHooly = getMatchupIntelCounts(
      od!.matchups[0]!,
      notes,
      drawScoutDemoMatches,
      'Simon Parker',
    )
    const neither = getMatchupIntelCounts(
      od!.matchups[1]!,
      notes,
      drawScoutDemoMatches,
      'Simon Parker',
    )

    expect(murray).toEqual({ noteCount: expect.any(Number), gamesPlayed: 0 })
    expect(murray.noteCount).toBeGreaterThan(0)
    expect(danAlisha.noteCount).toBeGreaterThan(0)
    expect(danAlisha.gamesPlayed).toBeGreaterThan(0)
    expect(gilHooly.noteCount).toBe(0)
    expect(gilHooly.gamesPlayed).toBeGreaterThan(0)
    expect(neither).toEqual({ noteCount: 0, gamesPlayed: 0 })
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
