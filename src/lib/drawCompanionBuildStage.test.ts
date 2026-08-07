import { describe, expect, it } from 'vitest'
import {
  applyDrawCompanionBuildStage,
  getDrawCompanionBuildFeatures,
} from './drawCompanionBuildStage'
import { getDrawScoutPreviewCompetitions } from './drawScoutPreviewData'

function cambs() {
  return getDrawScoutPreviewCompetitions().find(
    (comp) => comp.slug === 'cambridgeshire-senior-bronze-july-2026',
  )!
}

function simon(comp = cambs()) {
  return comp.entrants.find((entrant) => entrant.name === 'Simon Parker')!
}

describe('drawCompanionBuildStage', () => {
  it('gates features by ticket number', () => {
    expect(getDrawCompanionBuildFeatures(1).showDraw).toBe(false)
    expect(getDrawCompanionBuildFeatures(2).showDraw).toBe(true)
    expect(getDrawCompanionBuildFeatures(2).showPlayerPicker).toBe(false)
    expect(getDrawCompanionBuildFeatures(3).showPlayerPicker).toBe(true)
    expect(getDrawCompanionBuildFeatures(4).showMatchHistory).toBe(true)
    expect(getDrawCompanionBuildFeatures(5).showCompletedResults).toBe(true)
    expect(getDrawCompanionBuildFeatures(5).earlyDisciplinesOnly).toBe(false)
    expect(getDrawCompanionBuildFeatures(4).earlyDisciplinesOnly).toBe(true)
    expect(getDrawCompanionBuildFeatures(6).showBusyBanner).toBe(true)
    expect(getDrawCompanionBuildFeatures(7).showYouMayAlsoMeet).toBe(true)
    expect(getDrawCompanionBuildFeatures(7).showNotes).toBe(false)
    expect(getDrawCompanionBuildFeatures(8).showNotes).toBe(true)
    expect(getDrawCompanionBuildFeatures(8).showYouMayAlsoMeet).toBe(true)
  })

  it('stage 2 keeps OS + OD upcoming cards and strips results / busy / later', () => {
    const shaped = applyDrawCompanionBuildStage(cambs(), 2)
    const groups = simon(shaped).disciplineGroups
    expect(groups.map((group) => group.disciplineCode)).toEqual(['OS', 'OD'])
    expect(groups.every((group) => group.matchups.every((matchup) => matchup.result == null))).toBe(
      true,
    )
    expect(groups.find((group) => group.disciplineCode === 'OD')!.matchups.length).toBeGreaterThan(0)
    expect(shaped.busyPlayersByName).toBeUndefined()
    expect(shaped.laterOpponentsByEntrant['Simon Parker'] ?? []).toEqual([])
  })

  it('stage 5 restores completed cards across disciplines without probable next', () => {
    const shaped = applyDrawCompanionBuildStage(cambs(), 5)
    const groups = simon(shaped).disciplineGroups
    expect(groups.map((group) => group.disciplineCode)).toEqual(['OS', 'OD', 'XD'])
    const od = groups.find((group) => group.disciplineCode === 'OD')!
    expect(od.matchups.some((matchup) => matchup.result != null)).toBe(true)
    expect(od.matchups.some((matchup) => matchup.opponentPending)).toBe(false)
    expect(shaped.busyPlayersByName).toBeUndefined()
  })

  it('stage 6 surfaces Callum busy; stage 7 restores later + probable', () => {
    const busy = applyDrawCompanionBuildStage(cambs(), 6)
    expect(busy.busyPlayersByName?.['Callum Reed']).toEqual({
      disciplineCode: 'OD',
      nextRoundShort: 'QF',
    })

    const full = applyDrawCompanionBuildStage(cambs(), 7)
    const od = simon(full).disciplineGroups.find((group) => group.disciplineCode === 'OD')!
    expect(od.matchups.some((matchup) => matchup.opponentPending)).toBe(true)
    expect((full.laterOpponentsByEntrant['Simon Parker'] ?? []).length).toBeGreaterThan(0)

    const withNotes = applyDrawCompanionBuildStage(cambs(), 8)
    expect((withNotes.laterOpponentsByEntrant['Simon Parker'] ?? []).length).toBeGreaterThan(0)
    expect(withNotes.busyPlayersByName?.['Callum Reed']).toBeDefined()
  })
})
