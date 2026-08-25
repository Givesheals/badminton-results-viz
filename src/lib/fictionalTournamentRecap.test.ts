import { describe, expect, it } from 'vitest'
import type { TournamentRecap } from './tournamentRecap'
import {
  FICTIONAL_CONDENSED_TOURNAMENT_NAME,
  FICTIONAL_CONDENSED_TOURNAMENT_RECAP_INDEX,
  FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY,
  FICTIONAL_TOURNAMENT_NAME,
  FICTIONAL_TOURNAMENT_RECAP_INDEX,
  FICTIONAL_TOURNAMENT_RECAP_KEY,
  buildCondensedFictionalTournamentRecap,
  buildFictionalTournamentRecap,
  fictionalCelebrationPresentation,
  insertFictionalTournamentRecap,
} from './fictionalTournamentRecap'

function stubRecap(key: string): TournamentRecap {
  return {
    ...buildFictionalTournamentRecap(),
    key,
    competitionName: key,
  }
}

describe('buildFictionalTournamentRecap', () => {
  const recap = buildFictionalTournamentRecap()

  it('is clearly fictional and spans a weekend', () => {
    expect(recap.key).toBe(FICTIONAL_TOURNAMENT_RECAP_KEY)
    expect(recap.competitionName).toBe(FICTIONAL_TOURNAMENT_NAME)
    expect(recap.dateFrom).not.toBe(recap.dateTo)
    expect(recap.weekendWinPercent).not.toBe(100)
  })

  it('shows every top-layer celebration card once, with first-time flavour text', () => {
    const { celebrations } = recap
    expect(celebrations.seniorCountyDebut).not.toBeNull()
    expect(celebrations.winners).toHaveLength(1)
    expect(celebrations.runnerUps).toHaveLength(1)
    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.winners[0]!.subtitle).toBe('Your first Gold title')
    expect(celebrations.runnerUps[0]!.subtitle).toBe('Your first Gold runner-up finish')
    expect(celebrations.jointThirds[0]!.subtitle).toBe('Your first Gold third place finish')
    expect(
      [
        celebrations.winners[0]!.competitionAgeLabel,
        celebrations.runnerUps[0]!.competitionAgeLabel,
        celebrations.jointThirds[0]!.competitionAgeLabel,
      ].sort(),
    ).toEqual(['Junior', 'Masters', 'Senior'])
    expect(
      celebrations.milestones.map((milestone) => milestone.competitionAgeLabel).sort(),
    ).toEqual(['Junior', 'Masters', 'Senior'])
    expect(celebrations.milestones.map((milestone) => milestone.variant).sort()).toEqual([
      'debut',
      'matched_best',
      'personal_best',
    ])
  })

  it('shows every event summary and record-milestone kind', () => {
    expect(recap.eventSummaries.map((card) => card.id).sort()).toEqual([
      'busy-weekend',
      'great-form',
      'tough-luck',
    ])
    expect(recap.recordMilestones.map((milestone) => milestone.kind).sort()).toEqual([
      'best_win_strength',
      'best_win_upset',
      'nemesis_top5',
      'scalp_top5',
    ])
  })

  it('gives all three disciplines wins, losses, scores, and both callouts', () => {
    expect(recap.disciplines.map((d) => d.discipline)).toEqual(['MD', 'WD', 'XD'])
    for (const discipline of recap.disciplines) {
      expect(discipline.matchWins).toBeGreaterThan(0)
      expect(discipline.matchLosses).toBeGreaterThan(0)
      expect(discipline.matches.every((match) => match.scoreSummary.length > 0)).toBe(true)
      expect(discipline.matches.every((match) => match.showPartnerName)).toBe(false)
      expect(discipline.eventCallouts.map((card) => card.label)).toEqual([
        'Great run',
        `Your chemistry with ${discipline.partnerName} increased`,
      ])
      expect(discipline.matches.some((match) => match.highlights.some((h) => h.id === 'your-strongest-beaten'))).toBe(
        true,
      )
      expect(discipline.matches.some((match) => match.highlights.some((h) => h.label === 'Big upset!'))).toBe(
        true,
      )
    }
  })

  it('shows every curiosity card kind', () => {
    expect(recap.freakFlags.map((flag) => flag.kind).sort()).toEqual([
      'lost_to_winner',
      'money_worth',
      'nailbiter',
      'shoulda_been_final',
      'single_digit_scare',
    ])
    expect(recap.emojiInsights).toEqual([])
    expect(recap.otherEventInsights).toEqual([])
  })
})

describe('insertFictionalTournamentRecap', () => {
  it('places expanded then condensed recaps in the fifth and sixth slots', () => {
    const recaps = Array.from({ length: 6 }, (_, index) => stubRecap(`real-${index}`))
    const next = insertFictionalTournamentRecap(recaps)
    expect(next).toHaveLength(8)
    expect(next[FICTIONAL_TOURNAMENT_RECAP_INDEX]!.key).toBe(FICTIONAL_TOURNAMENT_RECAP_KEY)
    expect(next[FICTIONAL_CONDENSED_TOURNAMENT_RECAP_INDEX]!.key).toBe(
      FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY,
    )
    expect(next[3]!.key).toBe('real-3')
    expect(next[6]!.key).toBe('real-4')
  })

  it('appends both when there are fewer than four real recaps', () => {
    const next = insertFictionalTournamentRecap([stubRecap('a'), stubRecap('b')])
    expect(next.map((recap) => recap.key)).toEqual([
      'a',
      'b',
      FICTIONAL_TOURNAMENT_RECAP_KEY,
      FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY,
    ])
  })

  it('does not insert twice', () => {
    const once = insertFictionalTournamentRecap([stubRecap('a')])
    expect(insertFictionalTournamentRecap(once)).toEqual(once)
  })
})

describe('buildCondensedFictionalTournamentRecap', () => {
  it('is the same kitchen-sink recap under a condensed-cards name', () => {
    const expanded = buildFictionalTournamentRecap()
    const condensed = buildCondensedFictionalTournamentRecap()

    expect(condensed.key).toBe(FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY)
    expect(condensed.competitionName).toBe(FICTIONAL_CONDENSED_TOURNAMENT_NAME)
    expect(condensed.celebrations).toEqual(expanded.celebrations)
    expect(condensed.eventSummaries).toEqual(expanded.eventSummaries)
    expect(condensed.recordMilestones).toEqual(expanded.recordMilestones)
    expect(condensed.freakFlags.map((flag) => flag.kind)).toEqual(
      expanded.freakFlags.map((flag) => flag.kind),
    )
    expect(condensed.disciplines.map((d) => d.discipline)).toEqual(
      expanded.disciplines.map((d) => d.discipline),
    )
    expect(condensed.weekendWinPercent).toBe(expanded.weekendWinPercent)
  })
})

describe('fictionalCelebrationPresentation', () => {
  it('marks the fifth recap expanded and the sixth compact', () => {
    expect(fictionalCelebrationPresentation(FICTIONAL_TOURNAMENT_RECAP_KEY)).toBe('expanded')
    expect(fictionalCelebrationPresentation(FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY)).toBe(
      'compact',
    )
    expect(fictionalCelebrationPresentation('real-weekend')).toBeNull()
  })
})
