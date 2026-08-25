import { describe, expect, it } from 'vitest'
import {
  countNotesWithCustomTag,
  formatCustomTagUsageSentence,
  removeCustomTagFromAllNotes,
  renameCustomTagOnAllNotes,
  uniqueSubjectsForCustomTag,
} from './customTagNoteUpdates'
import type { OpponentNote } from './opponentNotes'

function note(overrides: Partial<OpponentNote> = {}): OpponentNote {
  return {
    id: 'n1',
    body: '',
    target: { kind: 'match' },
    context: {
      matchKey: 'm1',
      competitionName: 'Test',
      date: '2025-01-01',
      discipline: 'WS',
      disciplineLabel: "Women's singles",
      partnerName: null,
      opponentNames: ['Lee'],
      opponentsDisplay: 'Lee',
      roundLabel: null,
      outcome: 'unknown',
      scoreSummary: '',
    },
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('customTagNoteUpdates', () => {
  it('counts notes using a custom tag', () => {
    const notes = [
      note({ tags: { customSelfFeel: ['On form'] } }),
      note({ id: 'n2', tags: { customSelfFeel: ['Tired', 'On form'] } }),
      note({ id: 'n3', tags: { customGameEvents: ['On form'] } }),
    ]
    expect(countNotesWithCustomTag(notes, 'selfFeel', 'On form')).toBe(2)
  })

  it('renames a custom tag on all matching notes', () => {
    const notes = [
      note({ tags: { customSelfFeel: ['On form'] } }),
      note({ id: 'n2', tags: { customSelfFeel: ['Tired'] } }),
    ]
    const updated = renameCustomTagOnAllNotes(notes, 'selfFeel', 'On form', 'In form')
    expect(updated[0]?.tags?.customSelfFeel).toEqual(['In form'])
    expect(updated[1]?.tags?.customSelfFeel).toEqual(['Tired'])
  })

  it('removes a custom tag from all matching notes', () => {
    const notes = [
      note({ tags: { customGameEvents: ['Long day', 'Faded'] } }),
      note({ id: 'n2', tags: { customGameEvents: ['Long day'] } }),
    ]
    const updated = removeCustomTagFromAllNotes(notes, 'gameEvents', 'Long day')
    expect(updated[0]?.tags?.customGameEvents).toEqual(['Faded'])
    expect(updated[1]?.tags).toBeUndefined()
  })

  it('lists unique note subjects alphabetically for a custom tag', () => {
    const notes = [
      note({
        id: 'n1',
        target: { kind: 'opponent', name: 'Kacper Banas' },
        context: {
          matchKey: 'm1',
          competitionName: 'Test',
          date: '2025-01-01',
          discipline: 'MS',
          disciplineLabel: "Men's singles",
          partnerName: null,
          opponentNames: ['Kacper Banas'],
          opponentsDisplay: 'Kacper Banas',
          roundLabel: null,
          outcome: 'unknown',
          scoreSummary: '',
        },
        tags: { customOpponentStyles: ['Lefty'] },
      }),
      note({
        id: 'n2',
        target: { kind: 'opponent', name: 'Kacper Banas' },
        context: {
          matchKey: 'm2',
          competitionName: 'Test',
          date: '2025-01-02',
          discipline: 'MS',
          disciplineLabel: "Men's singles",
          partnerName: null,
          opponentNames: ['Kacper Banas'],
          opponentsDisplay: 'Kacper Banas',
          roundLabel: null,
          outcome: 'unknown',
          scoreSummary: '',
        },
        tags: { customOpponentStyles: ['Lefty'] },
      }),
      note({
        id: 'n3',
        target: { kind: 'pair' },
        context: {
          matchKey: 'm3',
          competitionName: 'Test',
          date: '2025-01-03',
          discipline: 'MD',
          disciplineLabel: "Men's doubles",
          partnerName: 'Pat',
          opponentNames: ['Jack Smith', 'Kwok Wong'],
          opponentsDisplay: 'Jack Smith & Kwok Wong',
          roundLabel: null,
          outcome: 'unknown',
          scoreSummary: '',
        },
        tags: { customPairStyles: ['Lefty'] },
      }),
    ]

    expect(uniqueSubjectsForCustomTag(notes, 'opponentStyles', 'Lefty')).toEqual([
      'Jack Smith & Kwok Wong',
      'Kacper Banas',
    ])
  })

  it('formats the usage sentence with at most two names', () => {
    expect(formatCustomTagUsageSentence(1, ['Jack Smith'])).toBe(
      'This tag is on 1 saved note (Jack Smith).',
    )
    expect(formatCustomTagUsageSentence(2, ['Jack Smith', 'Kacper Banas'])).toBe(
      'This tag is on 2 saved notes (Jack Smith and Kacper Banas).',
    )
    expect(
      formatCustomTagUsageSentence(5, [
        'Jack Smith',
        'Kacper Banas',
        'Kwok Wong',
        'Lee',
        'Pat',
      ]),
    ).toBe('This tag is on 5 saved notes (Jack Smith, Kacper Banas, and 3 more).')
  })
})
