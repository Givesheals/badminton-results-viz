import { compareCompetitionAgeOldestFirst } from './competitionAge'
import { isCompetitiveMatch } from './matchExclusions'
import {
  competitionAgeLabelFromMatch,
} from './tournamentProgression'
import type { NormalizedMatch } from '../types/matchHistory'
import { buildSeasonRatingSeries, type SeasonRatingSeries } from './seasonRatings'
import {
  filterMatchesInSeason,
  formatSeasonRangeSubtitle,
  formatSeasonTitle,
  getSeasonBounds,
  getSeasonForReferenceDate,
  getSeasonQuarterPhase,
  listSeasonQuarters,
  seasonQuarterKeyForDate,
  type SeasonBounds,
  type SeasonQuarterPhase,
} from './season'
import {
  computeSeasonAccolades,
  type SeasonAccoladesData,
} from './seasonTrophyCabinet'
import { computeCountySeason, type CountySeasonData } from './countySeason'

export const QUARTER_TOURNAMENT_THRESHOLD = 4
export const QUARTER_ACHIEVEMENT_ID = 'quarter-on-board'

export type SeasonQuarterDisplayState =
  | 'future'
  | 'in_progress'
  | 'ready_to_claim'
  | 'claimed'
  /** Past quarter that ended below the tournament threshold — shown with neutral, positive copy. */
  | 'closed'

export type SeasonQuarterJourney = {
  key: string
  label: string
  shortLabel: string
  startDate: string
  endDate: string
  phase: SeasonQuarterPhase
  tournamentCount: number
  threshold: number
  displayState: SeasonQuarterDisplayState
  claimMessage: string
  closedMessage: string
}

export type SeasonJourneyData = {
  seasonId: string
  bounds: SeasonBounds
  title: string
  rangeSubtitle: string
  matchCount: number
  playSummary: SeasonPlaySummaryEntry[]
  quarters: SeasonQuarterJourney[]
  ratingSeries: SeasonRatingSeries[]
  accolades: SeasonAccoladesData
  countySeason: CountySeasonData | null
  seasonStartMs: number
  seasonEndMs: number
}

const TOURNAMENT_LEVEL_PRIORITY = new Map([
  ['copper', 0],
  ['bronze', 1],
  ['silver', 2],
  ['gold', 3],
  ['other', 4],
])

function parseSeasonMs(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00`).getTime()
}

function tournamentLevelSortRank(label: string): number {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'county') return Number.POSITIVE_INFINITY
  return TOURNAMENT_LEVEL_PRIORITY.get(normalized) ?? 4
}

function tournamentsByQuarter(
  seasonMatches: NormalizedMatch[],
  seasonId: string,
): Map<string, Set<string>> {
  const map = new Map<string, Set<string>>()

  for (const match of seasonMatches) {
    if (!isCompetitiveMatch(match)) continue
    const qKey = seasonQuarterKeyForDate(match.date, seasonId)
    if (!qKey) continue
    const set = map.get(qKey) ?? new Set<string>()
    set.add(match.competitionName)
    map.set(qKey, set)
  }

  return map
}

type PlaySummaryBucket = {
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
  count: number
}

export type SeasonPlaySummaryEntry = PlaySummaryBucket

export function seasonPlaySummaryEntryKey(
  entry: Pick<SeasonPlaySummaryEntry, 'tournamentCategoryLabel' | 'competitionAgeLabel'>,
): string {
  return `${entry.tournamentCategoryLabel}\0${entry.competitionAgeLabel ?? ''}`
}

function comparePlaySummaryBuckets(a: PlaySummaryBucket, b: PlaySummaryBucket): number {
  const ageCompare = compareCompetitionAgeOldestFirst(
    a.competitionAgeLabel,
    b.competitionAgeLabel,
  )
  if (ageCompare !== 0) return ageCompare

  const levelRankA = tournamentLevelSortRank(a.tournamentCategoryLabel)
  const levelRankB = tournamentLevelSortRank(b.tournamentCategoryLabel)
  if (levelRankA !== levelRankB) return levelRankA - levelRankB

  return a.tournamentCategoryLabel.localeCompare(b.tournamentCategoryLabel)
}

export function computeSeasonPlaySummary(
  seasonMatches: NormalizedMatch[],
): SeasonPlaySummaryEntry[] {
  const competitive = seasonMatches.filter(isCompetitiveMatch)
  if (competitive.length === 0) return []

  const byCompetition = new Map<string, NormalizedMatch[]>()
  for (const match of competitive) {
    const bucket = byCompetition.get(match.competitionName) ?? []
    bucket.push(match)
    byCompetition.set(match.competitionName, bucket)
  }

  const comboCounts = new Map<string, PlaySummaryBucket>()

  for (const eventMatches of byCompetition.values()) {
    const sorted = [...eventMatches].sort((a, b) => a.date.localeCompare(b.date))
    const sample = sorted[0]!
    const tournamentCategoryLabel = sample.tournamentCategoryLabel
    const competitionAgeLabel = competitionAgeLabelFromMatch(sample)
    const comboKey = `${tournamentCategoryLabel}\0${competitionAgeLabel ?? ''}`

    const existing = comboCounts.get(comboKey)
    if (existing) {
      existing.count += 1
    } else {
      comboCounts.set(comboKey, {
        tournamentCategoryLabel,
        competitionAgeLabel,
        count: 1,
      })
    }
  }

  return [...comboCounts.values()].sort(comparePlaySummaryBuckets)
}

export function resolveQuarterDisplayState(
  phase: SeasonQuarterPhase,
  tournamentCount: number,
  threshold: number,
  isClaimed: boolean,
): SeasonQuarterDisplayState {
  if (phase === 'future') return 'future'
  if (isClaimed && tournamentCount >= threshold) return 'claimed'
  if (tournamentCount >= threshold) return 'ready_to_claim'
  if (phase === 'past') return 'closed'
  return 'in_progress'
}

export function formatClaimQuarterMessage(
  tournamentCount: number,
  threshold: number,
  shortLabel: string,
): string {
  const events =
    tournamentCount === 1 ? '1 tournament' : `${tournamentCount} tournaments`
  if (tournamentCount > threshold) {
    return `${shortLabel} crushed — ${events} competed, beating your ${threshold}-event goal. What a run — keep that energy going!`
  }
  return `${shortLabel} goal achieved — ${events} on the board this quarter. Brilliant work — bring it into the next stretch!`
}

export function formatClosedQuarterMessage(tournamentCount: number): string {
  if (tournamentCount === 0) {
    return 'This quarter is in the books — a fresh start awaits.'
  }
  const label = tournamentCount === 1 ? 'tournament' : 'tournaments'
  return `That's a wrap — ${tournamentCount} ${label} on the board this quarter.`
}

export function computeSeasonJourney(
  matches: NormalizedMatch[],
  referenceDate = new Date(),
  claimedQuarterKeys: ReadonlySet<string> = new Set(),
): SeasonJourneyData {
  const seasonId = getSeasonForReferenceDate(referenceDate)
  const bounds = getSeasonBounds(seasonId)!
  const seasonMatches = filterMatchesInSeason(matches, bounds)
  const competitive = seasonMatches.filter(isCompetitiveMatch)
  const tournamentMap = tournamentsByQuarter(seasonMatches, seasonId)
  const ratingSeries = buildSeasonRatingSeries(matches, bounds, referenceDate)

  const quarters = listSeasonQuarters(seasonId).map((slot) => {
    const tournamentCount = tournamentMap.get(slot.key)?.size ?? 0
    const phase = getSeasonQuarterPhase(slot, referenceDate)
    const isClaimed = claimedQuarterKeys.has(`${slot.key}:${QUARTER_ACHIEVEMENT_ID}`)
    const displayState = resolveQuarterDisplayState(
      phase,
      tournamentCount,
      QUARTER_TOURNAMENT_THRESHOLD,
      isClaimed,
    )

    return {
      key: slot.key,
      label: slot.label,
      shortLabel: slot.shortLabel,
      startDate: slot.startDate,
      endDate: slot.endDate,
      phase,
      tournamentCount,
      threshold: QUARTER_TOURNAMENT_THRESHOLD,
      displayState,
      claimMessage: formatClaimQuarterMessage(
        tournamentCount,
        QUARTER_TOURNAMENT_THRESHOLD,
        slot.shortLabel,
      ),
      closedMessage: formatClosedQuarterMessage(tournamentCount),
    }
  })

  return {
    seasonId,
    bounds,
    title: formatSeasonTitle(seasonId),
    rangeSubtitle: formatSeasonRangeSubtitle(bounds),
    matchCount: competitive.length,
    playSummary: computeSeasonPlaySummary(seasonMatches),
    quarters,
    ratingSeries,
    accolades: computeSeasonAccolades(matches, bounds),
    countySeason: computeCountySeason(seasonMatches, seasonId),
    seasonStartMs: parseSeasonMs(bounds.startDate),
    seasonEndMs: parseSeasonMs(bounds.endDate),
  }
}

export function quarterClaimStorageKey(
  playerName: string | null,
  seasonId: string,
): string {
  const slug = (playerName ?? 'player').trim().toLowerCase().replace(/\s+/g, '-') || 'player'
  return `badminton-season-claims:v1:${slug}:${seasonId}`
}
