import type { SpreadsheetRow } from './dataset'

/** Column headers for the standard match history export (always identical). */
export const MATCH_HISTORY_HEADERS = [
  'Competition Name',
  'Tournament Category',
  'Date',
  'Round',
  'Discipline',
  'Player Name',
  'Player Rating',
  'Partner Name',
  'Partner Rating',
  'Opponent 1 Name',
  'Opponent 1 Rating',
  'Opponent 2 Name',
  'Opponent 2 Rating',
  'Player Game 1 Score',
  'Opponent Game 1 Score',
  'Player Game 2 Score',
  'Opponent Game 2 Score',
  'Player Game 3 Score',
  'Opponent Game 3 Score',
  'Score Text',
] as const

export type MatchHistoryHeader = (typeof MATCH_HISTORY_HEADERS)[number]

export type MatchOutcome = 'win' | 'loss' | 'unknown'

/** Administrative results that should not affect win/loss analytics. */
export type NonCompetitiveReason = 'walkover' | 'no_match'

export type NormalizedMatch = {
  competitionName: string
  tournamentCategory: string
  tournamentCategoryLabel: string
  date: string
  discipline: string
  disciplineLabel: string
  playerName: string
  partnerName: string | null
  opponents: string
  outcome: MatchOutcome
  nonCompetitiveReason: NonCompetitiveReason | null
  scoreSummary: string
  playerRating: number | null
  competitionAgeGroup?: string | null
  competitionSubAgeGroup?: string | null
  raw: SpreadsheetRow
}

export const DISCIPLINE_LABELS: Record<string, string> = {
  WS: "Women's singles",
  WD: "Women's doubles",
  MS: "Men's singles",
  MD: "Men's doubles",
  XD: 'Mixed doubles',
  OS: 'Open singles',
  OD: 'Open doubles',
}
