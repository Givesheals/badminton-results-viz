import type { DisciplineFamily } from './disciplineStyle'
import { getDisciplineFamily } from './disciplineStyle'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestStageFromMatchesForAchievements,
  formatMatchStageLabel,
  getMatchRound,
  isCountyTournament,
  isProgressionTournament,
  PROGRESSION_STAGE_CHIP_ORDER,
  PROGRESSION_STAGE_LABELS,
  STAGE_RANK,
  stageFromMatchForAchievements,
  tournamentKey,
  type ProgressionStage,
} from './tournamentProgression'

export type PartnerTournamentMatchRow = {
  match: NormalizedMatch
  stageLabel: string | null
  stageRank: number
}

export type PartnerTournamentEvent = {
  key: string
  competitionName: string
  /** Latest match date in the event (for sorting within a stage). */
  sortDate: string
  bestStage: ProgressionStage
  bestStageRank: number
  matches: PartnerTournamentMatchRow[]
}

export type PartnerTournamentStageGroup = {
  stage: ProgressionStage
  label: string
  tournaments: PartnerTournamentEvent[]
}

export const INITIAL_TOURNAMENTS_PER_STAGE = 8

export function matchesForDisciplineFamily(
  matches: NormalizedMatch[],
  family: DisciplineFamily,
): NormalizedMatch[] {
  return matches.filter((match) => {
    const matchFamily = getDisciplineFamily(match.discipline)
    return matchFamily === family
  })
}

function matchStageRank(match: NormalizedMatch): number {
  const stage = stageFromMatchForAchievements(match)
  return stage != null ? STAGE_RANK[stage] : 0
}

function compareMatchRows(a: PartnerTournamentMatchRow, b: PartnerTournamentMatchRow): number {
  if (b.stageRank !== a.stageRank) return b.stageRank - a.stageRank
  return b.match.date.localeCompare(a.match.date)
}

function compareTournamentEvents(a: PartnerTournamentEvent, b: PartnerTournamentEvent): number {
  return b.sortDate.localeCompare(a.sortDate)
}

export function buildPartnerTournamentHistory(
  matches: NormalizedMatch[],
  partnerName: string,
  family: DisciplineFamily,
): PartnerTournamentStageGroup[] {
  const partnerMatches = matchesForDisciplineFamily(matches, family).filter(
    (match) => match.partnerName === partnerName,
  )

  const byEvent = new Map<string, NormalizedMatch[]>()
  for (const match of partnerMatches) {
    const key = tournamentKey(match)
    const bucket = byEvent.get(key) ?? []
    bucket.push(match)
    byEvent.set(key, bucket)
  }

  const byStage = new Map<ProgressionStage, PartnerTournamentEvent[]>()

  for (const [key, eventMatches] of byEvent) {
    if (eventMatches.some(isCountyTournament)) continue
    if (!isProgressionTournament(eventMatches)) continue

    const bestStage = bestStageFromMatchesForAchievements(eventMatches)
    if (bestStage == null) continue

    const matchRows: PartnerTournamentMatchRow[] = eventMatches.map((match) => ({
      match,
      stageLabel: formatMatchStageLabel(getMatchRound(match)),
      stageRank: matchStageRank(match),
    }))
    matchRows.sort(compareMatchRows)

    const sortDate = eventMatches.reduce(
      (latest, match) => (match.date > latest ? match.date : latest),
      eventMatches[0]!.date,
    )

    const event: PartnerTournamentEvent = {
      key,
      competitionName: eventMatches[0]!.competitionName,
      sortDate,
      bestStage,
      bestStageRank: STAGE_RANK[bestStage],
      matches: matchRows,
    }

    const stageBucket = byStage.get(bestStage) ?? []
    stageBucket.push(event)
    byStage.set(bestStage, stageBucket)
  }

  const groups: PartnerTournamentStageGroup[] = []

  for (const stage of PROGRESSION_STAGE_CHIP_ORDER) {
    const tournaments = byStage.get(stage)
    if (tournaments == null || tournaments.length === 0) continue
    tournaments.sort(compareTournamentEvents)
    groups.push({
      stage,
      label: PROGRESSION_STAGE_LABELS[stage],
      tournaments,
    })
  }

  return groups
}

export function countPartnerTournamentEvents(groups: PartnerTournamentStageGroup[]): number {
  return groups.reduce((sum, group) => sum + group.tournaments.length, 0)
}

/** How far nested accordions open when a partner card is first expanded. */
export type PartnerHistoryAutoExpand = 'none' | 'stages' | 'full'

/**
 * - `full`: one event total — expand stage and tournament (show matches).
 * - `stages`: multiple events, single stage — expand stage only.
 * - `none`: multiple stages — no nested auto-expand.
 */
export function partnerHistoryAutoExpandLevel(
  groups: PartnerTournamentStageGroup[],
): PartnerHistoryAutoExpand {
  const eventCount = countPartnerTournamentEvents(groups)
  if (eventCount <= 1) return eventCount === 1 ? 'full' : 'none'
  if (groups.length === 1) return 'stages'
  return 'none'
}
