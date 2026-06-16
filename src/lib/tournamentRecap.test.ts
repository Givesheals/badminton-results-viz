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

  it('merges consecutive days in the same competition into one recap', () => {
    const matches = [
      makeMatch({
        competitionName: 'Senior County Championships',
        date: '2025-11-08',
        discipline: 'OD',
        partnerName: 'Sam',
        tournamentCategory: 'county',
        tournamentCategoryLabel: 'County',
      }),
      makeMatch({
        competitionName: 'Senior County Championships',
        date: '2025-11-09',
        discipline: 'WD',
        partnerName: 'Sam',
        tournamentCategory: 'county',
        tournamentCategoryLabel: 'County',
      }),
    ]

    const { recaps } = computeTournamentRecaps(matches)
    expect(recaps).toHaveLength(1)
    expect(recaps[0]!.competitionName).toBe('Senior County Championships')
    expect(recaps[0]!.dateFrom).toBe('2025-11-08')
    expect(recaps[0]!.dateTo).toBe('2025-11-09')
    expect(recaps[0]!.disciplines).toHaveLength(2)
  })

  it('splits non-consecutive days in the same competition into separate recaps', () => {
    const matches = [
      makeMatch({
        competitionName: 'Senior County Championships',
        date: '2025-11-08',
        discipline: 'OD',
        partnerName: 'Sam',
        tournamentCategory: 'county',
        tournamentCategoryLabel: 'County',
      }),
      makeMatch({
        competitionName: 'Senior County Championships',
        date: '2025-11-15',
        discipline: 'WD',
        partnerName: 'Sam',
        tournamentCategory: 'county',
        tournamentCategoryLabel: 'County',
      }),
    ]

    const { recaps } = computeTournamentRecaps(matches)
    expect(recaps).toHaveLength(2)
    expect(recaps.every((r) => r.competitionName === 'Senior County Championships')).toBe(
      true,
    )
    expect(recaps[0]!.dateFrom).toBe('2025-11-15')
    expect(recaps[1]!.dateFrom).toBe('2025-11-08')
  })

  it('treats an earlier stint of the same competition as prior history', () => {
    const firstStint = makeMatch({
      competitionName: 'Senior County Championships',
      date: '2025-10-04',
      discipline: 'OD',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      outcome: 'loss',
      raw: {
        Round: 'Division 1',
        'Tournament Category': 'County',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const secondStint = makeMatch({
      competitionName: 'Senior County Championships',
      date: '2025-11-08',
      discipline: 'OD',
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

    const { recaps } = computeTournamentRecaps([firstStint, secondStint])
    expect(recaps).toHaveLength(2)

    const laterRecap = recaps.find((r) => r.dateFrom === '2025-11-08')!
    expect(laterRecap.celebrations.milestones.some((m) => m.variant === 'debut')).toBe(
      false,
    )
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

  it("shows You've been busy! only at 7+ competitive matches", () => {
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
      computeTournamentRecaps(few).recaps[0]!.eventSummaries.some((c) =>
        c.label.includes("You've been busy"),
      ),
    ).toBe(false)
    const busy = computeTournamentRecaps(many).recaps[0]!
    expect(
      busy.eventSummaries.some((c) => c.label === "You've been busy!"),
    ).toBe(true)
    expect(busy.eventSummaries.find((c) => c.id === 'busy-weekend')?.detail).toBe(
      '7 competitive matches at this event',
    )
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
    expect(recap.partnerChemistryHighlights[0]!.discipline).toBe('WD')

    const wd = recap.disciplines.find((d) => d.discipline === 'WD')!
    expect(
      wd.eventCallouts.some((c) => c.label === 'Even better with Sam'),
    ).toBe(true)
    expect(recap.emojiInsights.some((i) => i.kind === 'partner_chemistry')).toBe(
      false,
    )
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
    const semiExit = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Quarter-final',
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
      }),
    ]

    const celebrations = computeTournamentRecaps(semiExit).recaps[0]!.celebrations
    expect(celebrations.jointThirds).toHaveLength(1)
    expect(celebrations.jointThirds[0]!.kind).toBe('joint-third')
  })

  it('suppresses matched best when joint third covers repeat semi-final loss', () => {
    const semiExit = (comp: string, date: string) => [
      makeMatch({
        competitionName: comp,
        date,
        discipline: 'WS',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Quarter-final',
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
          Round: 'Semi-final',
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

    const celebrations = computeTournamentRecaps([
      ...semiExit('Earlier', '2025-06-01'),
      ...semiExit('Again', '2026-06-01'),
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
      competitionAgeLabel: null,
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
    const semiExit = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        partnerName: 'Sam',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Quarter-final',
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
      }),
    ]

    const celebrations = computeTournamentRecaps(semiExit).recaps[0]!.celebrations

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

  it('shows senior county debut card on first-ever senior county appearance', () => {
    const seniorCounty = makeMatch({
      competitionName: 'Senior County Championships',
      date: '2025-11-08',
      discipline: 'OD',
      disciplineLabel: 'Open doubles',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      competitionAgeGroup: 'Senior',
      competitionSubAgeGroup: 'Senior',
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

    const debut = computeTournamentRecaps([seniorCounty]).recaps[0]!.celebrations
      .seniorCountyDebut

    expect(debut).not.toBeNull()
    expect(debut!.title).toBe('First senior county appearance')
    expect(debut!.disciplines.map((d) => d.discipline)).toEqual(['OD'])
  })

  it('does not show senior county debut when prior senior county exists', () => {
    const priorSeniorCounty = makeMatch({
      competitionName: 'County League 2024',
      date: '2024-11-01',
      discipline: 'OD',
      disciplineLabel: 'Open doubles',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      competitionAgeGroup: 'Senior',
      competitionSubAgeGroup: 'Senior',
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
    const currentSeniorCounty = makeMatch({
      competitionName: 'Senior County Championships',
      date: '2025-11-08',
      discipline: 'OD',
      disciplineLabel: 'Open doubles',
      partnerName: 'Sam',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      competitionAgeGroup: 'Senior',
      competitionSubAgeGroup: 'Senior',
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

    const debut = computeTournamentRecaps([priorSeniorCounty, currentSeniorCounty]).recaps.find(
      (r) => r.competitionName === 'Senior County Championships',
    )!.celebrations.seniorCountyDebut

    expect(debut).toBeNull()
  })

  it('does not treat non-senior county as senior county debut', () => {
    const juniorCounty = makeMatch({
      competitionName: 'U17 County',
      date: '2025-11-08',
      discipline: 'WS',
      tournamentCategory: 'county',
      tournamentCategoryLabel: 'County',
      competitionAgeGroup: 'Junior',
      competitionSubAgeGroup: 'U17',
      outcome: 'loss',
      raw: {
        Round: 'Division 1',
        'Tournament Category': 'County',
        'Player Game 1 Score': 15,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 12,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const debut = computeTournamentRecaps([juniorCounty]).recaps[0]!.celebrations
      .seniorCountyDebut

    expect(debut).toBeNull()
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
    const semiExit = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        partnerName: 'Sam',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Quarter-final',
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
      }),
    ]

    const celebrations = computeTournamentRecaps(semiExit).recaps[0]!.celebrations

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
    const semiExit = [
      makeMatch({
        competitionName: 'Bronze Cup',
        date: '2026-06-01',
        discipline: 'XD',
        tournamentCategoryLabel: 'Bronze',
        outcome: 'win',
        raw: {
          Round: 'Quarter-final',
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
          Round: 'Semi-final',
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

    const celebrations = computeTournamentRecaps([priorQf, ...semiExit]).recaps.find(
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
    expect(strength?.detail).toBe('Beat New Giant')
    expect(strength?.detail).not.toContain('see Best wins')
    expect(strength?.sectionId).toBe('best-wins')

    const ws = recap.disciplines.find((d) => d.discipline === 'WS')!
    const highlighted = ws.matches.find((m) =>
      m.highlights.some((h) => h.id === 'your-strongest-beaten'),
    )
    expect(highlighted).toBeUndefined()
    expect(ws.eventCallouts.some((c) => c.id === 'event-strongest-scalp')).toBe(false)
  })

  it('surfaces per-match highlight pills for strongest beaten and big upsets', () => {
    const underdogWin = makeMatch({
      competitionName: 'Upset Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'Giant',
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

    const recap = computeTournamentRecaps([underdogWin]).recaps[0]!
    const ws = recap.disciplines.find((d) => d.discipline === 'WS')!

    expect(ws.eventCallouts.some((c) => c.id === 'event-strongest-scalp')).toBe(false)
    expect(ws.eventCallouts.some((c) => c.id === 'event-biggest-upset')).toBe(false)

    const match = ws.matches[0]!
    expect(match.highlights.map((h) => h.label)).toEqual(['Big upset!'])
    expect(match.highlights.find((h) => h.label === 'Big upset!')?.popoverText).toMatch(
      /110 points higher/,
    )
  })

  it('omits big upset pills when the rating gap is below 30', () => {
    const narrowWin = makeMatch({
      competitionName: 'Close Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'Slightly Higher',
      outcome: 'win',
      playerRating: 550,
      raw: {
        'Opponent 1 Rating': 570,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const ws = computeTournamentRecaps([narrowWin]).recaps[0]!.disciplines[0]!
    expect(ws.matches.some((m) => m.highlights.some((h) => h.label === 'Big upset!'))).toBe(
      false,
    )
  })

  it('omits big upset pills when all wins were as favourite', () => {
    const favouriteWin = makeMatch({
      competitionName: 'Easy Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'Weaker',
      outcome: 'win',
      playerRating: 600,
      raw: {
        'Opponent 1 Rating': 500,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const ws = computeTournamentRecaps([favouriteWin]).recaps[0]!.disciplines[0]!
    expect(
      ws.matches.some((m) => m.highlights.some((h) => h.label === 'Big upset!')),
    ).toBe(false)
    expect(
      ws.matches.some((m) => m.highlights.some((h) => h.id === 'your-strongest-beaten')),
    ).toBe(false)
  })

  it('surfaces strongest-beaten highlight when there are multiple wins at the event', () => {
    const weakerWin = makeMatch({
      competitionName: 'Multi Win Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'Weaker',
      outcome: 'win',
      playerRating: 550,
      raw: {
        'Opponent 1 Rating': 580,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const strongerWin = makeMatch({
      competitionName: 'Multi Win Cup',
      date: '2026-04-02',
      discipline: 'WS',
      opponents: 'Stronger',
      outcome: 'win',
      playerRating: 550,
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

    const ws = computeTournamentRecaps([weakerWin, strongerWin]).recaps[0]!.disciplines[0]!
    const highlighted = ws.matches.find((m) =>
      m.highlights.some((h) => h.id === 'your-strongest-beaten'),
    )
    expect(highlighted?.opponents).toBe('Stronger')
  })

  it('computes strongest-beaten highlights separately for each discipline', () => {
    const wsWeakerWin = makeMatch({
      competitionName: 'Multi Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'WS Easy',
      outcome: 'win',
      playerRating: 550,
      raw: {
        'Opponent 1 Rating': 580,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const wsWin = makeMatch({
      competitionName: 'Multi Cup',
      date: '2026-04-02',
      discipline: 'WS',
      opponents: 'WS Foe',
      outcome: 'win',
      playerRating: 550,
      raw: {
        'Opponent 1 Rating': 620,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const wdWeakerWin = makeMatch({
      competitionName: 'Multi Cup',
      date: '2026-04-02',
      discipline: 'WD',
      partnerName: 'Sam',
      opponents: 'WD Easy',
      outcome: 'win',
      playerRating: 560,
      raw: {
        'Opponent 1 Rating': 600,
        'Opponent 2 Rating': 590,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const wdWin = makeMatch({
      competitionName: 'Multi Cup',
      date: '2026-04-03',
      discipline: 'WD',
      partnerName: 'Sam',
      opponents: 'WD Foe',
      outcome: 'win',
      playerRating: 560,
      raw: {
        'Opponent 1 Rating': 640,
        'Opponent 2 Rating': 630,
        'Player Game 1 Score': 21,
        'Opponent Game 1 Score': 15,
        'Player Game 2 Score': 21,
        'Opponent Game 2 Score': 12,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })

    const recap = computeTournamentRecaps([wsWeakerWin, wsWin, wdWeakerWin, wdWin]).recaps[0]!
    const wsHighlight = recap.disciplines
      .find((d) => d.discipline === 'WS')!
      .matches.find((m) => m.highlights.some((h) => h.id === 'your-strongest-beaten'))
    const wdHighlight = recap.disciplines
      .find((d) => d.discipline === 'WD')!
      .matches.find((m) => m.highlights.some((h) => h.id === 'your-strongest-beaten'))

    expect(wsHighlight?.opponents).toBe('WS Foe')
    expect(wdHighlight?.opponents).toBe('WD Foe')
  })

  it('computes same-day rating delta from chronological order, not upload order', () => {
    const strongerLater = makeMatch({
      competitionName: 'Same Day Cup',
      date: '2026-01-17',
      discipline: 'XD',
      opponents: 'Stronger pair',
      playerRating: 656,
      outcome: 'win',
      raw: { Round: 'Group A' },
    })
    const weakerEarlier = makeMatch({
      competitionName: 'Same Day Cup',
      date: '2026-01-17',
      discipline: 'XD',
      opponents: 'Weaker pair',
      playerRating: 650,
      outcome: 'win',
      raw: { Round: 'Group A' },
    })

    const xd = computeTournamentRecaps([strongerLater, weakerEarlier]).recaps[0]!.disciplines[0]!
    expect(xd.ratingStart).toBe(650)
    expect(xd.ratingEnd).toBe(656)
    expect(xd.ratingDelta).toBe(6)
    expect(xd.matches.map((m) => m.opponents)).toEqual(['Weaker pair', 'Stronger pair'])
  })

  it('orders discipline matches chronologically', () => {
    const early = makeMatch({
      competitionName: 'Order Cup',
      date: '2026-04-01',
      discipline: 'WS',
      opponents: 'Early',
      outcome: 'loss',
      playerRating: 550,
      raw: {
        'Opponent 1 Rating': 560,
        'Opponent 2 Rating': null,
        'Player Game 1 Score': 18,
        'Opponent Game 1 Score': 21,
        'Player Game 2 Score': 19,
        'Opponent Game 2 Score': 21,
        'Player Game 3 Score': null,
        'Opponent Game 3 Score': null,
      },
    })
    const late = makeMatch({
      competitionName: 'Order Cup',
      date: '2026-04-02',
      discipline: 'WS',
      opponents: 'Late',
      outcome: 'win',
      playerRating: 545,
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
    })

    const matches = computeTournamentRecaps([late, early]).recaps[0]!.disciplines[0]!
      .matches
    expect(matches.map((m) => m.opponents)).toEqual(['Early', 'Late'])
  })

  it('surfaces great form as a tournament summary card', () => {
    const matches = [
      makeMatch({
        competitionName: 'Bad Weekend',
        date: '2026-05-01',
        discipline: 'WS',
        playerRating: 600,
        outcome: 'loss',
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
        outcome: 'win',
      }),
      makeMatch({
        competitionName: 'Good Weekend',
        date: '2026-06-02',
        discipline: 'WS',
        playerRating: 590,
        outcome: 'win',
      }),
    ]

    const good = computeTournamentRecaps(matches).recaps.find(
      (r) => r.competitionName === 'Good Weekend',
    )!
    expect(good.eventSummaries.some((c) => c.label === 'Great form')).toBe(true)
    expect(good.otherEventInsights).toHaveLength(0)
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

describe('tournament recap display hierarchy', () => {
  it('hoists a shared partner and hides match-level dates on single-day events', () => {
    const matches = [
      makeMatch({
        competitionName: 'One Day Cup',
        date: '2026-06-14',
        discipline: 'OD',
        partnerName: 'Sam',
        opponents: 'Team A',
      }),
      makeMatch({
        competitionName: 'One Day Cup',
        date: '2026-06-14',
        discipline: 'OD',
        partnerName: 'Sam',
        opponents: 'Team B',
        outcome: 'loss',
        scoreSummary: '15-21, 12-21',
        raw: {
          'Player Game 1 Score': 15,
          'Opponent Game 1 Score': 21,
          'Player Game 2 Score': 12,
          'Opponent Game 2 Score': 21,
          'Player Game 3 Score': null,
          'Opponent Game 3 Score': null,
        },
      }),
    ]

    const od = computeTournamentRecaps(matches).recaps[0]!.disciplines[0]!
    expect(od.partnerName).toBe('Sam')
    expect(od.matches.every((m) => m.showPartnerName === false)).toBe(true)
    expect(od.matches.every((m) => m.showDate === false)).toBe(true)
    expect(od.matches.every((m) => m.partnerName === 'Sam')).toBe(true)
  })

  it('hoists a shared partner but shows match-level dates on multi-day events', () => {
    const matches = [
      makeMatch({
        competitionName: 'Weekend Cup',
        date: '2026-06-14',
        discipline: 'WD',
        partnerName: 'Sam',
        opponents: 'Team A',
      }),
      makeMatch({
        competitionName: 'Weekend Cup',
        date: '2026-06-15',
        discipline: 'WD',
        partnerName: 'Sam',
        opponents: 'Team B',
      }),
    ]

    const recap = computeTournamentRecaps(matches).recaps[0]!
    expect(recap.dateFrom).toBe('2026-06-14')
    expect(recap.dateTo).toBe('2026-06-15')

    const wd = recap.disciplines[0]!
    expect(wd.partnerName).toBe('Sam')
    expect(wd.matches.every((m) => m.showPartnerName === false)).toBe(true)
    expect(wd.matches.every((m) => m.showDate === true)).toBe(true)
  })

  it('shows partner on each match when partners vary within a discipline', () => {
    const matches = [
      makeMatch({
        competitionName: 'Mixed Partners',
        date: '2026-06-14',
        discipline: 'WD',
        partnerName: 'Sam',
        opponents: 'Team A',
      }),
      makeMatch({
        competitionName: 'Mixed Partners',
        date: '2026-06-14',
        discipline: 'WD',
        partnerName: 'Pat',
        opponents: 'Team B',
      }),
    ]

    const wd = computeTournamentRecaps(matches).recaps[0]!.disciplines[0]!
    expect(wd.partnerName).toBeNull()
    expect(wd.matches.map((m) => m.showPartnerName)).toEqual([true, true])
    expect(wd.matches.map((m) => m.partnerName)).toEqual(['Sam', 'Pat'])
    expect(wd.matches.every((m) => m.showDate === false)).toBe(true)
  })

  it('does not hoist partner for singles disciplines', () => {
    const matches = [
      makeMatch({
        competitionName: 'Singles Day',
        date: '2026-06-14',
        discipline: 'WS',
        opponents: 'Player A',
      }),
      makeMatch({
        competitionName: 'Singles Day',
        date: '2026-06-14',
        discipline: 'WS',
        opponents: 'Player B',
      }),
    ]

    const ws = computeTournamentRecaps(matches).recaps[0]!.disciplines[0]!
    expect(ws.partnerName).toBeNull()
    expect(ws.matches.every((m) => m.showPartnerName === false)).toBe(true)
    expect(ws.matches.every((m) => m.showDate === false)).toBe(true)
  })
})
