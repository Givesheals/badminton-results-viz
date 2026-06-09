/** One row from an uploaded spreadsheet, keyed by column header. */
export type SpreadsheetRow = Record<string, string | number | boolean | null>

export type ParsedDataset = {
  fileName: string
  sheetName: string
  headers: string[]
  rows: SpreadsheetRow[]
  importedAt: string
  format: 'match-history'
}

export type DatasetStats = {
  playerName: string | null
  dateFrom: string | null
  dateTo: string | null
  matchesPlayed: number
  gamesPlayed: number
  matchWins: number
  matchLosses: number
  matchWinPercent: number | null
  playerPoints: number
  opponentPoints: number
  pointsWinPercent: number | null
}
