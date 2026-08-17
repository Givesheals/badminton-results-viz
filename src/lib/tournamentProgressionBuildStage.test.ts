import { describe, expect, it } from 'vitest'
import {
  fullTournamentProgressionBuildFeatures,
  getTournamentProgressionBuildFeatures,
  TOURNAMENT_PROGRESSION_BUILD_STAGES,
} from './tournamentProgressionBuildStage'

describe('tournamentProgressionBuildStage', () => {
  it('lists all six ticket stages', () => {
    expect(TOURNAMENT_PROGRESSION_BUILD_STAGES).toEqual([1, 2, 3, 4, 5, 6])
  })

  it('gates features by ticket number', () => {
    const shell = getTournamentProgressionBuildFeatures(1)
    expect(shell.showMatchCount).toBe(false)
    expect(shell.showTypicalRun).toBe(false)
    expect(shell.showFinishDistribution).toBe(false)
    expect(shell.showFilters).toBe(false)
    expect(shell.showInfo).toBe(false)

    const data = getTournamentProgressionBuildFeatures(2)
    expect(data.showMatchCount).toBe(true)
    expect(data.showTypicalRun).toBe(false)
    expect(data.showFinishDistribution).toBe(false)
    expect(data.showFilters).toBe(false)
    expect(data.showInfo).toBe(false)

    const typical = getTournamentProgressionBuildFeatures(3)
    expect(typical.showMatchCount).toBe(true)
    expect(typical.showTypicalRun).toBe(true)
    expect(typical.showFinishDistribution).toBe(false)
    expect(typical.showFilters).toBe(false)
    expect(typical.showInfo).toBe(false)

    const distribution = getTournamentProgressionBuildFeatures(4)
    expect(distribution.showTypicalRun).toBe(true)
    expect(distribution.showFinishDistribution).toBe(true)
    expect(distribution.showFilters).toBe(false)
    expect(distribution.showInfo).toBe(false)

    const filters = getTournamentProgressionBuildFeatures(5)
    expect(filters.showFinishDistribution).toBe(true)
    expect(filters.showFilters).toBe(true)
    expect(filters.showInfo).toBe(false)

    const info = getTournamentProgressionBuildFeatures(6)
    expect(info.showMatchCount).toBe(true)
    expect(info.showTypicalRun).toBe(true)
    expect(info.showFinishDistribution).toBe(true)
    expect(info.showFilters).toBe(true)
    expect(info.showInfo).toBe(true)
  })

  it('full features match stage 6', () => {
    expect(fullTournamentProgressionBuildFeatures()).toEqual(
      getTournamentProgressionBuildFeatures(6),
    )
  })
})
