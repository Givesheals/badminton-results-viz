import type { ParsedDataset, SpreadsheetRow } from '../types/dataset'
import {
  DISCIPLINE_LABELS,
  MATCH_HISTORY_HEADERS,
  type MatchOutcome,
  type NormalizedMatch,
} from '../types/matchHistory'
import { detectNonCompetitiveReason } from './matchExclusions'
import {
  readCompetitionAgeGroup,
  readCompetitionSubAgeGroup,
} from './competitionAge'
import { formatTournamentCategory } from './tournamentCategory'

export function isMatchHistoryFormat(headers: string[]): boolean {
  return MATCH_HISTORY_HEADERS.every((required) => headers.includes(required))
}

export function findMatchHistorySheet(sheetNames: string[]): string | undefined {
  const exact = sheetNames.find((name) => name.trim().toLowerCase() === 'match history')
  if (exact) return exact
  return sheetNames[0]
}

function parseScore(value: string | number | boolean | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

export function deriveMatchOutcome(row: SpreadsheetRow): MatchOutcome {
  let playerGames = 0
  let opponentGames = 0

  for (let game = 1; game <= 3; game += 1) {
    const player = parseScore(row[`Player Game ${game} Score`])
    const opponent = parseScore(row[`Opponent Game ${game} Score`])
    if (player == null || opponent == null) continue
    if (player > opponent) playerGames += 1
    else if (opponent > player) opponentGames += 1
  }

  if (playerGames > opponentGames) return 'win'
  if (opponentGames > playerGames) return 'loss'
  return 'unknown'
}

function disciplineLabel(code: string | number | boolean | null): string {
  if (code == null) return 'Unknown'
  const key = String(code).trim().toUpperCase()
  return DISCIPLINE_LABELS[key] ?? key
}

function formatOpponents(row: SpreadsheetRow): string {
  const o1 = row['Opponent 1 Name']
  const o2 = row['Opponent 2 Name']
  const name1 = o1 != null && String(o1).trim() !== '' ? String(o1).trim() : null
  const name2 = o2 != null && String(o2).trim() !== '' ? String(o2).trim() : null
  if (name1 && name2) return `${name1} & ${name2}`
  if (name1) return name1
  if (name2) return name2
  return 'Unknown'
}

function formatScoreSummary(row: SpreadsheetRow): string {
  const scoreText = row['Score Text']
  if (scoreText != null && String(scoreText).trim() !== '') {
    return String(scoreText).trim()
  }

  const games: string[] = []
  for (let game = 1; game <= 3; game += 1) {
    const player = parseScore(row[`Player Game ${game} Score`])
    const opponent = parseScore(row[`Opponent Game ${game} Score`])
    if (player == null || opponent == null) continue
    games.push(`${player}-${opponent}`)
  }
  return games.join(', ') || '—'
}

function cellString(value: string | number | boolean | null, fallback = ''): string {
  if (value == null) return fallback
  return String(value).trim()
}

export function normalizeMatchRow(row: SpreadsheetRow): NormalizedMatch {
  const discipline = cellString(row.Discipline, '—').toUpperCase()
  const partner = cellString(row['Partner Name'])
  const tournamentCategory = formatTournamentCategory(row['Tournament Category'])
  const nonCompetitiveReason = detectNonCompetitiveReason(row)
  const outcome = nonCompetitiveReason ? 'unknown' : deriveMatchOutcome(row)

  return {
    competitionName: cellString(row['Competition Name'], '—'),
    tournamentCategory: tournamentCategory.value,
    tournamentCategoryLabel: tournamentCategory.label,
    date: cellString(row.Date, '—'),
    discipline,
    disciplineLabel: disciplineLabel(row.Discipline),
    playerName: cellString(row['Player Name'], 'Unknown player'),
    partnerName: partner || null,
    opponents: formatOpponents(row),
    outcome,
    nonCompetitiveReason,
    scoreSummary: formatScoreSummary(row),
    playerRating: parseScore(row['Player Rating']),
    competitionAgeGroup: readCompetitionAgeGroup(row),
    competitionSubAgeGroup: readCompetitionSubAgeGroup(row),
    raw: row,
  }
}

export function normalizeDataset(dataset: ParsedDataset): NormalizedMatch[] {
  return dataset.rows.map(normalizeMatchRow)
}

export function getPrimaryPlayerName(matches: NormalizedMatch[]): string | null {
  if (matches.length === 0) return null
  const counts = new Map<string, number>()
  for (const match of matches) {
    counts.set(match.playerName, (counts.get(match.playerName) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

export function validateMatchHistoryDataset(headers: string[]): void {
  if (!isMatchHistoryFormat(headers)) {
    const missing = MATCH_HISTORY_HEADERS.filter((h) => !headers.includes(h))
    throw new Error(
      `This file doesn't match the expected match history format. Missing columns: ${missing.slice(0, 4).join(', ')}${missing.length > 4 ? ` (+${missing.length - 4} more)` : ''}.`,
    )
  }
}
