import { describe, expect, it } from 'vitest'
import {
  formatJournalTagsForDisplay,
  formatNoteTagsForDisplay,
  normalizeNoteTags,
  noteHasContent,
  noteHasJournalTagContent,
  scoutingTagsForTarget,
  type NoteTags,
} from './noteTags'

describe('noteTags', () => {
  it('normalizes journal tag groups in stable order', () => {
    expect(
      normalizeNoteTags({
        selfFeel: ['nervous', 'tired'],
        matchFlow: ['lost_lead', 'comeback_us'],
      }),
    ).toEqual({
      selfFeel: ['tired', 'nervous'],
      matchFlow: ['comeback_us', 'lost_lead'],
    })
  })

  it('migrates legacy gameContext tags into scoped groups', () => {
    expect(
      normalizeNoteTags({
        gameContext: ['tired', 'partner_injured', 'comeback', 'close_match'],
      }),
    ).toEqual({
      selfFeel: ['tired'],
      partnerContext: ['partner_injured'],
      matchFlow: ['comeback_us'],
    })
  })

  it('detects content from tags or body', () => {
    expect(noteHasContent('', { opponentStyles: ['all_rounder'] })).toBe(true)
    expect(noteHasJournalTagContent({ selfFeel: ['sharp'] })).toBe(true)
    expect(noteHasContent('hello', undefined)).toBe(true)
    expect(noteHasContent('  ', undefined)).toBe(false)
  })

  it('formats scouting and journal tags for display', () => {
    expect(
      formatNoteTagsForDisplay({
        opponentStyles: ['front_court'],
        pairStyles: ['flat_fast'],
        selfFeel: ['tired'],
        matchFlow: ['comeback_us'],
        customOpponentStyles: ['Lobs a lot'],
        customSelfFeel: ['On form'],
        customGameEvents: ['Long day'],
      }),
    ).toEqual([
      'Front-court player',
      'Flat, fast pair',
      'Lobs a lot',
      'I was tired',
      'On form',
      'We came back',
      'Long day',
    ])

    expect(
      formatJournalTagsForDisplay({
        selfFeel: ['nervous'],
        partnerContext: ['partner_injured'],
        matchFlow: ['lost_lead'],
        customGameEvents: ['Faded in G2'],
      }),
    ).toEqual(['I was nervous', 'We lost a lead', 'Partner injured', 'Faded in G2'])
  })

  it('normalizes custom tag lists on notes', () => {
    expect(
      normalizeNoteTags({
        customOpponentStyles: ['  Slow start ', 'slow start'],
        customGameEvents: ['Long day'],
      }),
    ).toEqual({
      customOpponentStyles: ['Slow start'],
      customGameEvents: ['Long day'],
    })
  })

  it('scopes scouting tags to the active target', () => {
    const tags: NoteTags = {
      opponentStyles: ['front_court'],
      pairStyles: ['flat_fast'],
      selfFeel: ['tired'],
    }
    expect(scoutingTagsForTarget(tags, { kind: 'opponent', name: 'Lee' })).toEqual({
      opponentStyles: ['front_court'],
    })
    expect(scoutingTagsForTarget(tags, { kind: 'pair' })).toEqual({
      pairStyles: ['flat_fast'],
    })
  })
})
