import { describe, expect, it } from 'vitest'
import {
  clampDisplayWinChance,
  favoriteWinChancePercent,
  formatUpsetWinChanceDisplay,
  ourPreMatchWinChancePercent,
} from './ratingWinChance'

describe('favoriteWinChancePercent', () => {
  it('returns 50% at even rating', () => {
    expect(favoriteWinChancePercent(0)).toBe(50)
    expect(favoriteWinChancePercent(1)).toBe(50)
  })

  it('matches table at diff 72 and 74', () => {
    expect(favoriteWinChancePercent(72)).toBe(83.7)
    expect(favoriteWinChancePercent(74)).toBe(84.3)
  })

  it('extrapolates above 75 with +0.3 per point until capped at 99', () => {
    expect(favoriteWinChancePercent(75)).toBe(84.6)
    expect(favoriteWinChancePercent(76)).toBe(84.9)
    expect(favoriteWinChancePercent(200)).toBe(99)
  })
})

describe('ourPreMatchWinChancePercent', () => {
  it('returns underdog chance when rating gap is positive', () => {
    expect(ourPreMatchWinChancePercent(72)).toBe(16.3)
    expect(ourPreMatchWinChancePercent(0)).toBe(50)
  })

  it('returns favorite chance when we were higher rated', () => {
    expect(ourPreMatchWinChancePercent(-10)).toBe(55.2)
  })
})

describe('clampDisplayWinChance', () => {
  it('floors at 1% and caps at 99%', () => {
    expect(clampDisplayWinChance(0.2)).toBe(1)
    expect(clampDisplayWinChance(16.3)).toBe(16.3)
    expect(clampDisplayWinChance(99.5)).toBe(99)
  })
})

describe('formatUpsetWinChanceDisplay', () => {
  it('rounds to whole percent', () => {
    expect(formatUpsetWinChanceDisplay(clampDisplayWinChance(16.3))).toBe('16%')
    expect(formatUpsetWinChanceDisplay(clampDisplayWinChance(0.2))).toBe('1%')
  })
})
