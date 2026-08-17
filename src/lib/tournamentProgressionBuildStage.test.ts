import { describe, expect, it } from 'vitest'
import {
  fullTournamentProgressionBuildFeatures,
  getTournamentProgressionBuildFeatures,
  TOURNAMENT_PROGRESSION_BUILD_STAGES,
} from './tournamentProgressionBuildStage'

describe('tournamentProgressionBuildStage', () => {
  it('lists all five ticket stages', () => {
    expect(TOURNAMENT_PROGRESSION_BUILD_STAGES).toEqual([1, 2, 3, 4, 5])
  })

  it('gates features by ticket number', () => {
    const shell = getTournamentProgressionBuildFeatures(1)
    expect(shell.showTypicalRun).toBe(false)
    expect(shell.showFinishDistribution).toBe(false)
    expect(shell.showFilters).toBe(false)
    expect(shell.showInfo).toBe(false)

    const typical = getTournamentProgressionBuildFeatures(2)
    expect(typical.showTypicalRun).toBe(true)
    expect(typical.showFinishDistribution).toBe(false)
    expect(typical.showFilters).toBe(false)
    expect(typical.showInfo).toBe(false)

    const distribution = getTournamentProgressionBuildFeatures(3)
    expect(distribution.showTypicalRun).toBe(true)
    expect(distribution.showFinishDistribution).toBe(true)
    expect(distribution.showFilters).toBe(false)
    expect(distribution.showInfo).toBe(false)

    const filters = getTournamentProgressionBuildFeatures(4)
    expect(filters.showTypicalRun).toBe(true)
    expect(filters.showFinishDistribution).toBe(true)
    expect(filters.showFilters).toBe(true)
    expect(filters.showInfo).toBe(false)

    const info = getTournamentProgressionBuildFeatures(5)
    expect(info.showTypicalRun).toBe(true)
    expect(info.showFinishDistribution).toBe(true)
    expect(info.showFilters).toBe(true)
    expect(info.showInfo).toBe(true)
  })

  it('full features match stage 5', () => {
    expect(fullTournamentProgressionBuildFeatures()).toEqual(
      getTournamentProgressionBuildFeatures(5),
    )
  })
})
