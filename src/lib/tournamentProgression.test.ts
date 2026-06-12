import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestStageFromMatches,
  buildCategoryCompletionMilestones,
  categoryCompletionAgeKey,
  computeTournamentProgression,
  formatCategoryAgeLabel,
  groupCategoryCompletionsByAge,
  pickDefaultVisibleAgeLabels,
  isSemiFinalRound,
  KNOCKOUT_OR_BETTER_MIN_RANK,
  isBronzeFinalRound,
  lostInSemiFinal,
  wonBronzeFinal,
  medianRank,
  mergeKnockoutCountsForProgressionUI,
  parseRoundToStage,
  percentAtOrBeyondRank,
  progressionBarDisplayWidths,
  progressionDepthBarStageWeight,
  PROGRESSION_UI_STAGE_ORDER,
  progressionBarMarkerPercentFromTypicalRank,
  progressionBarMarkerRankForUI,
  progressionBarMobileLabel,
  progressionDepthBarSegments,
  progressionDistributionBar,
  progressionStageMarkerT,
  qualifiesForThirdPlace,
  PROGRESSION_STAGE_ORDER,
  STAGE_RANK,
  type CategoryCompletionRow,
  type ProgressionDistributionRow,
  type ProgressionStage,
  type TournamentEntry,
} from './tournamentProgression'

function completionEntry(
  bestStageRank: number,
  overrides: Partial<TournamentEntry> = {},
): TournamentEntry {
  const bestStage = (PROGRESSION_STAGE_ORDER[bestStageRank - 1] ??
    'group-stages') as ProgressionStage

  return {
    key: 'test-event',
    competitionName: 'Test Open',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    tournamentCategoryLabel: 'Bronze',
    competitionAgeLabel: 'U15',
    eventDate: '2025-10-15',
    latestDate: '2025-10-15',
    partnerName: 'Sam',
    bestStage,
    bestStageRank,
    matchCount: 1,
    ...overrides,
  }
}

function completionRow(overrides: Partial<CategoryCompletionRow>): CategoryCompletionRow {
  const bestStageRank = overrides.bestStageRank ?? 2
  return {
    label: 'U15 Bronze',
    tournamentCategoryLabel: 'Bronze',
    competitionAgeLabel: 'U15',
    tournamentCount: 1,
    bestStageRank,
    milestones: buildCategoryCompletionMilestones([completionEntry(bestStageRank)]),
    ...overrides,
  }
}

function makeProgressionMatch(
  overrides: Partial<NormalizedMatch> & {
    round: string
    outcome?: 'win' | 'loss'
  },
): NormalizedMatch {
  const { round, outcome = 'win', ...rest } = overrides
  return {
    competitionName: 'Test Open',
    tournamentCategory: 'bronze',
    tournamentCategoryLabel: 'Bronze',
    date: '2025-10-15',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    playerName: 'Alex',
    partnerName: 'Sam',
    opponents: 'Opp A & Opp B',
    outcome,
    nonCompetitiveReason: null,
    scoreSummary: '21-18, 21-17',
    playerRating: 600,
    competitionAgeGroup: 'Junior',
    competitionSubAgeGroup: 'U15',
    raw: { Round: round, 'Tournament Category': 'bronze' },
    ...rest,
  }
}

describe('parseRoundToStage', () => {
  it('maps early bracket rounds to knockout', () => {
    expect(parseRoundToStage('R32')).toBe('knockout')
    expect(parseRoundToStage('Round of 16')).toBe('knockout')
    expect(parseRoundToStage('KO')).toBe('knockout')
  })

  it('maps group-style round labels to group-stages', () => {
    expect(parseRoundToStage('Group A')).toBe('group-stages')
    expect(parseRoundToStage('Groups')).toBe('group-stages')
    expect(parseRoundToStage('Group stage')).toBe('group-stages')
  })
})

describe('isSemiFinalRound', () => {
  it('matches semi-final round labels', () => {
    expect(isSemiFinalRound('Semi-final')).toBe(true)
    expect(isSemiFinalRound('SF')).toBe(true)
    expect(isSemiFinalRound('Last 4')).toBe(true)
  })

  it('does not match bronze or silver placement finals', () => {
    expect(isSemiFinalRound('Bronze Final')).toBe(false)
    expect(isSemiFinalRound('Silver Final')).toBe(false)
  })
})

describe('lostInSemiFinal', () => {
  it('returns true when a competitive semi-final match was lost', () => {
    const match = {
      outcome: 'loss',
      nonCompetitiveReason: null,
      raw: { Round: 'Semi-final' },
    } as unknown as Parameters<typeof lostInSemiFinal>[0][number]

    expect(lostInSemiFinal([match])).toBe(true)
  })

  it('returns false for bronze final loss', () => {
    const match = {
      outcome: 'loss',
      nonCompetitiveReason: null,
      raw: { Round: 'Bronze Final' },
    } as unknown as Parameters<typeof lostInSemiFinal>[0][number]

    expect(lostInSemiFinal([match])).toBe(false)
  })
})

describe('wonBronzeFinal', () => {
  it('returns true when the bronze final was won', () => {
    const match = {
      outcome: 'win',
      nonCompetitiveReason: null,
      raw: { Round: 'Bronze Final' },
    } as unknown as Parameters<typeof wonBronzeFinal>[0][number]

    expect(isBronzeFinalRound('Bronze Final')).toBe(true)
    expect(wonBronzeFinal([match])).toBe(true)
  })

  it('returns false for bronze final loss', () => {
    const match = {
      outcome: 'loss',
      nonCompetitiveReason: null,
      raw: { Round: 'Bronze Final' },
    } as unknown as Parameters<typeof wonBronzeFinal>[0][number]

    expect(wonBronzeFinal([match])).toBe(false)
  })
})

describe('tournament format rules', () => {
  it('caps sole quarter-final loss without a group phase to group depth', () => {
    const matches = [
      makeProgressionMatch({ round: 'Quarter-final', outcome: 'loss' }),
    ]
    expect(bestStageFromMatches(matches)).toBe('group-stages')
  })

  it('credits quarter-final when the only knockout match is won', () => {
    const matches = [
      makeProgressionMatch({ round: 'Quarter-final', outcome: 'win' }),
    ]
    expect(bestStageFromMatches(matches)).toBe('quarter-final')
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK[bestStageFromMatches(matches)!]),
    ])
    expect(milestones.find((m) => m.label === 'QF')?.achieved).toBe(true)
  })

  it('credits semi-final after a box win even when quarter-finals were skipped', () => {
    const matches = [
      makeProgressionMatch({ round: 'Group A', outcome: 'win' }),
      makeProgressionMatch({ round: 'Semi-final', outcome: 'loss' }),
    ]
    expect(bestStageFromMatches(matches)).toBe('semi-final')
  })

  it('credits knockout after a box win and early knockout loss', () => {
    const matches = [
      makeProgressionMatch({ round: 'Group 1', outcome: 'win' }),
      makeProgressionMatch({ round: 'R16', outcome: 'loss' }),
    ]
    expect(bestStageFromMatches(matches)).toBe('knockout')
  })

  it('promotes a 3-team round-robin champion to winner', () => {
    const matches = [
      makeProgressionMatch({
        round: 'Group A',
        outcome: 'win',
        opponents: 'Team B',
      }),
      makeProgressionMatch({
        round: 'Group A',
        outcome: 'win',
        opponents: 'Team C',
        date: '2025-10-16',
      }),
    ]
    expect(bestStageFromMatches(matches)).toBe('winner')
  })

  it('keeps a partial 3-team round robin at group wins', () => {
    const matches = [
      makeProgressionMatch({
        round: 'Group A',
        outcome: 'win',
        opponents: 'Team B',
      }),
      makeProgressionMatch({
        round: 'Group A',
        outcome: 'loss',
        opponents: 'Team C',
        date: '2025-10-16',
      }),
    ]
    expect(bestStageFromMatches(matches)).toBe('group-wins')
    expect(qualifiesForThirdPlace(matches, 'semi-final')).toBe(false)
  })

  it('does not award third place on semi-final loss without a competitive win', () => {
    const matches = [
      makeProgressionMatch({ round: 'Semi-final', outcome: 'loss' }),
    ]
    expect(qualifiesForThirdPlace(matches, 'semi-final')).toBe(false)
  })

  it('does not award third place when the only win was a walkover', () => {
    const walkoverWin = makeProgressionMatch({
      round: 'Group A',
      outcome: 'win',
      nonCompetitiveReason: 'walkover',
      scoreSummary: 'Walkover win',
      opponents: 'Team B',
    })
    const bronzeWin = makeProgressionMatch({
      round: 'Bronze Final',
      outcome: 'win',
      opponents: 'Team C',
      date: '2025-10-16',
    })
    const matches = [walkoverWin, bronzeWin]
    expect(qualifiesForThirdPlace(matches, 'semi-final')).toBe(false)
  })

  it('awards third place on bronze final win after a competitive win', () => {
    const matches = [
      makeProgressionMatch({ round: 'Quarter-final', outcome: 'win' }),
      makeProgressionMatch({
        round: 'Bronze Final',
        outcome: 'win',
        date: '2025-10-16',
      }),
    ]
    expect(qualifiesForThirdPlace(matches, 'semi-final')).toBe(true)
  })
})

describe('mergeKnockoutCountsForProgressionUI', () => {
  it('adds knockout counts to quarter-final for the progression UI only', () => {
    const counts = new Map([
      ['knockout', 2],
      ['quarter-final', 1],
      ['group-wins', 3],
    ] as const)
    const merged = mergeKnockoutCountsForProgressionUI(counts)
    expect(merged.get('quarter-final')).toBe(3)
    expect(merged.has('knockout')).toBe(false)
  })
})

describe('percentAtOrBeyondRank', () => {
  it('returns 0 for an empty list', () => {
    expect(percentAtOrBeyondRank([], KNOCKOUT_OR_BETTER_MIN_RANK)).toBe(0)
  })

  it('counts tournaments at or beyond knockout', () => {
    const entries = [
      { bestStageRank: STAGE_RANK['group-wins'] },
      { bestStageRank: STAGE_RANK['knockout'] },
      { bestStageRank: STAGE_RANK['quarter-final'] },
      { bestStageRank: STAGE_RANK['group-stages'] },
    ]
    expect(percentAtOrBeyondRank(entries, KNOCKOUT_OR_BETTER_MIN_RANK)).toBe(50)
  })
})

describe('progressionDepthBarSegments', () => {
  it('returns the UI ladder without a knockout slice', () => {
    const counts = new Map([
      ['knockout', 2],
      ['group-wins', 4],
    ] as const)
    const bar = progressionDepthBarSegments(counts, 6)
    expect(bar).toHaveLength(PROGRESSION_UI_STAGE_ORDER.length)
    expect(bar.map((row) => row.stage)).not.toContain('knockout')
    expect(bar.find((row) => row.stage === 'quarter-final')?.count).toBe(2)
    expect(bar.find((row) => row.stage === 'group-wins')?.percent).toBe(67)
  })
})

describe('progressionDistributionBar', () => {
  it('returns only non-zero UI stages, deepest first, with knockout merged into QF', () => {
    const counts = new Map([
      ['knockout', 2],
      ['group-wins', 4],
    ] as const)
    const bar = progressionDistributionBar(counts, 6)
    expect(bar.map((row) => row.stage)).toEqual(['quarter-final', 'group-wins'])
    expect(bar[0]?.count).toBe(2)
    expect(bar[1]?.percent).toBe(67)
  })
})

describe('progressionBarMarkerRankForUI', () => {
  it('maps knockout median onto the quarter-final segment', () => {
    expect(progressionBarMarkerRankForUI(STAGE_RANK['knockout'])).toBe(
      STAGE_RANK['quarter-final'],
    )
    expect(progressionBarMarkerRankForUI(STAGE_RANK['group-wins'])).toBe(
      STAGE_RANK['group-wins'],
    )
  })
})

function row(
  stage: ProgressionDistributionRow['stage'],
  percent: number,
  count = percent,
): ProgressionDistributionRow {
  return {
    stage,
    label: stage,
    shortLabel: stage,
    count,
    percent,
  }
}

describe('progressionDepthBarStageWeight', () => {
  it('pairs group stages and podium stages, halving between steps', () => {
    expect(progressionDepthBarStageWeight('group-stages')).toBe(
      progressionDepthBarStageWeight('group-wins'),
    )
    expect(progressionDepthBarStageWeight('runner-up')).toBe(
      progressionDepthBarStageWeight('winner'),
    )
    expect(progressionDepthBarStageWeight('quarter-final')).toBe(
      progressionDepthBarStageWeight('group-stages') / 2,
    )
    expect(progressionDepthBarStageWeight('semi-final')).toBe(
      progressionDepthBarStageWeight('quarter-final') / 2,
    )
  })
})

describe('progressionBarDisplayWidths', () => {
  it('uses a fixed halving ladder on the full UI scale', () => {
    const segments = PROGRESSION_UI_STAGE_ORDER.map((stage) => row(stage, 0, 0))
    const widths = progressionBarDisplayWidths(segments)
    expect(widths[0]).toBeCloseTo(widths[1]!, 5)
    expect(widths[4]).toBeCloseTo(widths[5]!, 5)
    expect(widths[0]!).toBeGreaterThan(widths[2]!)
    expect(widths[2]!).toBeGreaterThan(widths[3]!)
    expect(widths[3]!).toBeGreaterThan(widths[4]!)
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(100, 5)
  })

  it('does not shrink podium slices below the readable minimum', () => {
    const segments = PROGRESSION_UI_STAGE_ORDER.map((stage) => row(stage, 0, 0))
    const widths = progressionBarDisplayWidths(segments)
    expect(widths[4]!).toBeGreaterThanOrEqual(7)
    expect(widths[5]!).toBeGreaterThanOrEqual(7)
  })
})

describe('progressionBarMobileLabel', () => {
  it('uses Match wins when the slice is wide enough', () => {
    expect(progressionBarMobileLabel('group-wins', 12)).toBe('Match wins')
    expect(progressionBarMobileLabel('group-wins', 8)).toBe('Grp MW')
  })

  it('uses W for winner on the bar scale', () => {
    expect(progressionBarMobileLabel('winner', 8)).toBe('W')
  })
})

describe('progressionStageMarkerT', () => {
  it('anchors group exit left, middle stages centre, and winner right', () => {
    expect(progressionStageMarkerT(1)).toBe(0)
    expect(progressionStageMarkerT(2)).toBe(0.5)
    expect(progressionStageMarkerT(6)).toBe(0.5)
    expect(progressionStageMarkerT(7)).toBe(1)
  })
})

describe('progressionBarMarkerPercentFromTypicalRank', () => {
  it('places the marker on the left of the group segment when depth is always group exit', () => {
    const segments = [row('group-stages', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(1, segments, widths)).toBe(0)
  })

  it('places the marker in the centre of the match-wins segment', () => {
    const segments = [row('group-wins', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(2, segments, widths)).toBe(50)
  })

  it('places the marker on the right edge when depth is always winner', () => {
    const segments = [row('winner', 100)]
    const widths = progressionBarDisplayWidths(segments)
    expect(progressionBarMarkerPercentFromTypicalRank(7, segments, widths)).toBe(100)
  })

  it('centres the marker in the quarter-final segment on a six-step ladder', () => {
    const segments = [
      row('group-stages', 0, 0),
      row('group-wins', 0, 0),
      row('quarter-final', 100, 3),
      row('semi-final', 0, 0),
      row('runner-up', 0, 0),
      row('winner', 0, 0),
    ]
    const widths = progressionBarDisplayWidths(segments)
    const qfIndex = 2
    const qfStart = widths.slice(0, qfIndex).reduce((sum, width) => sum + width, 0)
    const qfCenter = qfStart + (widths[qfIndex] ?? 0) / 2
    expect(progressionBarMarkerPercentFromTypicalRank(4, segments, widths)).toBeCloseTo(
      qfCenter,
      1,
    )
  })
})

describe('medianRank', () => {
  it('returns the middle value for odd-length lists', () => {
    expect(medianRank([1, 3, 7])).toBe(3)
  })

  it('averages the two central values for even-length lists', () => {
    expect(medianRank([1, 2, 3, 4])).toBe(2.5)
  })
})

describe('formatCategoryAgeLabel', () => {
  it('puts age before level when age is present', () => {
    expect(formatCategoryAgeLabel('Bronze', 'U15')).toBe('U15 Bronze')
  })

  it('falls back to level only when age is missing', () => {
    expect(formatCategoryAgeLabel('Gold', null)).toBe('Gold')
  })
})

describe('buildCategoryCompletionMilestones', () => {
  it('marks cumulative milestones up to the best stage rank', () => {
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK['runner-up']),
    ])
    expect(milestones.map((m) => [m.label, m.achieved])).toEqual([
      ['Grp', true],
      ['GW', true],
      ['QF', true],
      ['SF', true],
      ['RU', true],
      ['W', false],
    ])
  })

  it('marks group participation even when there were no group match wins', () => {
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK['group-stages']),
    ])
    expect(milestones.find((m) => m.label === 'Grp')?.achieved).toBe(true)
    expect(milestones.find((m) => m.label === 'GW')?.achieved).toBe(false)
    expect(milestones.some((m) => m.achieved)).toBe(true)
  })

  it('does not mark QF when best finish is early knockout', () => {
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK.knockout),
    ])
    expect(milestones.find((m) => m.label === 'QF')?.achieved).toBe(false)
    expect(milestones.find((m) => m.label === 'Grp')?.achieved).toBe(true)
    expect(milestones.find((m) => m.label === 'GW')?.achieved).toBe(true)
  })

  it('marks winner when the event was won', () => {
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK.winner),
    ])
    expect(milestones.every((m) => m.achieved)).toBe(true)
  })

  it('records the earliest tournament where each milestone was first reached', () => {
    const milestones = buildCategoryCompletionMilestones([
      completionEntry(STAGE_RANK['quarter-final'], {
        key: 'later-qf',
        competitionName: 'Later Open',
        eventDate: '2025-11-01',
      }),
      completionEntry(STAGE_RANK['semi-final'], {
        key: 'first-sf',
        competitionName: 'First Semi Event',
        eventDate: '2024-06-01',
        partnerName: 'Alex',
      }),
    ])

    expect(milestones.find((m) => m.label === 'QF')?.firstAchievement).toEqual({
      competitionName: 'First Semi Event',
      date: '2024-06-01',
      partnerName: 'Alex',
    })
    expect(milestones.find((m) => m.label === 'SF')?.firstAchievement?.competitionName).toBe(
      'First Semi Event',
    )
    expect(milestones.find((m) => m.label === 'RU')?.firstAchievement).toBeNull()
  })
})

describe('computeTournamentProgression category combos', () => {
  it('scopes primary combo median to the most-played level and age', () => {
    const matches = [
      makeProgressionMatch({
        competitionName: 'Bronze A',
        round: 'Group A',
        outcome: 'win',
      }),
      makeProgressionMatch({
        competitionName: 'Bronze B',
        round: 'Group A',
        outcome: 'win',
        date: '2025-11-01',
      }),
      makeProgressionMatch({
        competitionName: 'Bronze C',
        round: 'Quarter-final',
        outcome: 'loss',
        date: '2025-11-02',
      }),
      makeProgressionMatch({
        competitionName: 'Gold Event',
        round: 'Final',
        outcome: 'win',
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        raw: { Round: 'Final', 'Tournament Category': 'gold' },
      }),
    ]

    const stats = computeTournamentProgression(matches)

    expect(stats.primaryCombo?.label).toBe('U15 Bronze')
    expect(stats.primaryCombo?.tournamentCount).toBe(3)
    expect(stats.primaryCombo?.typicalLabel).toBe('Group match wins')
    expect(stats.typicalLabel).toBe('Group match wins')
  })

  it('breaks primary combo ties by most recent tournament date', () => {
    const matches = [
      makeProgressionMatch({
        competitionName: 'Bronze Old',
        round: 'Group A',
        outcome: 'win',
        date: '2024-01-01',
      }),
      makeProgressionMatch({
        competitionName: 'Gold Recent A',
        round: 'Group A',
        outcome: 'win',
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        date: '2025-12-01',
        raw: { Round: 'Group A', 'Tournament Category': 'gold' },
      }),
      makeProgressionMatch({
        competitionName: 'Gold Recent B',
        round: 'Group A',
        outcome: 'win',
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        date: '2025-11-01',
        raw: { Round: 'Group A', 'Tournament Category': 'gold' },
      }),
    ]

    const stats = computeTournamentProgression(matches)
    expect(stats.primaryCombo?.label).toBe('U15 Gold')
  })

  it('builds completion rows for every level and age combo', () => {
    const matches = [
      makeProgressionMatch({
        competitionName: 'Bronze Event',
        round: 'Semi-final',
        outcome: 'loss',
      }),
      makeProgressionMatch({
        competitionName: 'Bronze Event 2',
        round: 'Final',
        outcome: 'loss',
        date: '2025-11-02',
      }),
      makeProgressionMatch({
        competitionName: 'Gold Event',
        round: 'Quarter-final',
        outcome: 'loss',
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        raw: { Round: 'Quarter-final', 'Tournament Category': 'gold' },
      }),
    ]

    const stats = computeTournamentProgression(matches)
    expect(stats.categoryCompletions.map((row) => row.label)).toEqual([
      'U15 Bronze',
      'U15 Gold',
    ])

    const bronze = stats.categoryCompletions.find((row) => row.label === 'U15 Bronze')!
    expect(bronze.tournamentCount).toBe(2)
    expect(bronze.milestones.find((m) => m.label === 'RU')?.achieved).toBe(true)
    expect(bronze.milestones.find((m) => m.label === 'W')?.achieved).toBe(false)

    const gold = stats.categoryCompletions.find((row) => row.label === 'U15 Gold')!
    expect(gold.milestones.find((m) => m.label === 'SF')?.achieved).toBe(false)
    expect(gold.milestones.find((m) => m.label === 'QF')?.achieved).toBe(false)
  })

  it('sorts completion rows oldest age first, then copper through other', () => {
    const matches = [
      makeProgressionMatch({
        competitionName: 'Senior Gold',
        round: 'Group A',
        outcome: 'win',
        competitionAgeGroup: 'Senior',
        competitionSubAgeGroup: 'Senior',
        tournamentCategory: 'gold',
        tournamentCategoryLabel: 'Gold',
        raw: { Round: 'Group A', 'Tournament Category': 'gold' },
      }),
      makeProgressionMatch({
        competitionName: 'Senior Bronze',
        round: 'Group A',
        outcome: 'win',
        competitionAgeGroup: 'Senior',
        competitionSubAgeGroup: 'Senior',
      }),
      makeProgressionMatch({
        competitionName: 'Senior Copper',
        round: 'Group A',
        outcome: 'win',
        competitionAgeGroup: 'Senior',
        competitionSubAgeGroup: 'Senior',
        tournamentCategory: 'copper',
        tournamentCategoryLabel: 'Copper',
        raw: { Round: 'Group A', 'Tournament Category': 'copper' },
      }),
      makeProgressionMatch({
        competitionName: 'Senior Silver',
        round: 'Group A',
        outcome: 'win',
        competitionAgeGroup: 'Senior',
        competitionSubAgeGroup: 'Senior',
        tournamentCategory: 'silver',
        tournamentCategoryLabel: 'Silver',
        raw: { Round: 'Group A', 'Tournament Category': 'silver' },
      }),
      makeProgressionMatch({
        competitionName: 'Senior Other',
        round: 'Group A',
        outcome: 'win',
        competitionAgeGroup: 'Senior',
        competitionSubAgeGroup: 'Senior',
        tournamentCategory: 'other',
        tournamentCategoryLabel: 'Other',
        raw: { Round: 'Group A', 'Tournament Category': 'other' },
      }),
      makeProgressionMatch({
        competitionName: 'Junior Bronze',
        round: 'Group A',
        outcome: 'win',
        competitionSubAgeGroup: 'U15',
      }),
    ]

    const stats = computeTournamentProgression(matches)
    expect(stats.categoryCompletions.map((row) => row.label)).toEqual([
      'Senior Copper',
      'Senior Bronze',
      'Senior Silver',
      'Senior Gold',
      'Senior Other',
      'U15 Bronze',
    ])
  })

  it('aggregates best stage across disciplines at the same level and age', () => {
    const matches = [
      makeProgressionMatch({
        competitionName: 'Shared Event',
        discipline: 'WD',
        round: 'Group A',
        outcome: 'win',
      }),
      makeProgressionMatch({
        competitionName: 'Shared Event',
        discipline: 'WS',
        disciplineLabel: "Women's singles",
        partnerName: null,
        round: 'Final',
        outcome: 'win',
      }),
    ]

    const stats = computeTournamentProgression(matches)
    const row = stats.categoryCompletions.find((row) => row.label === 'U15 Bronze')!
    expect(row.tournamentCount).toBe(2)
    expect(row.milestones.find((m) => m.label === 'W')?.achieved).toBe(true)
  })
})

describe('groupCategoryCompletionsByAge', () => {
  it('preserves row order within each age group', () => {
    const rows = [
      completionRow({ label: 'O50 Gold', competitionAgeLabel: 'O50', tournamentCategoryLabel: 'Gold' }),
      completionRow({ label: 'O50 Other', competitionAgeLabel: 'O50', tournamentCategoryLabel: 'Other' }),
      completionRow({ label: 'O45 Bronze', competitionAgeLabel: 'O45', tournamentCategoryLabel: 'Bronze' }),
    ]

    const groups = groupCategoryCompletionsByAge(rows)
    expect(groups.map((group) => group.ageLabel)).toEqual(['O50', 'O45'])
    expect(groups[0]?.rows.map((row) => row.label)).toEqual(['O50 Gold', 'O50 Other'])
    expect(groups[1]?.rows.map((row) => row.label)).toEqual(['O45 Bronze'])
  })
})

describe('pickDefaultVisibleAgeLabels', () => {
  it('shows the top two age groups when Senior is not present', () => {
    const ageGroups = groupCategoryCompletionsByAge([
      completionRow({ label: 'O50 Gold', competitionAgeLabel: 'O50', tournamentCategoryLabel: 'Gold' }),
      completionRow({ label: 'O45 Bronze', competitionAgeLabel: 'O45', tournamentCategoryLabel: 'Bronze' }),
      completionRow({ label: 'O40 Silver', competitionAgeLabel: 'O40', tournamentCategoryLabel: 'Silver' }),
    ])

    expect(pickDefaultVisibleAgeLabels(ageGroups)).toEqual(['O50', 'O45'])
  })

  it('prioritises Senior and then the next oldest age group', () => {
    const ageGroups = groupCategoryCompletionsByAge([
      completionRow({ label: 'O50 Gold', competitionAgeLabel: 'O50', tournamentCategoryLabel: 'Gold' }),
      completionRow({ label: 'Senior Bronze', competitionAgeLabel: 'Senior', tournamentCategoryLabel: 'Bronze' }),
      completionRow({ label: 'O45 Other', competitionAgeLabel: 'O45', tournamentCategoryLabel: 'Other' }),
      completionRow({ label: 'U15 Bronze', competitionAgeLabel: 'U15', tournamentCategoryLabel: 'Bronze' }),
    ])

    expect(pickDefaultVisibleAgeLabels(ageGroups)).toEqual([
      categoryCompletionAgeKey('Senior'),
      'O50',
    ])
  })

  it('returns a single age group when only one exists', () => {
    const ageGroups = groupCategoryCompletionsByAge([
      completionRow({ label: 'Senior Gold', competitionAgeLabel: 'Senior', tournamentCategoryLabel: 'Gold' }),
    ])

    expect(pickDefaultVisibleAgeLabels(ageGroups)).toEqual([categoryCompletionAgeKey('Senior')])
  })

  it('leaves earlier age groups hidden until expanded', () => {
    const ageGroups = groupCategoryCompletionsByAge([
      completionRow({ label: 'O50 Gold', competitionAgeLabel: 'O50', tournamentCategoryLabel: 'Gold' }),
      completionRow({ label: 'O45 Bronze', competitionAgeLabel: 'O45', tournamentCategoryLabel: 'Bronze' }),
      completionRow({ label: 'O40 Silver', competitionAgeLabel: 'O40', tournamentCategoryLabel: 'Silver' }),
    ])

    const visible = new Set(pickDefaultVisibleAgeLabels(ageGroups))
    const hiddenCount = ageGroups.filter(
      (group) => !visible.has(categoryCompletionAgeKey(group.ageLabel)),
    ).length

    expect(hiddenCount).toBe(1)
  })
})
