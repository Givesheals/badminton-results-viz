import type { DrawDisciplineGroup, DrawPlayer } from './drawTypes'
import type { DrawScoutCompetition } from './drawScout'

const COMPETITION_URL =
  'https://badminfo.com/competition/cambridgeshire-senior-bronze-july-2026'

function formatLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Prototype draws stay on the current/next Sat–Sun so they never silently
 * disappear after a hard-coded weekend expires.
 */
export function getPrototypeDrawWeekend(now = new Date()): {
  startDate: string
  endDate: string
} {
  const saturday = new Date(now)
  saturday.setHours(0, 0, 0, 0)
  const day = saturday.getDay() // 0 Sun … 6 Sat
  if (day === 0) {
    saturday.setDate(saturday.getDate() - 1)
  } else if (day !== 6) {
    saturday.setDate(saturday.getDate() + (6 - day))
  }
  const sunday = new Date(saturday)
  sunday.setDate(sunday.getDate() + 1)
  return {
    startDate: formatLocalIsoDate(saturday),
    endDate: formatLocalIsoDate(sunday),
  }
}

const prototypeWeekend = getPrototypeDrawWeekend()

function player(name: string, extra: { seedLabel?: string } = {}): DrawPlayer {
  return {
    name,
    url: `https://badminfo.com/player?name=${encodeURIComponent(name)}`,
    ...extra,
  }
}

const simonXdOd: DrawDisciplineGroup[] = [
  {
    disciplineCode: 'XD',
    disciplineLabel: 'Mixed Doubles',
    matchups: [
      {
        id: 'd1',
        roundLabel: 'Group A',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [player('Murray Wright'), player('Corinna Wong')],
      },
      {
        id: 'd2',
        roundLabel: 'Group A',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [
          player('Dan Martyres', { seedLabel: '[1]' }),
          player('Alisha Johnson'),
        ],
      },
    ],
  },
  {
    disciplineCode: 'OD',
    disciplineLabel: 'Open Doubles',
    matchups: [
      {
        id: 'd3',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Simon Gilhooly'), player('Paul Andrew Mayfield')],
      },
      {
        id: 'd4',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
      },
    ],
  },
]

const saraXd: DrawDisciplineGroup[] = [
  {
    disciplineCode: 'XD',
    disciplineLabel: 'Mixed Doubles',
    matchups: [
      {
        id: 's1',
        roundLabel: 'Group B',
        yourSide: [player('Sara Moore'), player('James Chen')],
        opponentSide: [player('Ben Carter'), player('Emma Walsh')],
      },
      {
        id: 's2',
        roundLabel: 'Group B',
        yourSide: [player('Sara Moore'), player('James Chen')],
        opponentSide: [player('Tom Fielding'), player('Lucy Grant')],
      },
    ],
  },
]

const martinOd: DrawDisciplineGroup[] = [
  {
    disciplineCode: 'OD',
    disciplineLabel: 'Open Doubles',
    matchups: [
      {
        id: 'm1',
        roundLabel: 'Group C',
        yourSide: [player('Martin Crossley'), player('Paul Andrew Mayfield')],
        opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
      },
    ],
  },
]

export const drawScoutPreviewCompetitions: DrawScoutCompetition[] = [
  {
    slug: 'cambridgeshire-senior-bronze-july-2026',
    name: 'Cambridgeshire Senior Bronze July 2026',
    startDate: prototypeWeekend.startDate,
    endDate: prototypeWeekend.endDate,
    competitionUrl: COMPETITION_URL,
    entrants: [
      {
        name: 'Simon Parker',
        isYou: true,
        disciplineGroups: simonXdOd,
      },
      {
        name: 'Sara Moore',
        isFavourite: true,
        disciplineGroups: saraXd,
      },
      {
        name: 'Martin Crossley',
        isFavourite: true,
        disciplineGroups: martinOd,
      },
      {
        name: 'Murray Wright',
        disciplineGroups: [
          {
            disciplineCode: 'XD',
            disciplineLabel: 'Mixed Doubles',
            matchups: [
              {
                id: 'mw1',
                roundLabel: 'Group A',
                yourSide: [player('Murray Wright'), player('Corinna Wong')],
                opponentSide: [player('Simon Parker'), player('Sara Moore')],
              },
            ],
          },
        ],
      },
      {
        name: 'Dan Martyres',
        disciplineGroups: [
          {
            disciplineCode: 'XD',
            disciplineLabel: 'Mixed Doubles',
            matchups: [
              {
                id: 'dm1',
                roundLabel: 'Group A',
                yourSide: [
                  player('Dan Martyres', { seedLabel: '[1]' }),
                  player('Alisha Johnson'),
                ],
                opponentSide: [player('Simon Parker'), player('Sara Moore')],
              },
            ],
          },
        ],
      },
    ],
    laterOpponentsByEntrant: {
      'Simon Parker': [
        { name: 'Tom Fielding', disciplineCode: 'XD', roundLabel: 'Semi-finals' },
        { name: 'Ben Carter', disciplineCode: 'OD', roundLabel: 'Quarter-finals' },
      ],
      'Sara Moore': [
        { name: 'Murray Wright', disciplineCode: 'XD', roundLabel: 'Semi-finals' },
        { name: 'Dan Martyres', disciplineCode: 'XD', roundLabel: 'Quarter-finals' },
      ],
      'Martin Crossley': [
        { name: 'Daniel Hughes', disciplineCode: 'OD', roundLabel: 'Quarter-finals' },
      ],
    },
  },
  {
    slug: 'essex-senior-bronze-july-2026',
    name: 'Essex Senior Bronze July 2026',
    startDate: prototypeWeekend.startDate,
    endDate: prototypeWeekend.endDate,
    competitionUrl: 'https://badminfo.com/competition/essex-senior-bronze-july-2026',
    entrants: [
      {
        name: 'Sara Moore',
        isFavourite: true,
        disciplineGroups: [
          {
            disciplineCode: 'WD',
            disciplineLabel: 'Women\'s Doubles',
            matchups: [
              {
                id: 'e1',
                roundLabel: 'Group D',
                yourSide: [player('Sara Moore'), player('Lucy Grant')],
                opponentSide: [player('Amy Brooks'), player('Kate Morrison')],
              },
            ],
          },
        ],
      },
    ],
    laterOpponentsByEntrant: {},
  },
]

export const DRAW_SCOUT_PREVIEW_SLUG = drawScoutPreviewCompetitions[0]!.slug
