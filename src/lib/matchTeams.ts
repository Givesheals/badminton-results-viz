import type { SpreadsheetRow } from '../types/dataset'
import type { NormalizedMatch } from '../types/matchHistory'
import { getPartnerRating, getPlayerRating } from './ratings'

export type TeamMember = {
  name: string
  rating: number | null
}

function parseRating(value: string | number | boolean | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

function cellName(value: string | number | boolean | null): string | null {
  if (value == null || String(value).trim() === '') return null
  return String(value).trim()
}

export function getOpponentTeamMembersFromRow(row: SpreadsheetRow): TeamMember[] {
  const members: TeamMember[] = []

  for (const slot of [1, 2] as const) {
    const name = cellName(row[`Opponent ${slot} Name`])
    if (name == null) continue
    members.push({
      name,
      rating: parseRating(row[`Opponent ${slot} Rating`]),
    })
  }

  return members
}

export function getOpponentTeamMembers(match: NormalizedMatch): TeamMember[] {
  return getOpponentTeamMembersFromRow(match.raw)
}

export function getOurTeamMembers(match: NormalizedMatch): TeamMember[] {
  const members: TeamMember[] = [
    {
      name: match.playerName,
      rating: getPlayerRating(match),
    },
  ]

  if (match.partnerName) {
    members.push({
      name: match.partnerName,
      rating: getPartnerRating(match),
    })
  }

  return members
}

export function getOpponentAppearances(
  row: SpreadsheetRow,
): { name: string; rating: number | null }[] {
  return getOpponentTeamMembersFromRow(row)
}
