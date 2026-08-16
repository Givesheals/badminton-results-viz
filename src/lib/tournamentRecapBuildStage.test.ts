import { describe, expect, it } from 'vitest'
import {
  fullTournamentRecapBuildFeatures,
  getTournamentRecapBuildFeatures,
  TOURNAMENT_RECAP_BUILD_STAGES,
} from './tournamentRecapBuildStage'

describe('tournamentRecapBuildStage', () => {
  it('lists all ten ticket stages', () => {
    expect(TOURNAMENT_RECAP_BUILD_STAGES).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  })

  it('gates features by ticket number', () => {
    expect(getTournamentRecapBuildFeatures(1).showDisciplines).toBe(false)
    expect(getTournamentRecapBuildFeatures(2).showDisciplines).toBe(true)
    expect(getTournamentRecapBuildFeatures(2).showWinPercent).toBe(false)
    expect(getTournamentRecapBuildFeatures(3).showWinPercent).toBe(true)
    expect(getTournamentRecapBuildFeatures(3).showPodium).toBe(false)

    const results = getTournamentRecapBuildFeatures(4)
    expect(results.showPodium).toBe(true)
    expect(results.showDebutMilestones).toBe(true)
    expect(results.showPersonalBests).toBe(true)
    expect(results.showSeniorCountyDebut).toBe(true)
    expect(results.showEventSummaries).toBe(false)

    expect(getTournamentRecapBuildFeatures(5).showEventSummaries).toBe(true)
    expect(getTournamentRecapBuildFeatures(5).showDisciplineCallouts).toBe(false)
    expect(getTournamentRecapBuildFeatures(6).showDisciplineCallouts).toBe(true)
    expect(getTournamentRecapBuildFeatures(6).showMatchHighlights).toBe(false)
    expect(getTournamentRecapBuildFeatures(7).showMatchHighlights).toBe(true)
    expect(getTournamentRecapBuildFeatures(7).showRecordMilestones).toBe(false)
    expect(getTournamentRecapBuildFeatures(8).showRecordMilestones).toBe(true)
    expect(getTournamentRecapBuildFeatures(8).showFreakFlags).toBe(false)
    expect(getTournamentRecapBuildFeatures(9).showFreakFlags).toBe(true)
    expect(getTournamentRecapBuildFeatures(9).showNotes).toBe(false)
    expect(getTournamentRecapBuildFeatures(10).showNotes).toBe(true)
  })

  it('full features match stage 10', () => {
    expect(fullTournamentRecapBuildFeatures()).toEqual(getTournamentRecapBuildFeatures(10))
  })
})
