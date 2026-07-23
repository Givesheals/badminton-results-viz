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
      // Notes only (Murray note, no prior meeting)
      {
        id: 'd1',
        roundLabel: 'Group A',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [player('Murray Wright'), player('Corinna Wong')],
      },
      // Notes + games
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
      // Games only (Gilhooly prior meeting, no notes)
      {
        id: 'd3',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Simon Gilhooly'), player('Paul Andrew Mayfield')],
      },
      // Neither notes nor games
      {
        id: 'd4',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Chris Nolan'), player('Alex Reid')],
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

/** Minimal draw so many favourites can appear in Whose draw without huge fixtures. */
function stubFavouriteDraw(name: string): DrawDisciplineGroup[] {
  return [
    {
      disciplineCode: 'XD',
      disciplineLabel: 'Mixed Doubles',
      matchups: [
        {
          id: `fav-${name.toLowerCase().replace(/\s+/g, '-')}`,
          roundLabel: 'Group B',
          yourSide: [player(name), player('Partner Stub')],
          opponentSide: [player('Murray Wright'), player('Corinna Wong')],
        },
      ],
    },
  ]
}

const EXTRA_FAVOURITE_NAMES = [
  'Ben Carter',
  'Tom Fielding',
  'Daniel Hughes',
  'Alisha Johnson',
  'Emma Walsh',
  'Lucy Grant',
  'James Chen',
  'Paul Andrew Mayfield',
  'Morgan Taylor',
  'Corinna Wong',
]

function toIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Next Sat–Sun (or the current weekend on Sat/Sun) for prototype fixture labels. */
export function upcomingWeekendDates(now: Date = new Date()): { startDate: string; endDate: string } {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const day = today.getDay()
  if (day === 6) {
    const end = new Date(today)
    end.setDate(end.getDate() + 1)
    return { startDate: toIsoDate(today), endDate: toIsoDate(end) }
  }
  if (day === 0) {
    const start = new Date(today)
    start.setDate(start.getDate() - 1)
    return { startDate: toIsoDate(start), endDate: toIsoDate(today) }
  }
  const start = new Date(today)
  start.setDate(start.getDate() + (6 - day))
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { startDate: toIsoDate(start), endDate: toIsoDate(end) }
}

/** Preview competitions; prototype weekends roll forward with the calendar. */
export const drawScoutPreviewCompetitions: DrawScoutCompetition[] = [
  {
    slug: 'cambridgeshire-senior-bronze-july-2026',
    name: 'Cambridgeshire Senior Bronze July 2026',
    startDate: prototypeWeekend.startDate,
    endDate: prototypeWeekend.endDate,
    isPrototype: true,
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
      ...EXTRA_FAVOURITE_NAMES.map((name) => ({
        name,
        isFavourite: true as const,
        disciplineGroups: stubFavouriteDraw(name),
      })),
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
        // Semi-finals — mix of intel states
        {
          // Both notes + games
          opponentSide: [
            player('Dan Martyres', { seedLabel: '[1]' }),
            player('Alisha Johnson'),
          ],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.5,
        },
        {
          // Both notes + games (also appears in quarters)
          opponentSide: [player('Tom Fielding'), player('Lucy Grant')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.35,
        },
        {
          // Notes only
          opponentSide: [player('Helena Croft'), player('Marcus Bloom')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.28,
        },
        {
          // Games only
          opponentSide: [player('Felix Grant'), player('Chloe Adams')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.22,
        },
        {
          // Neither notes nor games
          opponentSide: [player('Isla Bennett'), player('Noah Price')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.18,
        },
        // Quarter-finals — mix of intel states (enough for Show more)
        {
          // Both notes + games
          opponentSide: [player('Tom Fielding'), player('Lucy Grant')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.45,
        },
        {
          // Both notes + games
          opponentSide: [player('Ben Carter'), player('Emma Walsh')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.35,
        },
        {
          // Games only
          opponentSide: [player('Oliver Brooks'), player('Sophie Lane')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.3,
        },
        {
          // Notes only
          opponentSide: [player('Murray Wright'), player('Corinna Wong')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.25,
        },
        {
          // Neither notes nor games
          opponentSide: [player('Jamie Patel'), player('Priya Shah')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.2,
        },
        {
          // Neither notes nor games
          opponentSide: [player('Nina West'), player('Ryan Cole')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.15,
        },
        {
          opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
          disciplineCode: 'OD',
          roundLabel: 'Quarter-finals',
          probability: 0.62,
        },
        {
          opponentSide: [player('Chris Nolan'), player('Alex Reid')],
          disciplineCode: 'OD',
          roundLabel: 'Quarter-finals',
          probability: 0.38,
        },
      ],
      'Sara Moore': [
        {
          opponentSide: [
            player('Dan Martyres', { seedLabel: '[1]' }),
            player('Alisha Johnson'),
          ],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.52,
        },
        {
          opponentSide: [player('Murray Wright'), player('Corinna Wong')],
          disciplineCode: 'XD',
          roundLabel: 'Quarter-finals',
          probability: 0.48,
        },
        {
          opponentSide: [player('Tom Fielding'), player('Lucy Grant')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.55,
        },
        {
          opponentSide: [player('Ben Carter'), player('Emma Walsh')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.45,
        },
      ],
      'Martin Crossley': [
        {
          opponentSide: [player('Simon Gilhooly'), player('Paul Andrew Mayfield')],
          disciplineCode: 'OD',
          roundLabel: 'Quarter-finals',
          probability: 0.55,
        },
        {
          opponentSide: [player('Chris Nolan'), player('Alex Reid')],
          disciplineCode: 'OD',
          roundLabel: 'Quarter-finals',
          probability: 0.45,
        },
      ],
    },
  },
  {
    slug: 'essex-senior-bronze-july-2026',
    name: 'Essex Senior Bronze July 2026',
    startDate: prototypeWeekend.startDate,
    endDate: prototypeWeekend.endDate,
    isPrototype: true,
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

/** Prototype competitions with rolling weekend dates for in-app display. */
export function getDrawScoutPreviewCompetitions(now: Date = new Date()): DrawScoutCompetition[] {
  const weekend = upcomingWeekendDates(now)
  return drawScoutPreviewCompetitions.map((comp) => ({
    ...comp,
    ...weekend,
  }))
}
