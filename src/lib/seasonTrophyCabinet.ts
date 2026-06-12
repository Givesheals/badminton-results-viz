import { isCompetitiveMatch } from './matchExclusions'
import type { SeasonBounds } from './season'
import { filterMatchesInSeason } from './season'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestStageFromMatchesForAchievements,
  lostInSemiFinal,
  STAGE_RANK,
  tournamentKey,
  wonBronzeFinal,
  type ProgressionStage,
} from './tournamentProgression'

export type TrophyPlacement = 'first' | 'second' | 'third'

export type SeasonTrophyItem = {
  placement: TrophyPlacement
  placementLabel: string
  tournamentCategoryLabel: string
  discipline: string
  disciplineLabel: string
  competitionName: string
  date: string
  contextNote?: string
}

export type SeasonTrophyCabinetData = {
  first: SeasonTrophyItem[]
  second: SeasonTrophyItem[]
  third: SeasonTrophyItem[]
  totalCount: number
}

const PLACEMENT_LABELS: Record<TrophyPlacement, string> = {
  first: 'Winner',
  second: 'Runner-up',
  third: '3rd place',
}

type EventBucket = {
  key: string
  competitionName: string
  discipline: string
  disciplineLabel: string
  categoryLabel: string
  date: string
  matches: NormalizedMatch[]
}

function ordinalFinish(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

export function placementFromBestStage(
  matches: NormalizedMatch[],
  bestStage: ProgressionStage,
): TrophyPlacement | null {
  if (bestStage === 'winner') return 'first'
  if (bestStage === 'runner-up') return 'second'
  if (bestStage === 'semi-final') {
    if (lostInSemiFinal(matches)) return 'third'
    if (wonBronzeFinal(matches)) return 'third'
    return null
  }
  return null
}

function buildEventBuckets(matches: NormalizedMatch[]): EventBucket[] {
  const byKey = new Map<string, NormalizedMatch[]>()

  for (const match of matches) {
    if (!isCompetitiveMatch(match)) continue
    const key = tournamentKey(match)
    const bucket = byKey.get(key) ?? []
    bucket.push(match)
    byKey.set(key, bucket)
  }

  return [...byKey.entries()].map(([key, eventMatches]) => {
    const sample = eventMatches[0]!
    const date = eventMatches.reduce(
      (max, m) => (m.date > max ? m.date : max),
      eventMatches[0]?.date ?? '',
    )

    return {
      key,
      competitionName: sample.competitionName,
      discipline: sample.discipline,
      disciplineLabel: sample.disciplineLabel,
      categoryLabel: sample.tournamentCategoryLabel,
      date,
      matches: eventMatches,
    }
  })
}

function countPriorFinishesAtStage(
  priorEvents: EventBucket[],
  categoryLabel: string,
  discipline: string | null,
  stage: ProgressionStage,
): number {
  let count = 0

  for (const event of priorEvents) {
    if (event.categoryLabel !== categoryLabel) continue
    if (discipline != null && event.discipline !== discipline) continue
    const best = bestStageFromMatchesForAchievements(event.matches)
    if (best == null) continue
    if (best === stage) count += 1
  }

  return count
}

function priorMaxStageRank(
  priorEvents: EventBucket[],
  categoryLabel: string,
  discipline: string,
): number {
  let maxRank = 0

  for (const event of priorEvents) {
    if (event.categoryLabel !== categoryLabel) continue
    if (event.discipline !== discipline) continue
    const best = bestStageFromMatchesForAchievements(event.matches)
    if (best == null) continue
    maxRank = Math.max(maxRank, STAGE_RANK[best])
  }

  return maxRank
}

function buildContextNote(
  placement: TrophyPlacement,
  event: EventBucket,
  priorEvents: EventBucket[],
): string | undefined {
  const { categoryLabel, discipline, disciplineLabel } = event

  if (placement === 'first') {
    const priorWinsInDiscipline = countPriorFinishesAtStage(
      priorEvents,
      categoryLabel,
      discipline,
      'winner',
    )
    const priorWinsInCategory = countPriorFinishesAtStage(
      priorEvents,
      categoryLabel,
      null,
      'winner',
    )
    const winNumber = priorWinsInDiscipline + 1

    if (priorWinsInCategory === 0) {
      return `Your first ${categoryLabel} title`
    }
    if (priorWinsInDiscipline === 0) {
      return `Your first ${categoryLabel} ${disciplineLabel} title`
    }
    return `Your ${ordinalFinish(winNumber)} ${categoryLabel} title`
  }

  if (placement === 'second') {
    const priorMax = priorMaxStageRank(priorEvents, categoryLabel, discipline)
    if (priorMax < STAGE_RANK['runner-up']) {
      return `Your first ${categoryLabel} runner-up finish`
    }
    return undefined
  }

  const priorMax = priorMaxStageRank(priorEvents, categoryLabel, discipline)
  if (priorMax < STAGE_RANK['semi-final']) {
    return `Your first ${categoryLabel} semi-final finish`
  }
  return undefined
}

function compareEvents(a: EventBucket, b: EventBucket): number {
  const byDate = a.date.localeCompare(b.date)
  if (byDate !== 0) return byDate
  return a.key.localeCompare(b.key)
}

export function computeSeasonTrophyCabinet(
  allMatches: NormalizedMatch[],
  bounds: SeasonBounds,
): SeasonTrophyCabinetData {
  const seasonMatches = filterMatchesInSeason(allMatches, bounds)
  const allEvents = buildEventBuckets(allMatches).sort(compareEvents)
  const seasonEvents = buildEventBuckets(seasonMatches).sort(compareEvents)

  const first: SeasonTrophyItem[] = []
  const second: SeasonTrophyItem[] = []
  const third: SeasonTrophyItem[] = []

  for (const event of seasonEvents) {
    const bestStage = bestStageFromMatchesForAchievements(event.matches)
    if (bestStage == null) continue

    const placement = placementFromBestStage(event.matches, bestStage)
    if (placement == null) continue

    const priorEvents = allEvents.filter(
      (e) => e.date < event.date || (e.date === event.date && e.key < event.key),
    )

    const item: SeasonTrophyItem = {
      placement,
      placementLabel: PLACEMENT_LABELS[placement],
      tournamentCategoryLabel: event.categoryLabel,
      discipline: event.discipline,
      disciplineLabel: event.disciplineLabel,
      competitionName: event.competitionName,
      date: event.date,
      contextNote: buildContextNote(placement, event, priorEvents),
    }

    if (placement === 'first') first.push(item)
    else if (placement === 'second') second.push(item)
    else third.push(item)
  }

  return {
    first,
    second,
    third,
    totalCount: first.length + second.length + third.length,
  }
}
