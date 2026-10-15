import { describe, expect, it } from 'vitest'
import {
  halfGridRows,
  placeHalfGrid,
  placeTallestFirst,
  sequentialHalfGrid,
  sortByDisciplineOrder,
  tallestFirstIndexes,
  visualDisciplineIndexes,
} from './halfGridPlacement'

describe('placeHalfGrid', () => {
  it('keeps a single card in the left column', () => {
    expect(placeHalfGrid([240])).toEqual([{ row: 1, col: 1 }])
  })

  it('puts the first two events side by side when heights match', () => {
    expect(halfGridRows(placeHalfGrid([180, 180]))).toEqual([[0, 1]])
  })

  it('drops the last event when every card is a similar height', () => {
    expect(halfGridRows(placeHalfGrid([200, 210, 220]))).toEqual([
      [0, 1],
      [2],
    ])
  })

  it('pairs the two closest cards and leaves the odd height below', () => {
    expect(halfGridRows(placeHalfGrid([100, 400, 420]))).toEqual([
      [1, 2],
      [0],
    ])
    expect(halfGridRows(placeHalfGrid([300, 100, 110]))).toEqual([
      [1, 2],
      [0],
    ])
  })

  it('groups four cards into the two closest pairs, earlier events first', () => {
    expect(halfGridRows(placeHalfGrid([100, 400, 110, 420]))).toEqual([
      [0, 2],
      [1, 3],
    ])
  })

  it('leaves the height that does not fit a pair on the last row', () => {
    expect(halfGridRows(placeHalfGrid([10, 500, 11, 100, 101]))).toEqual([
      [0, 2],
      [3, 4],
      [1],
    ])
  })
})

describe('placeTallestFirst', () => {
  it('keeps a single card in the left column', () => {
    expect(placeTallestFirst([240])).toEqual([{ row: 1, col: 1 }])
  })

  it('puts the taller card on the left when two heights differ', () => {
    expect(halfGridRows(placeTallestFirst([180, 320]))).toEqual([[1, 0]])
  })

  it('fills tallest to shortest, with the shortest alone on the last row', () => {
    expect(halfGridRows(placeTallestFirst([100, 400, 250]))).toEqual([
      [1, 2],
      [0],
    ])
  })

  it('keeps equal heights in their original order', () => {
    expect(halfGridRows(placeTallestFirst([200, 200, 200, 80]))).toEqual([
      [0, 1],
      [2, 3],
    ])
  })
})

describe('visualDisciplineIndexes', () => {
  it('keeps the original order until heights are known', () => {
    expect(visualDisciplineIndexes(2, null)).toEqual([0, 1])
  })

  it('puts the taller of two events on the left', () => {
    expect(visualDisciplineIndexes(2, [180, 320])).toEqual([1, 0])
  })
})

describe('sortByDisciplineOrder', () => {
  it('follows the event-card order so a poster sits above its event', () => {
    const posters = [
      { discipline: 'WD', label: 'Women' },
      { discipline: 'XD', label: 'Mixed' },
    ]
    expect(sortByDisciplineOrder(posters, ['XD', 'WD']).map((poster) => poster.discipline)).toEqual([
      'XD',
      'WD',
    ])
  })

  it('leaves the original order alone before the events have been measured', () => {
    const posters = [{ discipline: 'WD' }, { discipline: 'XD' }]
    expect(sortByDisciplineOrder(posters, []).map((poster) => poster.discipline)).toEqual(['WD', 'XD'])
  })
})

describe('tallestFirstIndexes', () => {
  it('orders three events tallest to shortest for a single wide row', () => {
    expect(tallestFirstIndexes([100, 400, 250])).toEqual([1, 2, 0])
  })
})

describe('sequentialHalfGrid', () => {
  it('fills left then right, with a short last row', () => {
    expect(sequentialHalfGrid(3)).toEqual([
      { row: 1, col: 1 },
      { row: 1, col: 2 },
      { row: 2, col: 1 },
    ])
  })
})
