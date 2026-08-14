import { describe, expect, it } from 'vitest'
import {
  splitStagesToFit,
  stagesForVisitor,
  type TournamentPageStage,
} from './stageChipOverflow'

const ALL: TournamentPageStage[] = [
  'Finals',
  'Qualification',
  'Consolation',
  'Companion',
  'Groups',
  'Entries',
]

describe('stagesForVisitor', () => {
  it('keeps Companion for Premium / gift visitors', () => {
    expect(stagesForVisitor(true)).toEqual(ALL)
  })

  it('omits Companion when hidden', () => {
    expect(stagesForVisitor(false)).toEqual([
      'Finals',
      'Qualification',
      'Consolation',
      'Groups',
      'Entries',
    ])
  })
})

describe('splitStagesToFit', () => {
  const widths = [70, 110, 100, 95, 70, 70]
  const overflowWidth = 72
  const gap = 8

  it('shows every chip when they all fit', () => {
    const { visible, overflow } = splitStagesToFit({
      stages: ALL,
      chipWidths: widths,
      overflowWidth,
      availableWidth: 1000,
      gap,
    })
    expect(visible).toEqual(ALL)
    expect(overflow).toEqual([])
  })

  it('keeps higher-priority chips and puts the rest in overflow', () => {
    // Finals + Qual + overflow ≈ 70+110+72 + 16 gap = 268
    const { visible, overflow } = splitStagesToFit({
      stages: ALL,
      chipWidths: widths,
      overflowWidth,
      availableWidth: 280,
      gap,
    })
    expect(visible).toEqual(['Finals', 'Qualification'])
    expect(overflow).toEqual(['Consolation', 'Companion', 'Groups', 'Entries'])
  })

  it('does not skip a wide chip to fit a later narrow one', () => {
    const { visible, overflow } = splitStagesToFit({
      stages: ['Qualification', 'Entries'],
      chipWidths: [200, 40],
      overflowWidth: 50,
      availableWidth: 120,
      gap,
    })
    expect(visible).toEqual([])
    expect(overflow).toEqual(['Qualification', 'Entries'])
  })

  it('can show only the overflow control when nothing else fits', () => {
    const { visible, overflow } = splitStagesToFit({
      stages: ALL,
      chipWidths: widths,
      overflowWidth,
      availableWidth: overflowWidth,
      gap,
    })
    expect(visible).toEqual([])
    expect(overflow).toEqual(ALL)
  })
})
