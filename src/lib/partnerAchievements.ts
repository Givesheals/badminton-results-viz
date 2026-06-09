import type { DisciplineFamily } from './disciplineStyle'
import { getDisciplineFamily } from './disciplineStyle'
import { formatTournamentCategory } from './tournamentCategory'
import type { FilterOption } from '../types/filters'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestStageFromMatchesForAchievements,
  describeTypicalRank,
  isCountyTournament,
  isProgressionTournament,
  medianRank,
  PROGRESSION_STAGE_CHIP_ORDER,
  PROGRESSION_STAGE_LABELS,
  STAGE_RANK,
  tournamentKey,
  type ProgressionStage,
} from './tournamentProgression'

export type PartnerAchievementRow = {
  partnerName: string
  eventCount: number
  stageCounts: Partial<Record<ProgressionStage, number>>
  typicalRank: number | null
  typicalLabel: string | null
  maxStageRank: number
  highlightScore: number
  podiumCount: number
}

export type PartnerAchievementsFamily = {
  partners: PartnerAchievementRow[]
  totalPartnerCount: number
}

export type PartnerAchievementsResult = {
  doubles: PartnerAchievementsFamily
  mixed: PartnerAchievementsFamily
}

const HIGHLIGHT_FAMILIES: DisciplineFamily[] = ['doubles', 'mixed']

const PEAK_DEPTH_WEIGHT = 0.35
const TYPICAL_DEPTH_WEIGHT = 0.65
const DEPTH_SCORE_DIVISOR = 7

type EventAccumulator = {
  matches: NormalizedMatch[]
}

type PartnerAccumulator = {
  partnerName: string
  events: Map<string, EventAccumulator>
}

function familyForMatch(match: NormalizedMatch): DisciplineFamily | null {
  const family = getDisciplineFamily(match.discipline)
  return HIGHLIGHT_FAMILIES.includes(family) ? family : null
}

function roundHighlightScore(value: number): number {
  return Math.round(value * 100) / 100
}

/** Composite rank for partner highlight cards: volume (log) × depth (peak + typical). */
export function computePartnerHighlightScore(
  eventCount: number,
  maxStageRank: number,
  typicalRank: number | null,
): number {
  const typical = typicalRank ?? 1
  const depthScore =
    PEAK_DEPTH_WEIGHT * maxStageRank + TYPICAL_DEPTH_WEIGHT * typical
  const raw = Math.log1p(eventCount) * (1 + depthScore / DEPTH_SCORE_DIVISOR)
  return roundHighlightScore(raw)
}

function chipCountsFromEvents(
  events: Map<string, EventAccumulator>,
): Partial<Record<ProgressionStage, number>> {
  const counts: Partial<Record<ProgressionStage, number>> = {}

  for (const { matches } of events.values()) {
    const best = bestStageFromMatchesForAchievements(matches)
    if (best == null) continue
    counts[best] = (counts[best] ?? 0) + 1
  }

  return counts
}

function buildPartnerRow(acc: PartnerAccumulator): PartnerAchievementRow | null {
  const progressionEvents = [...acc.events.entries()].filter(([, { matches }]) => {
    if (matches.some(isCountyTournament)) return false
    return isProgressionTournament(matches)
  })

  if (progressionEvents.length === 0) return null

  const eventMap = new Map(progressionEvents)
  const stageCounts = chipCountsFromEvents(eventMap)
  const eventRanks: number[] = []

  for (const [, { matches }] of progressionEvents) {
    const best = bestStageFromMatchesForAchievements(matches)
    if (best == null) continue
    eventRanks.push(STAGE_RANK[best])
  }

  const typicalRank = medianRank(eventRanks)
  const maxStageRank = eventRanks.length > 0 ? Math.max(...eventRanks) : 1
  const winnerCount = stageCounts.winner ?? 0
  const runnerUpCount = stageCounts['runner-up'] ?? 0

  return {
    partnerName: acc.partnerName,
    eventCount: progressionEvents.length,
    stageCounts,
    typicalRank,
    typicalLabel: typicalRank != null ? describeTypicalRank(typicalRank) : null,
    maxStageRank,
    highlightScore: computePartnerHighlightScore(
      progressionEvents.length,
      maxStageRank,
      typicalRank,
    ),
    podiumCount: winnerCount + runnerUpCount,
  }
}

function comparePartnerRows(a: PartnerAchievementRow, b: PartnerAchievementRow): number {
  if (b.highlightScore !== a.highlightScore) return b.highlightScore - a.highlightScore
  if (b.podiumCount !== a.podiumCount) return b.podiumCount - a.podiumCount
  if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount
  return a.partnerName.localeCompare(b.partnerName)
}

function computeFamily(
  byPartner: Map<string, PartnerAccumulator>,
): PartnerAchievementsFamily {
  const rows: PartnerAchievementRow[] = []

  for (const acc of byPartner.values()) {
    const row = buildPartnerRow(acc)
    if (row != null) rows.push(row)
  }

  rows.sort(comparePartnerRows)

  return {
    partners: rows,
    totalPartnerCount: rows.length,
  }
}

export function computePartnerAchievements(
  matches: NormalizedMatch[],
): PartnerAchievementsResult {
  const byFamily = new Map<DisciplineFamily, Map<string, PartnerAccumulator>>()
  for (const family of HIGHLIGHT_FAMILIES) {
    byFamily.set(family, new Map())
  }

  for (const match of matches) {
    if (match.partnerName == null) continue
    const family = familyForMatch(match)
    if (family == null) continue

    const partners = byFamily.get(family)!
    let acc = partners.get(match.partnerName)
    if (!acc) {
      acc = { partnerName: match.partnerName, events: new Map() }
      partners.set(match.partnerName, acc)
    }

    const eventKey = tournamentKey(match)
    let event = acc.events.get(eventKey)
    if (!event) {
      event = { matches: [] }
      acc.events.set(eventKey, event)
    }
    event.matches.push(match)
  }

  return {
    doubles: computeFamily(byFamily.get('doubles')!),
    mixed: computeFamily(byFamily.get('mixed')!),
  }
}

/** Partners with at least one non-county progression event (same pool as highlight cards). */
export function partnerFilterOptions(family: PartnerAchievementsFamily): FilterOption[] {
  return family.partners.map((row) => ({
    value: row.partnerName,
    label: row.partnerName,
  }))
}

/** Competition categories present in the given matches (for per-family filters). */
export function partnerCompetitionFilterOptions(
  matches: NormalizedMatch[],
): FilterOption[] {
  const competitionMap = new Map<string, string>()
  for (const match of matches) {
    const { value, label } = formatTournamentCategory(match.raw['Tournament Category'])
    competitionMap.set(value, label)
  }
  return [...competitionMap.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

export function formatStageChip(stage: ProgressionStage, count: number): string {
  const label = PROGRESSION_STAGE_LABELS[stage]
  return `${count}× ${label}`
}

export { PROGRESSION_STAGE_CHIP_ORDER }
