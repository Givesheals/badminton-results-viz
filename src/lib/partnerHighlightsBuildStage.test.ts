import { describe, expect, it } from 'vitest'
import {
  fullPartnerHighlightsBuildFeatures,
  getPartnerHighlightsBuildFeatures,
  PARTNER_HIGHLIGHTS_BUILD_STAGES,
} from './partnerHighlightsBuildStage'

describe('partnerHighlightsBuildStage', () => {
  it('lists all ticket stages including empty 3.5', () => {
    expect(PARTNER_HIGHLIGHTS_BUILD_STAGES).toEqual([1, 2, 3, 3.5, 4, 5, 6, 7])
  })

  it('gates features by ticket number', () => {
    const shell = getPartnerHighlightsBuildFeatures(1)
    expect(shell.showDisciplines).toBe(false)
    expect(shell.showPartnerCards).toBe(false)
    expect(shell.forceEmptyFamilies).toBe(false)
    expect(shell.showStageChips).toBe(false)
    expect(shell.showHistoryAccordion).toBe(false)
    expect(shell.showMatches).toBe(false)
    expect(shell.showFilters).toBe(false)
    expect(shell.showInfo).toBe(false)

    const disciplines = getPartnerHighlightsBuildFeatures(2)
    expect(disciplines.showDisciplines).toBe(true)
    expect(disciplines.showPartnerCards).toBe(false)
    expect(disciplines.showFilters).toBe(false)

    const partners = getPartnerHighlightsBuildFeatures(3)
    expect(partners.showPartnerCards).toBe(true)
    expect(partners.forceEmptyFamilies).toBe(false)
    expect(partners.showStageChips).toBe(false)
    expect(partners.showHistoryAccordion).toBe(false)

    const empty = getPartnerHighlightsBuildFeatures(3.5)
    expect(empty.showDisciplines).toBe(true)
    expect(empty.showPartnerCards).toBe(true)
    expect(empty.forceEmptyFamilies).toBe(true)
    expect(empty.showStageChips).toBe(false)
    expect(empty.showHistoryAccordion).toBe(false)
    expect(empty.showMatches).toBe(false)
    expect(empty.showFilters).toBe(false)
    expect(empty.showInfo).toBe(false)

    const history = getPartnerHighlightsBuildFeatures(4)
    expect(history.showStageChips).toBe(true)
    expect(history.showHistoryAccordion).toBe(true)
    expect(history.showMatches).toBe(false)
    expect(history.showFilters).toBe(false)

    const matches = getPartnerHighlightsBuildFeatures(5)
    expect(matches.showMatches).toBe(true)
    expect(matches.showFilters).toBe(false)
    expect(matches.showInfo).toBe(false)

    const filters = getPartnerHighlightsBuildFeatures(6)
    expect(filters.showFilters).toBe(true)
    expect(filters.showInfo).toBe(false)

    const info = getPartnerHighlightsBuildFeatures(7)
    expect(info.showDisciplines).toBe(true)
    expect(info.showPartnerCards).toBe(true)
    expect(info.forceEmptyFamilies).toBe(false)
    expect(info.showStageChips).toBe(true)
    expect(info.showHistoryAccordion).toBe(true)
    expect(info.showMatches).toBe(true)
    expect(info.showFilters).toBe(true)
    expect(info.showInfo).toBe(true)
  })

  it('only stage 3.5 forces empty families', () => {
    for (const stage of PARTNER_HIGHLIGHTS_BUILD_STAGES) {
      expect(getPartnerHighlightsBuildFeatures(stage).forceEmptyFamilies).toBe(
        stage === 3.5,
      )
    }
  })

  it('full features match stage 7', () => {
    expect(fullPartnerHighlightsBuildFeatures()).toEqual(
      getPartnerHighlightsBuildFeatures(7),
    )
  })
})
