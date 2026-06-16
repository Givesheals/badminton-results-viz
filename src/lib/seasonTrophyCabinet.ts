import { isCompetitiveMatch } from './matchExclusions'
import type { SeasonBounds } from './season'
import { filterMatchesInSeason } from './season'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestStageFromMatchesForAchievements,
  competitionAgeLabelFromMatch,
  earnedKnockoutOrBetterDepth,
  eventHasCompetitiveWin,
  formatCategoryAgeLabel,
  hasGroupMatchWins,
  isProgressionTournament,
  isSeniorCountyMatch,
  qualifiesForThirdPlace,
  PROGRESSION_STAGE_LABELS,
  SENIOR_COUNTY_DEBUT_DETAIL,
  SENIOR_COUNTY_DEBUT_TITLE,
  STAGE_RANK,
  tournamentKey,
  type ProgressionStage,
} from './tournamentProgression'

export type TrophyPlacement = 'first' | 'second' | 'third'

export type SeasonTrophyItem = {
  placement: TrophyPlacement
  placementLabel: string
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
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

export type SeasonPersonalBestItem = {
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
  discipline: string
  disciplineLabel: string
  competitionName: string
  date: string
  stage: ProgressionStage
  stageLabel: string
  detail: string
}

export type SeasonSeniorCountyDebutItem = {
  competitionName: string
  date: string
  title: string
  detail: string
}

export type SeasonAccoladesData = {
  podium: {
    first: SeasonTrophyItem[]
    second: SeasonTrophyItem[]
    third: SeasonTrophyItem[]
  }
  personalBests: SeasonPersonalBestItem[]
  /** First-ever senior county appearance when it happened this season. */
  seniorCountyDebut: SeasonSeniorCountyDebutItem | null
  totalPodiumCount: number
}

export const SEASON_PERSONAL_BEST_CAP = 6

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
  ageLabel: string | null
  date: string
  matches: NormalizedMatch[]
}

function eventBucketKey(match: NormalizedMatch): string {
  const ageLabel = competitionAgeLabelFromMatch(match) ?? ''
  return `${tournamentKey(match)}\0${ageLabel}`
}

function normalizeAgeLabel(label: string | null | undefined): string {
  return label ?? ''
}

function eventMatchesScope(
  event: EventBucket,
  categoryLabel: string,
  discipline: string | null,
  ageLabel: string | null,
): boolean {
  if (event.categoryLabel !== categoryLabel) return false
  if (discipline != null && event.discipline !== discipline) return false
  if (normalizeAgeLabel(event.ageLabel) !== normalizeAgeLabel(ageLabel)) return false
  return true
}

function categoryAgeLabel(categoryLabel: string, ageLabel: string | null): string {
  return formatCategoryAgeLabel(categoryLabel, ageLabel)
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
  if (qualifiesForThirdPlace(matches, bestStage)) return 'third'
  return null
}

function buildEventBuckets(matches: NormalizedMatch[]): EventBucket[] {
  const byKey = new Map<string, NormalizedMatch[]>()

  for (const match of matches) {
    if (!isCompetitiveMatch(match)) continue
    const key = eventBucketKey(match)
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
      ageLabel: competitionAgeLabelFromMatch(sample),
      date,
      matches: eventMatches,
    }
  })
}

function countPriorFinishesAtStage(
  priorEvents: EventBucket[],
  categoryLabel: string,
  discipline: string | null,
  ageLabel: string | null,
  stage: ProgressionStage,
): number {
  let count = 0

  for (const event of priorEvents) {
    if (!eventMatchesScope(event, categoryLabel, discipline, ageLabel)) continue
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
  ageLabel: string | null,
): number {
  let maxRank = 0

  for (const event of priorEvents) {
    if (!eventMatchesScope(event, categoryLabel, discipline, ageLabel)) continue
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
  const { categoryLabel, discipline, disciplineLabel, ageLabel } = event
  const scopedCategoryLabel = categoryAgeLabel(categoryLabel, ageLabel)

  if (placement === 'first') {
    const priorWinsInDiscipline = countPriorFinishesAtStage(
      priorEvents,
      categoryLabel,
      discipline,
      ageLabel,
      'winner',
    )
    const priorWinsInCategory = countPriorFinishesAtStage(
      priorEvents,
      categoryLabel,
      null,
      ageLabel,
      'winner',
    )
    const winNumber = priorWinsInDiscipline + 1

    if (priorWinsInCategory === 0) {
      return `Your first ${scopedCategoryLabel} title`
    }
    if (priorWinsInDiscipline === 0) {
      return `Your first ${scopedCategoryLabel} ${disciplineLabel} title`
    }
    return `Your ${ordinalFinish(winNumber)} ${scopedCategoryLabel} title`
  }

  if (placement === 'second') {
    const priorMax = priorMaxStageRank(priorEvents, categoryLabel, discipline, ageLabel)
    if (priorMax < STAGE_RANK['runner-up']) {
      return `Your first ${scopedCategoryLabel} runner-up finish`
    }
    return undefined
  }

  const priorMax = priorMaxStageRank(priorEvents, categoryLabel, discipline, ageLabel)
  if (priorMax < STAGE_RANK['semi-final']) {
    return `Your first ${scopedCategoryLabel} semi-final finish`
  }
  return undefined
}

function compareEvents(a: EventBucket, b: EventBucket): number {
  const byDate = a.date.localeCompare(b.date)
  if (byDate !== 0) return byDate
  return a.key.localeCompare(b.key)
}

function effectiveStageRank(
  bestStage: ProgressionStage,
  disciplineMatches: NormalizedMatch[],
): number {
  const rank = STAGE_RANK[bestStage]
  if (hasGroupMatchWins(disciplineMatches) && rank < STAGE_RANK['group-wins']) {
    return STAGE_RANK['group-wins']
  }
  return rank
}

function canCelebratePersonalBest(
  disciplineMatches: NormalizedMatch[],
  bestStage: ProgressionStage,
  currentRank: number,
  priorMax: number,
): boolean {
  if (currentRank <= priorMax) return false
  if (!eventHasCompetitiveWin(disciplineMatches)) return false

  if (bestStage === 'group-wins' || bestStage === 'group-stages') {
    return hasGroupMatchWins(disciplineMatches)
  }

  if (STAGE_RANK[bestStage] >= STAGE_RANK['knockout']) {
    return earnedKnockoutOrBetterDepth(disciplineMatches, bestStage, bestStage)
  }

  return true
}

function hasPriorCategoryDisciplineEvent(
  priorEvents: EventBucket[],
  categoryLabel: string,
  discipline: string,
  ageLabel: string | null,
): boolean {
  return priorEvents.some((e) =>
    eventMatchesScope(e, categoryLabel, discipline, ageLabel),
  )
}

function buildPersonalBestDetail(
  categoryLabel: string,
  ageLabel: string | null,
  disciplineLabel: string,
  stageLabel: string,
): string {
  const scopedCategoryLabel = categoryAgeLabel(categoryLabel, ageLabel)
  return `Your deepest ${scopedCategoryLabel} ${disciplineLabel} run — ${stageLabel}`
}

export function computeSeasonPersonalBests(
  allMatches: NormalizedMatch[],
  bounds: SeasonBounds,
): SeasonPersonalBestItem[] {
  const seasonMatches = filterMatchesInSeason(allMatches, bounds)
  const allEvents = buildEventBuckets(allMatches).sort(compareEvents)
  const seasonEvents = buildEventBuckets(seasonMatches).sort(compareEvents)
  const items: SeasonPersonalBestItem[] = []

  for (const event of seasonEvents) {
    if (event.categoryLabel === 'Other') continue

    const bestStage = bestStageFromMatchesForAchievements(event.matches)
    if (bestStage == null) continue

    const placement = placementFromBestStage(event.matches, bestStage)
    if (placement != null) continue

    if (!isProgressionTournament(event.matches)) continue

    const priorEvents = allEvents.filter(
      (e) => e.date < event.date || (e.date === event.date && e.key < event.key),
    )

    if (
      !hasPriorCategoryDisciplineEvent(
        priorEvents,
        event.categoryLabel,
        event.discipline,
        event.ageLabel,
      )
    ) {
      continue
    }

    const priorMax = priorMaxStageRank(
      priorEvents,
      event.categoryLabel,
      event.discipline,
      event.ageLabel,
    )
    const currentRank = effectiveStageRank(bestStage, event.matches)

    if (
      !canCelebratePersonalBest(event.matches, bestStage, currentRank, priorMax)
    ) {
      continue
    }

    const stageLabel = PROGRESSION_STAGE_LABELS[bestStage]
    items.push({
      tournamentCategoryLabel: event.categoryLabel,
      competitionAgeLabel: event.ageLabel,
      discipline: event.discipline,
      disciplineLabel: event.disciplineLabel,
      competitionName: event.competitionName,
      date: event.date,
      stage: bestStage,
      stageLabel,
      detail: buildPersonalBestDetail(
        event.categoryLabel,
        event.ageLabel,
        event.disciplineLabel,
        stageLabel,
      ),
    })
  }

  if (items.length <= SEASON_PERSONAL_BEST_CAP) {
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }

  const capped = [...items]
    .sort((a, b) => {
      const byRank = STAGE_RANK[b.stage] - STAGE_RANK[a.stage]
      if (byRank !== 0) return byRank
      return a.date.localeCompare(b.date)
    })
    .slice(0, SEASON_PERSONAL_BEST_CAP)

  return capped.sort((a, b) => a.date.localeCompare(b.date))
}

function firstEverSeniorCountyEvent(
  allMatches: NormalizedMatch[],
): { competitionName: string; date: string } | null {
  const seniorCounty = allMatches
    .filter((m) => isCompetitiveMatch(m) && isSeniorCountyMatch(m))
    .sort((a, b) => a.date.localeCompare(b.date) || a.competitionName.localeCompare(b.competitionName))

  const first = seniorCounty[0]
  if (!first) return null

  return { competitionName: first.competitionName, date: first.date }
}

export function computeSeasonSeniorCountyDebut(
  allMatches: NormalizedMatch[],
  bounds: SeasonBounds,
): SeasonSeniorCountyDebutItem | null {
  const debut = firstEverSeniorCountyEvent(allMatches)
  if (!debut) return null

  const seasonMatches = filterMatchesInSeason(allMatches, bounds)
  const inSeason = seasonMatches.some(
    (m) =>
      isCompetitiveMatch(m) &&
      isSeniorCountyMatch(m) &&
      m.competitionName === debut.competitionName,
  )
  if (!inSeason) return null

  return {
    competitionName: debut.competitionName,
    date: debut.date,
    title: SENIOR_COUNTY_DEBUT_TITLE,
    detail: SENIOR_COUNTY_DEBUT_DETAIL,
  }
}

export function computeSeasonAccolades(
  allMatches: NormalizedMatch[],
  bounds: SeasonBounds,
): SeasonAccoladesData {
  const podium = computeSeasonTrophyCabinet(allMatches, bounds)
  const personalBests = computeSeasonPersonalBests(allMatches, bounds)
  const seniorCountyDebut = computeSeasonSeniorCountyDebut(allMatches, bounds)

  return {
    podium: {
      first: podium.first,
      second: podium.second,
      third: podium.third,
    },
    personalBests,
    seniorCountyDebut,
    totalPodiumCount: podium.totalCount,
  }
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
      competitionAgeLabel: event.ageLabel,
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
