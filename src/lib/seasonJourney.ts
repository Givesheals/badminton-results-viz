import { isCompetitiveMatch } from './matchExclusions'
import {
  bestStageFromMatchesForAchievements,
  PROGRESSION_STAGE_LABELS,
  type ProgressionStage,
} from './tournamentProgression'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  buildSeasonRatingSeries,
  seasonRatingDeltaSinceStart,
  type SeasonRatingSeries,
} from './seasonRatings'
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

export type SeasonWeekendStory = {
  competitionName: string
  date: string
  matchCount: number
  wins: number
  losses: number
  bestStage: ProgressionStage | null
  bestStageLabel: string | null
  /** 0–1 position on season timeline */
  position: number
}

export type SeasonJourneyData = {
  seasonId: string
  bounds: SeasonBounds
  title: string
  rangeSubtitle: string
  weekendCount: number
  matchCount: number
  headline: string | null
  quarters: SeasonQuarterJourney[]
  ratingSeries: SeasonRatingSeries[]
  weekends: SeasonWeekendStory[]
  seasonStartMs: number
  seasonEndMs: number
}

function parseSeasonMs(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00`).getTime()
}

function countDistinctCompetitions(matches: NormalizedMatch[]): number {
  return new Set(matches.map((m) => m.competitionName)).size
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

function buildHeadline(
  seasonMatches: NormalizedMatch[],
  ratingSeries: SeasonRatingSeries[],
): string | null {
  const weekends = countDistinctCompetitions(
    seasonMatches.filter(isCompetitiveMatch),
  )
  const ratingGain = seasonRatingDeltaSinceStart(ratingSeries)

  if (ratingGain && ratingGain.delta > 0) {
    const sign = ratingGain.delta >= 0 ? '+' : ''
    return `${sign}${Math.round(ratingGain.delta)} ${ratingGain.label.toLowerCase()} rating since September`
  }

  if (weekends > 0) {
    const label = weekends === 1 ? 'weekend' : 'weekends'
    return `${weekends} ${label} on the board this season`
  }

  return null
}

function buildWeekendStories(
  seasonMatches: NormalizedMatch[],
  bounds: SeasonBounds,
): SeasonWeekendStory[] {
  const competitive = seasonMatches.filter(isCompetitiveMatch)
  const byCompetition = new Map<string, NormalizedMatch[]>()

  for (const match of competitive) {
    const bucket = byCompetition.get(match.competitionName) ?? []
    bucket.push(match)
    byCompetition.set(match.competitionName, bucket)
  }

  const startMs = parseSeasonMs(bounds.startDate)
  const endMs = parseSeasonMs(bounds.endDate)
  const span = Math.max(endMs - startMs, 1)

  const stories: SeasonWeekendStory[] = [...byCompetition.entries()].map(
    ([competitionName, eventMatches]) => {
      const wins = eventMatches.filter((m) => m.outcome === 'win').length
      const losses = eventMatches.filter((m) => m.outcome === 'loss').length
      const date = eventMatches.reduce(
        (max, m) => (m.date > max ? m.date : max),
        eventMatches[0]?.date ?? '',
      )
      const bestStage = bestStageFromMatchesForAchievements(eventMatches)
      const dateMs = parseSeasonMs(date)
      const position = Math.min(1, Math.max(0, (dateMs - startMs) / span))

      return {
        competitionName,
        date,
        matchCount: eventMatches.length,
        wins,
        losses,
        bestStage,
        bestStageLabel: bestStage ? PROGRESSION_STAGE_LABELS[bestStage] : null,
        position,
      }
    },
  )

  stories.sort((a, b) => a.date.localeCompare(b.date))
  return stories
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
    weekendCount: countDistinctCompetitions(competitive),
    matchCount: competitive.length,
    headline: buildHeadline(seasonMatches, ratingSeries),
    quarters,
    ratingSeries,
    weekends: buildWeekendStories(seasonMatches, bounds),
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
