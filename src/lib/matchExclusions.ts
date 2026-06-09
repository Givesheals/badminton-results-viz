import type { SpreadsheetRow } from '../types/dataset'
import type { NonCompetitiveReason, NormalizedMatch } from '../types/matchHistory'

function normalizeText(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, ' ')
}

function textIndicatesWalkover(text: string): boolean {
  const normalized = normalizeText(text)
  if (!normalized) return false

  return (
    /\bwalk\s*-?\s*over\b/.test(normalized) ||
    /\bw\s*\/\s*o\b/.test(normalized) ||
    normalized === 'wo' ||
    /\bwalkover\s+(win|loss|won|lost)\b/.test(normalized) ||
    /\b(won|lost)\s+by\s+walkover\b/.test(normalized)
  )
}

function textIndicatesNoMatch(text: string): boolean {
  const normalized = normalizeText(text)
  if (!normalized) return false

  return /\bno\s*-?\s*match\b/.test(normalized)
}

function textIndicatesRetired(text: string): boolean {
  const normalized = normalizeText(text)
  if (!normalized) return false

  return /\bretired?\b/.test(normalized) || /\bretirement\b/.test(normalized)
}

function classifyText(text: string): NonCompetitiveReason | null {
  if (textIndicatesNoMatch(text)) return 'no_match'
  if (textIndicatesWalkover(text)) return 'walkover'
  return null
}

function textsFromRow(row: SpreadsheetRow): string[] {
  const fields: (keyof SpreadsheetRow)[] = [
    'Score Text',
    'Opponent 1 Name',
    'Opponent 2 Name',
  ]

  return fields
    .map((field) => {
      const value = row[field]
      if (value == null) return ''
      return String(value).trim()
    })
    .filter((text) => text.length > 0)
}

/** Walkovers and "no match" rows are not real competitive results. */
export function detectNonCompetitiveReason(
  row: SpreadsheetRow,
): NonCompetitiveReason | null {
  for (const text of textsFromRow(row)) {
    const reason = classifyText(text)
    if (reason != null) return reason
  }
  return null
}

export function isCompetitiveMatch(match: NormalizedMatch): boolean {
  return match.nonCompetitiveReason == null
}

export function competitiveMatches(matches: NormalizedMatch[]): NormalizedMatch[] {
  return matches.filter(isCompetitiveMatch)
}

/** Walkover, no-match, or retired text on the match (even if import missed the flag). */
export function matchHasNonScoreFinish(match: NormalizedMatch): boolean {
  for (const text of matchTexts(match)) {
    if (classifyText(text) != null) return true
    if (textIndicatesRetired(text)) return true
  }
  return false
}

function matchTexts(match: NormalizedMatch): string[] {
  return [match.scoreSummary, match.opponents].filter((text) => text.length > 0)
}

/** Whether walkover text indicates the player won (vs conceded). */
export function isWalkoverWin(match: NormalizedMatch): boolean {
  if (match.nonCompetitiveReason !== 'walkover') return false
  for (const text of matchTexts(match)) {
    const normalized = normalizeText(text)
    if (
      /\bwalkover\s+win\b/.test(normalized) ||
      /\bwalkover\s+won\b/.test(normalized) ||
      /\bwon\s+by\s+walkover\b/.test(normalized) ||
      /\b(walkover|w\/o)\s+to\s+player\b/.test(normalized)
    ) {
      return true
    }
  }
  return false
}
