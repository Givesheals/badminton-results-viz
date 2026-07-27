/** Static mock for the live Cambridge CSBC tournament page layout. */

export type TournamentPageVisibility = 'premium' | 'gift' | 'hidden'

export type MockBracketPlayer = {
  name: string
  groupLabel?: string
  scores: number[]
  winner?: boolean
}

export type MockBracketMatch = {
  id: string
  round: 'qf' | 'sf' | 'f'
  top: MockBracketPlayer
  bottom: MockBracketPlayer
}

export type MockCategory = {
  code: string
  label: string
}

export const TOURNAMENT_PAGE_CATEGORIES: MockCategory[] = [
  { code: 'all', label: 'All' },
  { code: 'os', label: 'OS' },
  { code: 'ws', label: 'WS' },
  { code: 'od', label: 'OD' },
  { code: 'wd', label: 'WD' },
  { code: 'xd', label: 'XD' },
]

export const TOURNAMENT_PAGE_STAGES = ['Entries', 'Groups', 'Finals'] as const

export const cambridgeTournamentPage = {
  id: '814d9c27-3571-4b07-97bd-0e0adc5eae7a',
  name: 'Cambridge CSBC Senior Tier 4 July 2026',
  dateLabel: '26 Jul 2026',
  venue: 'University of Cambridge Sports Centre',
  address: 'Philippa Fawcett Drive, Cambridge, CB3 0AS',
  travelMins: 14,
  totalEntries: 167,
  avgGrade: 'G',
  badges: [
    { label: 'Copper', tone: 'green' as const },
    { label: 'Entry Closed', tone: 'red' as const },
  ],
  beUrl:
    'https://be.tournamentsoftware.com/tournament/52cc5ffe-b6e6-4c58-9b63-a566c5c94b0f',
  /** Draw companion preview slug (existing mock draw data). */
  drawCompanionSlug: 'cambridgeshire-senior-bronze-july-2026',
}

/** Simplified OS Seniors Finals bracket from the live page. */
export const osSeniorsFinalsMatches: MockBracketMatch[] = [
  {
    id: 'qf1',
    round: 'qf',
    top: { name: 'Ryan Koh', groupLabel: 'Group A', scores: [13, 14] },
    bottom: {
      name: 'Lawrence Li',
      groupLabel: 'Group H',
      scores: [21, 21],
      winner: true,
    },
  },
  {
    id: 'qf2',
    round: 'qf',
    top: {
      name: 'Kwok S. A. Tsang',
      groupLabel: 'Group D',
      scores: [13, 21, 10],
    },
    bottom: {
      name: 'Toby Thompson',
      groupLabel: 'Group F',
      scores: [21, 17, 21],
      winner: true,
    },
  },
  {
    id: 'qf3',
    round: 'qf',
    top: {
      name: 'Hon Yin Shum',
      groupLabel: 'Group E',
      scores: [11, 21, 21],
      winner: true,
    },
    bottom: {
      name: 'Htike Aung',
      groupLabel: 'Group C',
      scores: [21, 14, 17],
    },
  },
  {
    id: 'qf4',
    round: 'qf',
    top: {
      name: 'Yifan Ding',
      groupLabel: 'Group G',
      scores: [21, 13, 14],
    },
    bottom: {
      name: 'Adam Dehlavi',
      groupLabel: 'Group B',
      scores: [16, 21, 21],
      winner: true,
    },
  },
  {
    id: 'sf1',
    round: 'sf',
    top: { name: 'Lawrence Li', scores: [21, 21], winner: true },
    bottom: { name: 'Toby Thompson', scores: [12, 11] },
  },
  {
    id: 'sf2',
    round: 'sf',
    top: { name: 'Hon Yin Shum', scores: [15, 21, 18] },
    bottom: { name: 'Adam Dehlavi', scores: [21, 18, 21], winner: true },
  },
  {
    id: 'f1',
    round: 'f',
    top: { name: 'Lawrence Li', scores: [21, 15, 21], winner: true },
    bottom: { name: 'Adam Dehlavi', scores: [16, 21, 11] },
  },
]
