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

/** Stable prototype ratings so the same name shows the same figure across the draw. */
const PLAYER_RATINGS: Record<string, number> = {
  'Simon Parker': 572,
  'Sara Moore': 568,
  'Martin Crossley': 555,
  'Murray Wright': 548,
  'Corinna Wong': 542,
  'Dan Martyres': 612,
  'Alisha Johnson': 598,
  'Simon Gilhooly': 560,
  'Paul Andrew Mayfield': 552,
  'Chris Nolan': 535,
  'Alex Reid': 528,
  'James Chen': 575,
  'Ben Carter': 558,
  'Emma Walsh': 551,
  'Tom Fielding': 565,
  'Lucy Grant': 557,
  'Daniel Hughes': 582,
  'Morgan Taylor': 570,
  'Helena Croft': 545,
  'Marcus Bloom': 538,
  'Felix Grant': 525,
  'Chloe Adams': 520,
  'Isla Bennett': 510,
  'Noah Price': 505,
  'Oliver Brooks': 540,
  'Sophie Lane': 532,
  'Jamie Patel': 518,
  'Priya Shah': 515,
  'Nina West': 508,
  'Ryan Cole': 502,
  'Amy Brooks': 548,
  'Kate Morrison': 541,
  'Partner Stub': 550,
  'Theo Marsh': 555,
  'Callum Reed': 548,
  'Harry Quinn': 540,
  'Owen Blake': 536,
}

function player(name: string, extra: { seedLabel?: string; rating?: number } = {}): DrawPlayer {
  return {
    name,
    url: `https://badminfo.com/player?name=${encodeURIComponent(name)}`,
    ...extra,
    rating: extra.rating ?? PLAYER_RATINGS[name],
  }
}

/**
 * Simon’s progressive draw story (one scroll, three stages):
 * - Singles: groups not started (upcoming cards + QF/SF in “may also meet”);
 *   Callum still busy in OD
 * - Doubles: groups done (compact results) + QF probable with path status per side
 * - Mixed: groups done with wins (compact results) + QF definite opponent (advanced)
 */
const simonSinglesDoublesMixed: DrawDisciplineGroup[] = [
  {
    disciplineCode: 'OS',
    disciplineLabel: 'Open Singles',
    matchups: [
      // Notes only (Theo) — unplayed
      {
        id: 'os1',
        roundLabel: 'Group C',
        yourSide: [player('Simon Parker')],
        opponentSide: [player('Theo Marsh')],
      },
      // Games only (Callum) — unplayed
      {
        id: 'os2',
        roundLabel: 'Group C',
        yourSide: [player('Simon Parker')],
        opponentSide: [player('Callum Reed')],
      },
      // Neither notes nor games — unplayed (box of four)
      {
        id: 'os3',
        roundLabel: 'Group C',
        yourSide: [player('Simon Parker')],
        opponentSide: [player('Owen Blake')],
      },
    ],
  },
  {
    disciplineCode: 'OD',
    disciplineLabel: 'Open Doubles',
    matchups: [
      // Games only (Gilhooly prior meeting, no notes) — played win
      {
        id: 'd3',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Simon Gilhooly'), player('Paul Andrew Mayfield')],
        result: { outcome: 'win', scoreSummary: '21-16, 21-19' },
      },
      // Neither notes nor games — played win (advances from group)
      {
        id: 'd4',
        roundLabel: 'Group G',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [player('Chris Nolan'), player('Alex Reid')],
        result: { outcome: 'win', scoreSummary: '21-12, 19-21, 21-14' },
      },
      // Promoted QF — opponent not decided yet
      {
        id: 'od-qf',
        roundLabel: 'Quarter-finals',
        yourSide: [player('Martin Crossley'), player('Simon Parker')],
        opponentSide: [],
        opponentPending: true,
        gamesUntilOpponentDecided: 2,
        probableOpponents: [
          {
            opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
            probability: 0.42,
            pathStatus: {
              nextRoundShort: 'Group',
              groupGamesRemaining: 1,
            },
          },
          {
            opponentSide: [player('Oliver Brooks'), player('Sophie Lane')],
            probability: 0.28,
            pathStatus: {
              nextRoundShort: 'Group',
              groupGamesRemaining: 2,
            },
          },
          {
            opponentSide: [player('Ben Carter'), player('Emma Walsh')],
            probability: 0.18,
            pathStatus: {
              nextRoundShort: 'Group',
              groupGamesRemaining: 1,
            },
          },
          {
            opponentSide: [player('Jamie Patel'), player('Priya Shah')],
            probability: 0.12,
            pathStatus: {
              nextRoundShort: 'QF',
            },
          },
        ],
      },
    ],
  },
  {
    disciplineCode: 'XD',
    disciplineLabel: 'Mixed Doubles',
    matchups: [
      // Notes only (Murray) — played win
      {
        id: 'd1',
        roundLabel: 'Group A',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [player('Murray Wright'), player('Corinna Wong')],
        result: { outcome: 'win', scoreSummary: '21-18, 21-15' },
      },
      // Notes + games — played win
      {
        id: 'd2',
        roundLabel: 'Group A',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [
          player('Dan Martyres', { seedLabel: '[1]' }),
          player('Alisha Johnson'),
        ],
        result: { outcome: 'win', scoreSummary: '19-21, 21-17, 21-19' },
      },
      // Promoted QF — definite opponent
      {
        id: 'xd-qf',
        roundLabel: 'Quarter-finals',
        yourSide: [player('Simon Parker'), player('Sara Moore')],
        opponentSide: [player('Tom Fielding'), player('Lucy Grant')],
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
    updateCadence: 'frequent',
    busyPlayersByName: {
      'Callum Reed': {
        disciplineCode: 'OD',
        nextRoundShort: 'QF',
      },
    },
    entrants: [
      {
        name: 'Simon Parker',
        isYou: true,
        disciplineGroups: simonSinglesDoublesMixed,
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
        // Singles — still in groups; QF + SF stay in “may also meet”
        {
          opponentSide: [player('Harry Quinn')],
          disciplineCode: 'OS',
          roundLabel: 'Quarter-finals',
          probability: 0.45,
        },
        {
          opponentSide: [player('Jamie Patel')],
          disciplineCode: 'OS',
          roundLabel: 'Quarter-finals',
          probability: 0.35,
        },
        {
          opponentSide: [player('Noah Price')],
          disciplineCode: 'OS',
          roundLabel: 'Quarter-finals',
          probability: 0.2,
        },
        {
          opponentSide: [player('Felix Grant')],
          disciplineCode: 'OS',
          roundLabel: 'Semi-finals',
          probability: 0.55,
        },
        {
          opponentSide: [player('Theo Marsh')],
          disciplineCode: 'OS',
          roundLabel: 'Semi-finals',
          probability: 0.45,
        },
        // Doubles — QF promoted as probable (not listed here); SF only
        {
          opponentSide: [player('Daniel Hughes'), player('Morgan Taylor')],
          disciplineCode: 'OD',
          roundLabel: 'Semi-finals',
          probability: 0.55,
        },
        {
          opponentSide: [player('Chris Nolan'), player('Alex Reid')],
          disciplineCode: 'OD',
          roundLabel: 'Semi-finals',
          probability: 0.45,
        },
        // Mixed — QF is definite in matchups; SF only here (intel mix for prototype)
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
          // Both notes + games (also appears as QF definite)
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
        {
          // Neither — extra SF for show-more coverage if needed
          opponentSide: [player('Jamie Patel'), player('Priya Shah')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.12,
        },
        {
          opponentSide: [player('Nina West'), player('Ryan Cole')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.1,
        },
        {
          opponentSide: [player('Ben Carter'), player('Emma Walsh')],
          disciplineCode: 'XD',
          roundLabel: 'Semi-finals',
          probability: 0.08,
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
  const resultsLastUpdatedAt = new Date(now.getTime() - 14 * 60_000).toISOString()
  return drawScoutPreviewCompetitions.map((comp) => ({
    ...comp,
    ...weekend,
    ...(comp.updateCadence != null
      ? { resultsLastUpdatedAt: comp.resultsLastUpdatedAt ?? resultsLastUpdatedAt }
      : {}),
  }))
}
