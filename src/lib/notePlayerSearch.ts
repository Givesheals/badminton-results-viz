import { BE_PLAYER_DIRECTORY, type BePlayerRecord } from '../data/bePlayerDirectory'

/** Simulated grade letter (A–J) or unset. Prototype-only — not from live BE data. */
export type PlayerGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | '-'

export type NotePlayerResult = {
  id: string
  name: string
  county: string
  grades: [PlayerGrade, PlayerGrade, PlayerGrade]
  beNumber: string
  source: 'history' | 'register'
}

const GRADE_CHARS = 'ABCDEFGHIJ-' as const
const COUNTIES = [
  'Middlesex',
  'Surrey',
  'Essex',
  'Kent',
  'Cambridgeshire',
  'Hampshire',
  'Yorkshire',
  'Lancashire',
] as const

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Stable fake grades from a seed so rows don't flicker between renders. */
export function simulateGrades(seed: string): [PlayerGrade, PlayerGrade, PlayerGrade] {
  const hash = hashString(seed)
  return [
    GRADE_CHARS[hash % GRADE_CHARS.length] as PlayerGrade,
    GRADE_CHARS[(hash >>> 4) % GRADE_CHARS.length] as PlayerGrade,
    GRADE_CHARS[(hash >>> 8) % GRADE_CHARS.length] as PlayerGrade,
  ]
}

function simulateCounty(seed: string): string {
  return COUNTIES[hashString(seed) % COUNTIES.length]!
}

function simulateBeNumber(seed: string): string {
  const n = 1_000_000 + (hashString(`be:${seed}`) % 8_999_999)
  return String(n)
}

function fromBeRecord(player: BePlayerRecord, source: NotePlayerResult['source']): NotePlayerResult {
  return {
    id: `be-${player.beNumber}`,
    name: player.name,
    county: player.county,
    grades: simulateGrades(player.beNumber),
    beNumber: player.beNumber,
    source,
  }
}

function fromHistoryName(name: string): NotePlayerResult[] {
  const beMatches = BE_PLAYER_DIRECTORY.filter(
    (player) => player.name.toLowerCase() === name.toLowerCase(),
  )
  if (beMatches.length > 0) {
    return beMatches.map((player) => fromBeRecord(player, 'history'))
  }

  return [
    {
      id: `history-${name.toLowerCase()}`,
      name,
      county: simulateCounty(name),
      grades: simulateGrades(name),
      beNumber: simulateBeNumber(name),
      source: 'history',
    },
  ]
}

export function listHistoryPlayers(knownOpponents: string[]): NotePlayerResult[] {
  return knownOpponents.flatMap(fromHistoryName)
}
/**
 * Hybrid search: prior opponents first, then BE register matches not already listed.
 * Empty query returns history only (browse). Query needs 2+ chars for register.
 */
export function searchNotePlayers(
  query: string,
  knownOpponents: string[],
): { fromHistory: NotePlayerResult[]; fromRegister: NotePlayerResult[] } {
  const trimmed = query.trim().toLowerCase()
  const historyAll = listHistoryPlayers(knownOpponents)
  const fromHistory =
    trimmed === ''
      ? historyAll
      : historyAll.filter((player) => {
          const haystack = `${player.name} ${player.county} ${player.beNumber}`.toLowerCase()
          return haystack.includes(trimmed)
        })

  if (trimmed.length < 2) {
    return { fromHistory, fromRegister: [] }
  }

  const seenBeNumbers = new Set(fromHistory.map((player) => player.beNumber))

  const fromRegister = BE_PLAYER_DIRECTORY.filter((player) => {
    if (seenBeNumbers.has(player.beNumber)) return false
    const haystack = `${player.name} ${player.club} ${player.county} ${player.beNumber}`.toLowerCase()
    return haystack.includes(trimmed)
  })
    .slice(0, 12)
    .map((player) => fromBeRecord(player, 'register'))
  return { fromHistory, fromRegister }
}
