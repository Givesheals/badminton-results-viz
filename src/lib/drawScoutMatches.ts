import { getOpponentTeamMembers } from './matchTeams'
import type { NormalizedMatch } from '../types/matchHistory'
import { recapMatchKey } from './tournamentRecap'
import { drawScoutDemoMatches } from './drawScoutDemoMatches'

export function matchIncludesOpponent(match: NormalizedMatch, opponentName: string): boolean {
  const normalized = opponentName.trim().toLowerCase()
  return getOpponentTeamMembers(match).some(
    (member) => member.name.trim().toLowerCase() === normalized,
  )
}

export function matchIncludesAllOpponents(
  match: NormalizedMatch,
  opponentNames: string[],
): boolean {
  return opponentNames.every((name) => matchIncludesOpponent(match, name))
}

export function getPreviousMatchesAgainstOpponent(
  allMatches: NormalizedMatch[],
  opponentName: string,
  playerName?: string | null,
): NormalizedMatch[] {
  const playerFilter = playerName?.trim().toLowerCase()
  return allMatches
    .filter((match) => {
      if (playerFilter && match.playerName.trim().toLowerCase() !== playerFilter) {
        return false
      }
      return matchIncludesOpponent(match, opponentName)
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

export function getPreviousMatchesAgainstPair(
  allMatches: NormalizedMatch[],
  opponentA: string,
  opponentB: string,
  playerName?: string | null,
): NormalizedMatch[] {
  const playerFilter = playerName?.trim().toLowerCase()
  return allMatches
    .filter((match) => {
      if (playerFilter && match.playerName.trim().toLowerCase() !== playerFilter) {
        return false
      }
      return matchIncludesAllOpponents(match, [opponentA, opponentB])
    })
    .sort((a, b) => b.date.localeCompare(a.date))
}

/** Meetings that include this opponent but not their drawn partner. */
export function getPreviousMatchesAgainstOpponentExcludingPartner(
  allMatches: NormalizedMatch[],
  opponentName: string,
  excludePartnerName: string,
  playerName?: string | null,
): NormalizedMatch[] {
  return getPreviousMatchesAgainstOpponent(allMatches, opponentName, playerName).filter(
    (match) => !matchIncludesOpponent(match, excludePartnerName),
  )
}

export type DrawScoutPreviousMatchesResult = {
  matches: NormalizedMatch[]
  /** True when showing prototype demo meetings because none exist in uploaded results. */
  isDemo: boolean
}

export function getDrawScoutPreviousMatches(
  allMatches: NormalizedMatch[],
  opponentName: string,
  playerName?: string | null,
): DrawScoutPreviousMatchesResult {
  const real = getPreviousMatchesAgainstOpponent(allMatches, opponentName, playerName)
  if (real.length > 0) {
    return { matches: real, isDemo: false }
  }

  const demo = drawScoutDemoMatches.filter((match) => matchIncludesOpponent(match, opponentName))
  return { matches: demo, isDemo: demo.length > 0 }
}

export function getDrawScoutPreviousMatchesAgainstPair(
  allMatches: NormalizedMatch[],
  opponentA: string,
  opponentB: string,
  playerName?: string | null,
): DrawScoutPreviousMatchesResult {
  const real = getPreviousMatchesAgainstPair(allMatches, opponentA, opponentB, playerName)
  if (real.length > 0) {
    return { matches: real, isDemo: false }
  }

  const demo = drawScoutDemoMatches.filter((match) =>
    matchIncludesAllOpponents(match, [opponentA, opponentB]),
  )
  return { matches: demo, isDemo: demo.length > 0 }
}

export function getDrawScoutPreviousMatchesAgainstOpponentAlone(
  allMatches: NormalizedMatch[],
  opponentName: string,
  excludePartnerName: string,
  playerName?: string | null,
): DrawScoutPreviousMatchesResult {
  const real = getPreviousMatchesAgainstOpponentExcludingPartner(
    allMatches,
    opponentName,
    excludePartnerName,
    playerName,
  )
  if (real.length > 0) {
    return { matches: real, isDemo: false }
  }

  const demo = drawScoutDemoMatches.filter(
    (match) =>
      matchIncludesOpponent(match, opponentName) &&
      !matchIncludesOpponent(match, excludePartnerName),
  )
  return { matches: demo, isDemo: demo.length > 0 }
}

export function mergeDrawScoutDisplayMatches(allMatches: NormalizedMatch[]): NormalizedMatch[] {
  const keys = new Set(allMatches.map((match) => `${match.date}\0${match.competitionName}\0${match.opponents}`))
  const supplemental = drawScoutDemoMatches.filter((match) => {
    const key = `${match.date}\0${match.competitionName}\0${match.opponents}`
    return !keys.has(key)
  })
  return [...allMatches, ...supplemental]
}

export type DrawScoutResultMatch = {
  match: NormalizedMatch
  isNoteMatch: boolean
}

/** Merges previous meetings with any note-linked matches, marking which rows tie to personal notes. */
export function buildDrawScoutResultMatches(
  previousMatches: NormalizedMatch[],
  noteMatchKeys: Iterable<string>,
  matchByKey: Map<string, NormalizedMatch>,
): DrawScoutResultMatch[] {
  const noteKeys = new Set(noteMatchKeys)
  const seen = new Set<string>()
  const items: DrawScoutResultMatch[] = []

  for (const match of previousMatches) {
    const key = recapMatchKey(match)
    if (seen.has(key)) continue
    seen.add(key)
    items.push({ match, isNoteMatch: noteKeys.has(key) })
  }

  for (const key of noteKeys) {
    if (seen.has(key)) continue
    const match = matchByKey.get(key)
    if (match == null) continue
    seen.add(key)
    items.push({ match, isNoteMatch: true })
  }

  return items.sort((a, b) => b.match.date.localeCompare(a.match.date))
}
