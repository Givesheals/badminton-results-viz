import { describe, expect, it } from 'vitest'
import {
  countNotesWithCustomTag,
  removeCustomTagFromAllNotes,
  renameCustomTagOnAllNotes,
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
})
