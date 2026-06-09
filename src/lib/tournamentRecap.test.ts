import { describe, expect, it } from 'vitest'
import type { NormalizedMatch } from '../types/matchHistory'
import { computeTournamentRecaps, partnerChemistryDetail } from './tournamentRecap'

function makeMatch(
  overrides: Partial<NormalizedMatch> &
    Pick<NormalizedMatch, 'competitionName' | 'date' | 'discipline'>,
): NormalizedMatch {
  const { competitionName, date, discipline, ...rest } = overrides
  return {
    tournamentCategory: overrides.tournamentCategory ?? 'bronze',
    tournamentCategoryLabel: overrides.tournamentCategoryLabel ?? 'Bronze',
    disciplineLabel: discipline,
    playerName: 'Alex',
    partnerName: null,
    opponents: 'Opponent',
    outcome: 'win',
    nonCompetitiveReason: null,
    scoreSummary: '21-15, 21-12',
    playerRating: 570,
    raw: {
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Player Game 2 Score': 21,
      'Opponent Game 2 Score': 12,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
    },
    ...rest,
    competitionName,
    date,
    discipline,
  }
}

describe('computeTournamentRecaps', () => {
  it('groups by competition and sorts most recent first', () => {
    const matches = [
      makeMatch({ competitionName: 'Old Open', date: '2025-01-01', discipline: 'WS' }),
      makeMatch({ competitionName: 'Recent Cup', date: '2026-03-01', discipline: 'WD', partnerName: 'Sam' }),
      makeMatch({ competitionName: 'Recent Cup', date: '2026-03-02', discipline: 'XD', partnerName: 'Sam' }),
    ]

    const { recaps } = computeTournamentRecaps(matches)
    expect(recaps).toHaveLength(2)
    expect(recaps[0]!.competitionName).toBe('Recent Cup')
    expect(recaps[0]!.disciplines).toHaveLength(2)
    expect(recaps[1]!.competitionName).toBe('Old Open')
  })

  it('computes rating delta from first to last match per discipline', () => {
    const matches = [
      makeMatch({
        competitionName: 'Test Event',
        date: '2026-01-01',
        discipline: 'WS',
        playerRating: 560,
      }),
      makeMatch({
        competitionName: 'Test Event',
        date: '2026-01-02',
        discipline: 'WS',
        playerRating: 575,
        outcome: 'loss',
      }),
    ]

    const ws = computeTournamentRecaps(matches).recaps[0]!.disciplines[0]!
    expect(ws.ratingStart).toBe(560)
    expect(ws.ratingEnd).toBe(575)
    expect(ws.ratingDelta).toBe(15)
  })

  it('detects nailbiter freak flag', () => {
    const matches = [
      makeMatch({
        competitionName: 'Thriller',
        date: '2026-02-01',
        discipline: 'WS',
        scoreSummary: '21-19, 19-21, 22-20',
        raw: {
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 19,
          'Player Game 2 Score': 19,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': 22,
          'Opponent Game 3 Score': 20,
        },
      }),
    ]

    const flags = computeTournamentRecaps(matches).recaps[0]!.freakFlags
    const nailbiter = flags.find((f) => f.kind === 'nailbiter')!
    expect(nailbiter.match?.scoreSummary).toContain('22')
    expect(nailbiter.match?.opponents).toBeTruthy()
  })

  it('detects single-digit scare on a win', () => {
    const matches = [
      makeMatch({
        competitionName: 'Scare',
        date: '2026-02-01',
        discipline: 'WS',
        outcome: 'win',
        raw: {
          'Player Game 1 Score': 8,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 14,
          'Player Game 3 Score': 21,
          'Opponent Game 3 Score': 18,
        },
      }),
    ]

    const flags = computeTournamentRecaps(matches).recaps[0]!.freakFlags
    const scare = flags.find((f) => f.kind === 'single_digit_scare')!
    expect(scare.summary).toBeUndefined()
    const lostGame = scare.match?.games?.find((g) => g.highlight === 'lost_single_digit')
    expect(lostGame).toEqual({ player: 8, opponent: 21, highlight: 'lost_single_digit' })
  })

  it('shows busy tournament only at 7+ competitive matches', () => {
    const row = {
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 15,
      'Player Game 2 Score': 21,
      'Opponent Game 2 Score': 12,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
    }
    const few = Array.from({ length: 4 }, (_, i) =>
      makeMatch({
        competitionName: 'Small',
        date: `2026-01-0${i + 1}`,
        discipline: 'WS',
        raw: row,
      }),
    )
    const many = Array.from({ length: 7 }, (_, i) =>
      makeMatch({
        competitionName: 'Big',
        date: `2026-02-0${(i % 9) + 1}`,
        discipline: 'WS',
        raw: row,
      }),
    )

    expect(
      computeTournamentRecaps(few).recaps[0]!.emojiInsights.some((i) =>
        i.title.includes('Busy'),
      ),
    ).toBe(false)
    expect(
      computeTournamentRecaps(many).recaps[0]!.emojiInsights.some((i) =>
        i.title.includes('Busy'),
      ),
    ).toBe(true)
  })

  it('uses nth win subtitle instead of personal best milestone for winners', () => {
    const winFinal = (comp: string, date: string) =>
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WD',
        tournamentCategoryLabel: 'Gold',
        outcome: 'win',
        raw: {
          Round: 'Final',
          'Tournament Category': 'Gold',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 10,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      })

    const recap = computeTournamentRecaps([
      winFinal('Earlier Gold', '2025-01-01'),
      winFinal('Later Gold', '2026-05-01'),
    ]).recaps.find((r) => r.competitionName === 'Later Gold')!

    expect(recap.celebrations.winners[0]!.subtitle).toBe('Your 2nd Gold title')
    expect(
      recap.celebrations.milestones.some((m) => m.variant === 'personal_best'),
    ).toBe(false)
  })

  it('names first title in discipline when category title already won elsewhere', () => {
    const winFinal = (comp: string, date: string, discipline: string) =>
      makeMatch({
        competitionName: comp,
        date,
        discipline,
        disciplineLabel: discipline === 'WD' ? "Women's Doubles" : "Men's Doubles",
        tournamentCategoryLabel: 'Copper',
        outcome: 'win',
        partnerName: discipline === 'WD' ? 'Sam' : 'Pat',
        raw: {
          Round: 'Final',
          'Tournament Category': 'Copper',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 10,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      })

    const recap = computeTournamentRecaps([
      winFinal('Earlier Copper', '2025-01-01', 'MD'),
      winFinal('Later Copper', '2026-05-01', 'WD'),
    ]).recaps.find((r) => r.competitionName === 'Later Copper')!

    expect(recap.celebrations.winners[0]!.subtitle).toBe(
      "Your first Copper Women's Doubles title",
    )
  })

  it('shows matched your best when depth ties prior non-podium run', () => {
    const qfWeekend = (comp: string, date: string) => [
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'loss',
        raw: {
          Round: 'QF',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const recap = computeTournamentRecaps([
      ...qfWeekend('Earlier', '2025-06-01'),
      ...qfWeekend('Again', '2026-06-01'),
    ]).recaps.find((r) => r.competitionName === 'Again')!

    expect(
      recap.celebrations.milestones.some((m) => m.variant === 'matched_best'),
    ).toBe(true)
    expect(
      recap.celebrations.milestones.some((m) => m.variant === 'personal_best'),
    ).toBe(false)
  })

  it('does not show matched your best when still in the box', () => {
    const groupOnly = (comp: string, date: string) =>
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      })

    const recap = computeTournamentRecaps([
      groupOnly('Earlier', '2025-06-01'),
      groupOnly('Again', '2026-06-01'),
    ]).recaps.find((r) => r.competitionName === 'Again')!

    expect(
      recap.celebrations.milestones.some((m) => m.variant === 'matched_best'),
    ).toBe(false)
  })

  it('does not duplicate freak flags in insights', () => {
    const threeGames = {
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 19,
      'Player Game 2 Score': 18,
      'Opponent Game 2 Score': 21,
      'Player Game 3 Score': 21,
      'Opponent Game 3 Score': 17,
    }
    const matches = [
      makeMatch({ competitionName: 'Long', date: '2026-01-01', discipline: 'WS', raw: threeGames }),
      makeMatch({ competitionName: 'Long', date: '2026-01-02', discipline: 'WD', raw: threeGames }),
    ]

    const recap = computeTournamentRecaps(matches).recaps[0]!
    expect(recap.freakFlags.some((f) => f.kind === 'money_worth')).toBe(true)
    expect(recap.emojiInsights.some((i) => i.title.includes("money's worth"))).toBe(
      false,
    )
  })

  it('detects all-three-games weekend flag', () => {
    const threeGames = {
      'Player Game 1 Score': 21,
      'Opponent Game 1 Score': 19,
      'Player Game 2 Score': 18,
      'Opponent Game 2 Score': 21,
      'Player Game 3 Score': 21,
      'Opponent Game 3 Score': 17,
    }
    const matches = [
      makeMatch({ competitionName: 'Long', date: '2026-01-01', discipline: 'WS', raw: threeGames }),
      makeMatch({ competitionName: 'Long', date: '2026-01-02', discipline: 'WD', partnerName: 'Sam', raw: threeGames }),
    ]

    const flags = computeTournamentRecaps(matches).recaps[0]!.freakFlags
    expect(flags.some((f) => f.kind === 'money_worth')).toBe(true)
  })

  it('skips partner chemistry for new partners', () => {
    const matches = [
      makeMatch({
        competitionName: 'New Partner Event',
        date: '2026-04-01',
        discipline: 'WD',
        partnerName: 'First Timer',
        outcome: 'win',
      }),
    ]

    const recap = computeTournamentRecaps(matches).recaps[0]!
    expect(recap.partnerChemistryHighlights).toHaveLength(0)
  })

  it('partner chemistry detail describes event score and overall improvement', () => {
    const prior = makeMatch({
      competitionName: 'Earlier',
      date: '2025-06-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'loss',
      playerRating: 550,
      raw: {
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
        'Opponent 1 Rating': 600,
        'Opponent 2 Rating': 590,
        'Partner Rating': 560,
      },
    })
    const weekend = makeMatch({
      competitionName: 'Weekend',
      date: '2026-04-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'win',
      playerRating: 580,
      raw: {
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 19,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 19,
        'Player Game 3 Score': 21,
        'Opponent Game 3 Score': 19,
        'Opponent 1 Rating': 520,
        'Opponent 2 Rating': 510,
        'Partner Rating': 575,
      },
    })

    const detail = computeTournamentRecaps([prior, weekend]).recaps.find(
      (r) => r.competitionName === 'Weekend',
    )!.partnerChemistryHighlights[0]!.detail

    expect(detail).toMatch(/Chemistry at this event:/)
    expect(detail).toMatch(/overall chemistry with Sam/)
    expect(detail).not.toMatch(/improved by 0%/)
    expect(detail).not.toContain('up from')
  })

  it('highlights chemistry when partner has prior history', () => {
    const prior = makeMatch({
      competitionName: 'Earlier',
      date: '2025-06-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'loss',
      playerRating: 550,
      raw: {
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
        'Opponent 1 Rating': 600,
        'Opponent 2 Rating': 590,
        'Partner Rating': 560,
      },
    })
    const weekend = makeMatch({
      competitionName: 'Weekend',
      date: '2026-04-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'win',
      playerRating: 580,
      raw: {
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 10,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 8,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
        'Opponent 1 Rating': 520,
        'Opponent 2 Rating': 510,
        'Partner Rating': 575,
      },
    })

    const recap = computeTournamentRecaps([prior, weekend]).recaps.find(
      (r) => r.competitionName === 'Weekend',
    )!
    expect(recap.partnerChemistryHighlights.length).toBeGreaterThan(0)
    expect(recap.partnerChemistryHighlights[0]!.partnerName).toBe('Sam')
  })

  it('partner chemistry avoids "improved by 0%" when overall barely moves', () => {
    const detail = partnerChemistryDetail('Martin Crossley', 3.2, 2.7, 2.7)

    expect(detail).not.toMatch(/improved by 0%/)
    expect(detail).toMatch(/stronger than your usual \+2\.7%/)
    expect(detail).toMatch(/Chemistry at this event: \+3\.2%/)
  })

  it('partner chemistry uses from/to when overall chemistry shifts', () => {
    const detail = partnerChemistryDetail('Sam', 8, -5, 2)

    expect(detail).toContain('improved from -5% to +2%')
    expect(detail).not.toContain('improved by')
  })

  it('skips partner chemistry when improved but event and overall scores stay negative', () => {
    const heavyLoss = {
      'Player Game 1 Score': 8,
      'Opponent Game 1 Score': 21,
      'Player Game 2 Score': 6,
      'Opponent Game 2 Score': 21,
      'Player Game 3 Score': null,
      'Opponent Game 3 Score': null,
      'Opponent 1 Rating': 650,
      'Opponent 2 Rating': 640,
      'Partner Rating': 560,
    }
    const mildLoss = {
      ...heavyLoss,
      'Player Game 1 Score': 18,
      'Opponent Game 1 Score': 21,
      'Player Game 2 Score': 17,
      'Opponent Game 2 Score': 21,
    }
    const prior = makeMatch({
      competitionName: 'Earlier',
      date: '2025-06-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'loss',
      playerRating: 550,
      raw: heavyLoss,
    })
    const weekend = makeMatch({
      competitionName: 'Weekend',
      date: '2026-04-01',
      discipline: 'WD',
      partnerName: 'Sam',
      outcome: 'loss',
      playerRating: 555,
      raw: mildLoss,
    })

    const recap = computeTournamentRecaps([prior, weekend]).recaps.find(
      (r) => r.competitionName === 'Weekend',
    )!
    expect(recap.partnerChemistryHighlights).toHaveLength(0)
    expect(recap.emojiInsights.some((i) => i.kind === 'partner_chemistry')).toBe(
      false,
    )
  })

  it('celebrates winners and runner-ups per discipline', () => {
    const winFinal = makeMatch({
      competitionName: 'Gold Open',
      date: '2026-05-10',
      discipline: 'XD',
      tournamentCategoryLabel: 'Gold',
      outcome: 'win',
      raw: {
        Round: 'Final',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 18,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 16,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const loseFinal = makeMatch({
      competitionName: 'Gold Open',
      date: '2026-05-10',
      discipline: 'WD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Gold',
      outcome: 'loss',
      raw: {
        Round: 'Final',
        'Tournament Category': 'Gold',
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 17,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const recap = computeTournamentRecaps([winFinal, loseFinal]).recaps[0]!
    expect(recap.celebrations.winners).toHaveLength(1)
    expect(recap.celebrations.winners[0]!.discipline).toBe('XD')
    expect(recap.celebrations.runnerUps).toHaveLength(1)
    expect(recap.celebrations.runnerUps[0]!.discipline).toBe('WD')
  })

  it('celebrates joint third on semi-final loss', () => {
    const semiLoss = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Semi-final',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([semiLoss]).recaps[0]!.celebrations
    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.jointThirds[0]!.kind).toBe('joint-third')
  })

  it('suppresses matched best when joint third covers repeat semi-final loss', () => {
    const semiLoss = (comp: string, date: string) =>
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'loss',
        raw: {
          Round: 'Semi-final',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      })

    const celebrations = computeTournamentRecaps([
      semiLoss('Earlier', '2025-06-01'),
      semiLoss('Again', '2026-06-01'),
    ]).recaps.find((r) => r.competitionName === 'Again')!.celebrations

    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.milestones.some((m) => m.variant === 'matched_best')).toBe(
      false,
    )
  })

  it('does not show joint third for bronze final loss', () => {
    const bronzeFinalLoss = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Bronze Final',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([bronzeFinalLoss]).recaps[0]!
      .celebrations
    expect(celebrations.jointThirds).toHaveLength(0)
  })

  it('shows podium stage reach for first quarter-final at category and discipline', () => {
    const priorGroup = makeMatch({
      competitionName: 'Earlier Silver',
      date: '2025-01-01',
      discipline: 'WS',
      disciplineLabel: "Women's singles",
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const qfWeekend = [
      makeMatch({
        competitionName: 'Silver Open',
        date: '2026-06-01',
        discipline: 'WS',
        disciplineLabel: "Women's singles",
        tournamentCategoryLabel: 'Silver',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Silver',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: 'Silver Open',
        date: '2026-06-01',
        discipline: 'WS',
        disciplineLabel: "Women's singles",
        tournamentCategoryLabel: 'Silver',
        outcome: 'loss',
        raw: {
          Round: 'QF',
          'Tournament Category': 'Silver',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const celebrations = computeTournamentRecaps([priorGroup, ...qfWeekend]).recaps.find(
      (r) => r.competitionName === 'Silver Open',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]).toMatchObject({
      stage: 'quarter-final',
      discipline: 'WS',
      tournamentCategoryLabel: 'Silver',
    })
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
  })

  it('scopes stage reach to category and discipline separately', () => {
    const priorBronzeQf = makeMatch({
      competitionName: 'Bronze earlier',
      date: '2025-01-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'QF',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const priorSilverGroup = makeMatch({
      competitionName: 'Silver earlier',
      date: '2025-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const silverQfWeekend = [
      makeMatch({
        competitionName: 'Silver Open',
        date: '2026-06-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Silver',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Silver',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: 'Silver Open',
        date: '2026-06-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Silver',
        outcome: 'loss',
        raw: {
          Round: 'QF',
          'Tournament Category': 'Silver',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const celebrations = computeTournamentRecaps([
      priorBronzeQf,
      priorSilverGroup,
      ...silverQfWeekend,
    ]).recaps.find((r) => r.competitionName === 'Silver Open')!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]!.tournamentCategoryLabel).toBe('Silver')
    expect(celebrations.milestones.some((m) => m.variant === 'debut')).toBe(false)
  })

  it('shows first knockout stage reach when exiting in the box for the first time', () => {
    const priorGroup = makeMatch({
      competitionName: 'Earlier Bronze',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const koWeekend = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'loss',
        raw: {
          Round: 'R16',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const celebrations = computeTournamentRecaps([priorGroup, ...koWeekend]).recaps.find(
      (r) => r.competitionName === 'Bronze Cup',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]!.stage).toBe('knockout')
  })

  it('shows stage reach instead of personal best when both apply at the same depth', () => {
    const priorKnockout = makeMatch({
      competitionName: 'Earlier Bronze',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'R16',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const qfWeekend = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Group 1',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'loss',
        raw: {
          Round: 'QF',
          'Tournament Category': 'Bronze',
          'Player Game 1 Score': 19,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 18,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const celebrations = computeTournamentRecaps([priorKnockout, ...qfWeekend]).recaps.find(
      (r) => r.competitionName === 'Bronze Cup',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]!.stage).toBe('quarter-final')
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
  })

  it('does not show first quarter-final when dropped straight into QF with no wins', () => {
    const priorGroup = makeMatch({
      competitionName: 'Earlier Silver',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const qfOnlyLoss = makeMatch({
      competitionName: 'Silver Open',
      date: '2026-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'QF',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorGroup, qfOnlyLoss]).recaps.find(
      (r) => r.competitionName === 'Silver Open',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(0)
  })

  it('shows first group win stage reach when not category debut', () => {
    const priorAllLosses = makeMatch({
      competitionName: 'Bronze earlier',
      date: '2025-01-01',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const firstGroupWin = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'win',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorAllLosses, firstGroupWin]).recaps.find(
      (r) => r.competitionName === 'Bronze Cup',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]).toMatchObject({
      stage: 'group-wins',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
    })
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
  })

  it('shows first group win stage reach when group round label is Groups', () => {
    const priorAllLosses = makeMatch({
      competitionName: 'Silver earlier',
      date: '2025-01-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Groups',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const firstGroupWin = makeMatch({
      competitionName: 'Silver Open',
      date: '2026-06-01',
      discipline: 'WS',
      tournamentCategoryLabel: 'Silver',
      outcome: 'win',
      raw: {
        Round: 'Groups',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorAllLosses, firstGroupWin]).recaps.find(
      (r) => r.competitionName === 'Silver Open',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]!.stage).toBe('group-wins')
  })

  it('does not celebrate quarter-final depth with zero wins at the event', () => {
    const priorGroupLoss = makeMatch({
      competitionName: 'Earlier Silver',
      date: '2025-01-01',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const qfOnlyLoss = makeMatch({
      competitionName: 'Silver Open',
      date: '2026-06-01',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'QF',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorGroupLoss, qfOnlyLoss]).recaps.find(
      (r) => r.competitionName === 'Silver Open',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(0)
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
  })

  it('scopes first group win to tournament category as well as discipline', () => {
    const priorBronzeWin = makeMatch({
      competitionName: 'Bronze earlier',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'win',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const priorSilverLoss = makeMatch({
      competitionName: 'Silver earlier',
      date: '2025-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Silver',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const silverGroupWin = makeMatch({
      competitionName: 'Silver Open',
      date: '2026-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Silver',
      outcome: 'win',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Silver',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([
      priorBronzeWin,
      priorSilverLoss,
      silverGroupWin,
    ]).recaps.find((r) => r.competitionName === 'Silver Open')!.celebrations

    expect(celebrations.stageReaches).toHaveLength(1)
    expect(celebrations.stageReaches[0]!.stage).toBe('group-wins')
    expect(celebrations.stageReaches[0]!.tournamentCategoryLabel).toBe('Silver')
  })

  it('does not show first group win for unrecognised round labels without a group win', () => {
    const priorAllLosses = makeMatch({
      competitionName: 'Bronze earlier',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const firstWin = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'win',
      raw: {
        Round: 'Phase 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorAllLosses, firstWin]).recaps.find(
      (r) => r.competitionName === 'Bronze Cup',
    )!.celebrations

    expect(celebrations.stageReaches).toHaveLength(0)
  })

  it('does not show first group win on category debut', () => {
    const firstWin = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'win',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([firstWin]).recaps[0]!.celebrations
    expect(celebrations.stageReaches).toHaveLength(0)
    expect(celebrations.milestones.some((m) => m.variant === 'debut')).toBe(true)
  })

  it('shows first tournament card at group stages instead of personal best', () => {
    const groupLosses = makeMatch({
      competitionName: 'Bronze Northants',
      date: '2024-07-06',
      discipline: 'XD',
      disciplineLabel: 'Mixed doubles',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Group 1',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const milestones = computeTournamentRecaps([groupLosses]).recaps[0]!
      .celebrations.milestones

    expect(milestones.some((m) => m.variant === 'personal_best')).toBe(false)
    const debut = milestones.find((m) => m.variant === 'debut')
    expect(debut?.title).toBe('First Bronze tournament')
    expect(debut?.detail).toBe('Mixed doubles')
    expect(debut?.detail).not.toContain('Group stages')
  })

  it('shows joint third card instead of debut on semi-final loss category debut', () => {
    const semiLoss = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Semi-final',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([semiLoss]).recaps[0]!.celebrations

    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.jointThirds[0]!.discipline).toBe('XD')
    expect(celebrations.jointThirds[0]!.subtitle).toBe(
      'Your first Bronze semi-final finish',
    )
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
    expect(celebrations.milestones.some((m) => m.variant === 'debut')).toBe(false)
  })

  it('does not show county debut when prior county matches exist in that discipline', () => {
    const priorCounty = makeMatch({
      competitionName: 'County League 2024',
      date: '2024-11-01',
      discipline: 'OD',
      disciplineLabel: 'Open doubles',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      outcome: 'loss',
      raw: {
        Round: 'Division 2',
        'Tournament Category': 'County',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const currentCounty = makeMatch({
      competitionName: 'Senior County Championships',
      date: '2025-11-08',
      discipline: 'OD',
      disciplineLabel: 'Open doubles',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      outcome: 'loss',
      raw: {
        Round: 'Division 1',
        'Tournament Category': 'County',
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 17,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const milestones = computeTournamentRecaps([priorCounty, currentCounty]).recaps.find(
      (r) => r.competitionName === 'Senior County Championships',
    )!.celebrations.milestones

    expect(milestones.some((m) => m.variant === 'debut')).toBe(false)
  })

  it('does not show first tournament debut card for Other category', () => {
    const otherEvent = makeMatch({
      competitionName: 'Club Night',
      date: '2026-01-01',
      discipline: 'WS',
      tournamentCategory: 'other',
      tournamentCategoryLabel: 'Other',
      outcome: 'loss',
      raw: {
        Round: 'Friendly',
        'Tournament Category': 'Other',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const milestones = computeTournamentRecaps([otherEvent]).recaps[0]!.celebrations
      .milestones

    expect(milestones.some((m) => m.variant === 'debut')).toBe(false)
  })

  it('does not show depth milestones when joint third covers semi-final exit on debut', () => {
    const semiLoss = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      partnerName: 'Sam',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Semi-final',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([semiLoss]).recaps[0]!.celebrations

    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.milestones.some((m) => m.variant === 'debut')).toBe(false)
    expect(celebrations.stageReaches).toHaveLength(0)
  })

  it('does not show stage reach when joint third covers semi-final exit', () => {
    const priorQf = makeMatch({
      competitionName: 'Earlier Bronze',
      date: '2025-01-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'QF',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const semiLoss = makeMatch({
      competitionName: 'Bronze Cup',
      date: '2026-06-01',
      discipline: 'XD',
      tournamentCategoryLabel: 'Bronze',
      outcome: 'loss',
      raw: {
        Round: 'Semi-final',
        'Tournament Category': 'Bronze',
        'Player Game 1 Score': 19,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 18,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const celebrations = computeTournamentRecaps([priorQf, semiLoss]).recaps.find(
      (r) => r.competitionName === 'Bronze Cup',
    )!.celebrations

    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.milestones.some((m) => m.variant === 'personal_best')).toBe(
      false,
    )
    expect(celebrations.stageReaches).toHaveLength(0)
  })

  it('surfaces all-time record milestones for best wins and nemeses', () => {
    const priorWins = [
      makeMatch({
        competitionName: 'Earlier',
        date: '2025-06-01',
        discipline: 'WS',
        opponents: 'Old Foe',
        outcome: 'win',
        playerRating: 550,
        raw: {
          'Opponent 1 Rating': 600,
          'Opponent 2 Rating': null,
          'Player Game 1 Score': 21,
          'Opponent Game 1 Score': 15,
          'Player Game 2 Score': 21,
          'Opponent Game 2 Score': 12,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]
    const weekendWin = makeMatch({
      competitionName: 'Record Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'New Giant',
      outcome: 'win',
      playerRating: 540,
      raw: {
        'Opponent 1 Rating': 650,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 19,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 18,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const recap = computeTournamentRecaps([...priorWins, weekendWin]).recaps.find(
      (r) => r.competitionName === 'Record Cup',
    )!

    const strength = recap.recordMilestones.find(
      (m) => m.kind === 'best_win_strength',
    )
    expect(strength?.title).toMatch(/strongest beaten/i)
    expect(strength?.title).toMatch(/1st all time/i)
    expect(strength?.detail).toMatch(/1st strongest beaten all time/)
    expect(strength?.detail).not.toContain('New Giant')
    expect(strength?.sectionId).toBe('best-wins')

    const ws = recap.disciplines.find((d) => d.discipline === 'WS')!
    const bestWinInsight = ws.disciplineInsights.find((i) => i.kind === 'best_win')
    expect(bestWinInsight?.detail).toContain('New Giant')
    expect(bestWinInsight?.detail).toMatch(/1st strongest beaten all time/)
  })

  it('omits negative rating comparison chips', () => {
    const matches = [
      makeMatch({
        competitionName: 'Bad Weekend',
        date: '2026-05-01',
        discipline: 'WS',
        playerRating: 600,
      }),
      makeMatch({
        competitionName: 'Bad Weekend',
        date: '2026-05-02',
        discipline: 'WS',
        playerRating: 580,
        outcome: 'loss',
      }),
      makeMatch({
        competitionName: 'Good Weekend',
        date: '2026-06-01',
        discipline: 'WS',
        playerRating: 570,
      }),
      makeMatch({
        competitionName: 'Good Weekend',
        date: '2026-06-02',
        discipline: 'WS',
        playerRating: 590,
      }),
    ]

    const bad = computeTournamentRecaps(matches).recaps.find(
      (r) => r.competitionName === 'Bad Weekend',
    )!
    const ws = bad.disciplines[0]!
    expect(ws.ratingDelta).toBe(-20)
    expect(ws.ratingVsTypical).toBeNull()
  })
})
