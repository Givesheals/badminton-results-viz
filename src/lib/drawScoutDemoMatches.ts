import type { SpreadsheetRow } from '../types/dataset'
import type { NormalizedMatch } from '../types/matchHistory'

const PLAYER = 'Simon Parker'

function demoRow(
  competitionName: string,
  date: string,
  discipline: string,
  playerName: string,
  partnerName: string | null,
  opponent1: string,
  opponent2: string | null,
  scores: [number, number][],
): SpreadsheetRow {
  const row: SpreadsheetRow = {
    'Competition Name': competitionName,
    'Tournament Category': 'Bronze',
    Date: date,
    Round: 'Group A',
    Discipline: discipline,
    'Player Name': playerName,
    'Player Rating': 1250,
    'Partner Name': partnerName ?? '',
    'Partner Rating': partnerName ? 1180 : '',
    'Opponent 1 Name': opponent1,
    'Opponent 1 Rating': 1300,
    'Opponent 2 Name': opponent2 ?? '',
    'Opponent 2 Rating': opponent2 ? 1220 : '',
    'Score Text': scores.map(([p, o]) => `${p}-${o}`).join(', '),
  }

  scores.forEach(([player, opponent], index) => {
    row[`Player Game ${index + 1} Score`] = player
    row[`Opponent Game ${index + 1} Score`] = opponent
  })

  return row
}

function demoMatch(options: {
  competitionName: string
  date: string
  discipline: string
  disciplineLabel: string
  playerName: string
  partnerName: string | null
  opponent1: string
  opponent2: string | null
  outcome: 'win' | 'loss'
  scores: [number, number][]
  roundLabel?: string
}): NormalizedMatch {
  const opponents = options.opponent2
    ? `${options.opponent1} & ${options.opponent2}`
    : options.opponent1
  const raw = demoRow(
    options.competitionName,
    options.date,
    options.discipline,
    options.playerName,
    options.partnerName,
    options.opponent1,
    options.opponent2,
    options.scores,
  )
  if (options.roundLabel) {
    raw.Round = options.roundLabel
  }

  return {
    competitionName: options.competitionName,
    tournamentCategory: 'Bronze',
    tournamentCategoryLabel: 'Bronze',
    date: options.date,
    discipline: options.discipline,
    disciplineLabel: options.disciplineLabel,
    playerName: options.playerName,
    partnerName: options.partnerName,
    opponents,
    outcome: options.outcome,
    nonCompetitiveReason: null,
    scoreSummary: String(raw['Score Text']),
    playerRating: 1250,
    raw,
  }
}

/** Example previous meetings aligned with draw scout demo notes. */
export const drawScoutDemoMatches: NormalizedMatch[] = [
  demoMatch({
    competitionName: 'Norfolk Restricted 2025',
    date: '2025-09-14',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    playerName: PLAYER,
    partnerName: 'Martin Crossley',
    opponent1: 'Murray Wright',
    opponent2: 'James Chen',
    outcome: 'win',
    scores: [
      [21, 15],
      [21, 18],
    ],
  }),
  demoMatch({
    competitionName: 'Suffolk Bronze 2026',
    date: '2026-02-02',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    playerName: PLAYER,
    partnerName: 'Sara Moore',
    opponent1: 'Dan Martyres',
    opponent2: 'Jane Smith',
    outcome: 'loss',
    scores: [
      [18, 21],
      [21, 19],
      [17, 21],
    ],
  }),
  demoMatch({
    competitionName: 'Bedfordshire Bronze 2026',
    date: '2026-04-12',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    playerName: PLAYER,
    partnerName: 'Sara Moore',
    opponent1: 'Dan Martyres',
    opponent2: 'Alisha Johnson',
    outcome: 'win',
    scores: [
      [21, 19],
      [18, 21],
      [21, 16],
    ],
  }),
  demoMatch({
    competitionName: 'Norfolk Restricted 2025',
    date: '2025-09-14',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    playerName: PLAYER,
    partnerName: 'Sara Moore',
    opponent1: 'Alisha Johnson',
    opponent2: 'Tom Fielding',
    outcome: 'win',
    scores: [
      [21, 17],
      [21, 15],
    ],
  }),
  demoMatch({
    competitionName: 'Cambridgeshire Bronze 2025',
    date: '2025-11-09',
    discipline: 'OD',
    disciplineLabel: 'Open doubles',
    playerName: PLAYER,
    partnerName: 'Martin Crossley',
    opponent1: 'Daniel Hughes',
    opponent2: 'Morgan Taylor',
    outcome: 'win',
    scores: [
      [21, 19],
      [21, 17],
    ],
  }),
  demoMatch({
    competitionName: 'Hertfordshire Open 2025',
    date: '2025-03-22',
    discipline: 'OD',
    disciplineLabel: 'Open doubles',
    playerName: PLAYER,
    partnerName: 'Paul Andrew Mayfield',
    opponent1: 'Daniel Hughes',
    opponent2: 'Simon Gilhooly',
    outcome: 'loss',
    roundLabel: 'Quarter-final',
    scores: [
      [19, 21],
      [21, 18],
      [18, 21],
    ],
  }),
  demoMatch({
    competitionName: 'Essex Bronze 2026',
    date: '2026-01-18',
    discipline: 'OD',
    disciplineLabel: 'Open doubles',
    playerName: PLAYER,
    partnerName: 'Martin Crossley',
    opponent1: 'Ben Carter',
    opponent2: 'Emma Walsh',
    outcome: 'win',
    scores: [
      [21, 16],
      [21, 14],
    ],
  }),
]

export function isDrawScoutDemoMatch(match: NormalizedMatch): boolean {
  return drawScoutDemoMatches.includes(match)
}
