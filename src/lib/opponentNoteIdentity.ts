import type { NormalizedMatch } from '../types/matchHistory'
import { getOpponentTeamMembers } from './matchTeams'
import { recapMatchKey } from './tournamentRecap'

/** Lowest U19 circuit a player can enter. Seniors would not show gold later. */
export type U19CircuitBand = 'bronze' | 'silver' | 'gold'

/** Chip border colours used on player ratings, including senior copper. */
export type RatingLevelBand = 'copper' | 'bronze' | 'silver' | 'gold'

export const RATING_CHIP_COPPER_CUTOFF = 560
export const U19_BRONZE_CUTOFF = 600
export const U19_SILVER_CUTOFF = 650

export const U19_RATING_DISCIPLINES = ['singles', 'doubles', 'mixed'] as const
export type U19RatingDiscipline = (typeof U19_RATING_DISCIPLINES)[number]

const DISCIPLINE_LABELS: Record<U19RatingDiscipline, string> = {
  singles: 'Singles',
  doubles: 'Doubles',
  mixed: 'Mixed',
}

const BAND_LABELS: Record<U19CircuitBand, string> = {
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
}

/** Players above the cut-off cannot enter that circuit. */
export function u19CircuitBandForRating(rating: number): U19CircuitBand {
  if (rating <= U19_BRONZE_CUTOFF) return 'bronze'
  if (rating <= U19_SILVER_CUTOFF) return 'silver'
  return 'gold'
}

/** Inner border colour for rating chips, including copper on senior ratings. */
export function ratingChipBandForRating(rating: number): RatingLevelBand {
  if (rating <= RATING_CHIP_COPPER_CUTOFF) return 'copper'
  if (rating <= U19_BRONZE_CUTOFF) return 'bronze'
  if (rating <= U19_SILVER_CUTOFF) return 'silver'
  return 'gold'
}

export function u19CircuitBandLabel(band: U19CircuitBand): string {
  return BAND_LABELS[band]
}

export function u19RatingDisciplineLabel(discipline: U19RatingDiscipline): string {
  return DISCIPLINE_LABELS[discipline]
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const RATING_MIN = 500
const RATING_SPAN = 301

function ratingFromHash(hash: number, shift: number): number {
  return RATING_MIN + ((hash >>> shift) % RATING_SPAN)
}

/**
 * Prototype stand-in for live BE ratings (singles, doubles, mixed).
 * Stable for a given name so chips do not flicker between renders.
 */
export function prototypeDisciplineRatings(
  opponentName: string,
): [number, number, number] {
  const hash = hashString(opponentName.trim().toLowerCase())
  return [ratingFromHash(hash, 0), ratingFromHash(hash, 8), ratingFromHash(hash, 16)]
}

/** Unique matches in history where this person appears as an opponent. */
export function countMeetingsByOpponentName(
  matches: NormalizedMatch[],
): Map<string, number> {
  const seenKeysByOpponent = new Map<string, Set<string>>()

  for (const match of matches) {
    const matchKey = recapMatchKey(match)
    for (const member of getOpponentTeamMembers(match)) {
      const nameKey = member.name.trim().toLowerCase()
      if (nameKey === '') continue
      let keys = seenKeysByOpponent.get(nameKey)
      if (keys == null) {
        keys = new Set()
        seenKeysByOpponent.set(nameKey, keys)
      }
      keys.add(matchKey)
    }
  }

  const counts = new Map<string, number>()
  for (const [nameKey, keys] of seenKeysByOpponent) {
    counts.set(nameKey, keys.size)
  }
  return counts
}

export function formatOpponentNotesLabel(noteCount: number): string {
  return `${noteCount} note${noteCount === 1 ? '' : 's'}`
}

export function formatOpponentMeetingsLabel(meetings: number): string | null {
  if (meetings <= 0) return null
  return meetings === 1 ? 'Played 1 time' : `Played ${meetings} times`
}

export function formatOpponentGroupMeta(noteCount: number, meetings: number): string {
  const notes = formatOpponentNotesLabel(noteCount)
  const played = formatOpponentMeetingsLabel(meetings)
  return played == null ? notes : `${notes} · ${played}`
}
