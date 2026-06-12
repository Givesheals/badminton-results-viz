import type { NormalizedMatch } from '../types/matchHistory'
import {
  compareCompetitionAgeOldestFirst,
  sortCompetitionSubAgeGroups,
} from './competitionAge'
import { competitiveMatches } from './matchExclusions'
import {
  competitionAgeLabelFromMatch,
  formatCategoryAgeLabel,
} from './tournamentProgression'

export const MAX_PIE_SLICES = 8

export type BroadAge = 'junior' | 'senior' | 'masters' | 'other'

export type CategoryAgeMatchVolume = {
  label: string
  tournamentCategoryLabel: string | null
  competitionAgeLabel: string | null
  broadAge: BroadAge | null
  matches: number
  percent: number
  isGrouped: boolean
  includedLabels?: string[]
}

type DetailSlice = {
  ageLabel: string | null
  broadAge: BroadAge
  tournamentCategoryLabel: string
  matches: number
  lastMatchDate: string
  detailLabel: string
}

type GroupKind = 'detail' | 'age' | 'range' | 'broadLevel' | 'broad'

type ChartGroup = {
  kind: GroupKind
  label: string
  slices: DetailSlice[]
  ageLabels: string[]
  broadAges: BroadAge[]
  tournamentCategoryLabel: string | null
  matches: number
  lastMatchDate: string
  includedDetailLabels: string[]
}

type MergeCandidate = {
  kind: GroupKind
  replaceIds: string[]
  merged: ChartGroup
  staleness: string
}

const TOURNAMENT_LEVEL_PRIORITY = new Map([
  ['copper', 0],
  ['bronze', 1],
  ['silver', 2],
  ['gold', 3],
  ['other', 4],
])

const BROAD_AGE_LABELS: Record<BroadAge, string> = {
  junior: 'Juniors',
  senior: 'Seniors',
  masters: 'Masters',
  other: 'Other',
}

function tournamentLevelSortRank(label: string): number {
  const normalized = label.trim().toLowerCase()
  if (normalized === 'county') return Number.POSITIVE_INFINITY
  return TOURNAMENT_LEVEL_PRIORITY.get(normalized) ?? 4
}

function categoryAgeComboKey(match: NormalizedMatch): string {
  return `${match.tournamentCategoryLabel}\0${competitionAgeLabelFromMatch(match) ?? ''}`
}

function roundPercent(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

export function broadAgeFromMatch(match: NormalizedMatch): BroadAge {
  const label = competitionAgeLabelFromMatch(match)
  const group = match.competitionAgeGroup

  if (label && /^U\d+$/i.test(label)) return 'junior'
  if (group === 'Junior' || label === 'Junior') return 'junior'
  if (label && /^O\d+$/i.test(label)) return 'masters'
  if (group === 'Masters' || label === 'Masters') return 'masters'
  if (group === 'Senior' || label === 'Senior') return 'senior'
  return 'other'
}

function compareCategoryAgeVolumes(
  a: Pick<CategoryAgeMatchVolume, 'competitionAgeLabel' | 'tournamentCategoryLabel' | 'label'>,
  b: Pick<CategoryAgeMatchVolume, 'competitionAgeLabel' | 'tournamentCategoryLabel' | 'label'>,
): number {
  const ageCompare = compareCompetitionAgeOldestFirst(
    a.competitionAgeLabel,
    b.competitionAgeLabel,
  )
  if (ageCompare !== 0) return ageCompare

  const levelRankA = tournamentLevelSortRank(a.tournamentCategoryLabel ?? '')
  const levelRankB = tournamentLevelSortRank(b.tournamentCategoryLabel ?? '')
  if (levelRankA !== levelRankB) return levelRankA - levelRankB

  return a.label.localeCompare(b.label)
}

function buildDetailSlices(matches: NormalizedMatch[]): DetailSlice[] {
  const competitive = competitiveMatches(matches)
  const counts = new Map<
    string,
    Pick<DetailSlice, 'ageLabel' | 'broadAge' | 'tournamentCategoryLabel' | 'matches' | 'lastMatchDate'>
  >()

  for (const match of competitive) {
    const key = categoryAgeComboKey(match)
    const existing = counts.get(key)
    if (existing) {
      existing.matches += 1
      if (match.date > existing.lastMatchDate) existing.lastMatchDate = match.date
      continue
    }

    const ageLabel = competitionAgeLabelFromMatch(match)
    counts.set(key, {
      ageLabel,
      broadAge: broadAgeFromMatch(match),
      tournamentCategoryLabel: match.tournamentCategoryLabel,
      matches: 1,
      lastMatchDate: match.date,
    })
  }

  return [...counts.values()].map((row) => ({
    ...row,
    detailLabel: formatCategoryAgeLabel(row.tournamentCategoryLabel, row.ageLabel),
  }))
}

function groupId(kind: GroupKind, label: string): string {
  return `${kind}:${label}`
}

function detailGroupFromSlice(slice: DetailSlice): ChartGroup {
  return {
    kind: 'detail',
    label: slice.detailLabel,
    slices: [slice],
    ageLabels: slice.ageLabel ? [slice.ageLabel] : [],
    broadAges: [slice.broadAge],
    tournamentCategoryLabel: slice.tournamentCategoryLabel,
    matches: slice.matches,
    lastMatchDate: slice.lastMatchDate,
    includedDetailLabels: [slice.detailLabel],
  }
}

function mergeGroups(kind: GroupKind, label: string, groups: ChartGroup[]): ChartGroup {
  const slices = groups.flatMap((group) => group.slices)
  const ageLabels = [...new Set(slices.map((slice) => slice.ageLabel).filter((age): age is string => age != null))]
  const broadAges = [...new Set(slices.map((slice) => slice.broadAge))]
  const levels = [...new Set(slices.map((slice) => slice.tournamentCategoryLabel))]
  const tournamentCategoryLabel =
    kind === 'detail' || kind === 'broadLevel'
      ? levels[0] ?? null
      : levels.length === 1
        ? levels[0]!
        : null

  return {
    kind,
    label,
    slices,
    ageLabels: sortCompetitionSubAgeGroups(ageLabels),
    broadAges,
    tournamentCategoryLabel,
    matches: slices.reduce((sum, slice) => sum + slice.matches, 0),
    lastMatchDate: slices.reduce(
      (max, slice) => (slice.lastMatchDate > max ? slice.lastMatchDate : max),
      '',
    ),
    includedDetailLabels: [...new Set(slices.map((slice) => slice.detailLabel))].sort(),
  }
}

function formatAgeRangeLabel(ages: string[]): string {
  const sorted = sortCompetitionSubAgeGroups(ages)
  if (sorted.length === 0) return 'Unknown'
  if (sorted.length === 1) return sorted[0]!
  return `${sorted[0]}–${sorted.at(-1)}`
}

function groupsOnlyForAge(groups: ChartGroup[], ageLabel: string): ChartGroup[] {
  return groups.filter(
    (group) =>
      group.ageLabels.length === 1 &&
      group.ageLabels[0] === ageLabel &&
      group.slices.every((slice) => slice.ageLabel === ageLabel),
  )
}

function protectedAgeLabels(groups: ChartGroup[]): Set<string> {
  const bestByBroad = new Map<BroadAge, { ageLabel: string; lastMatchDate: string }>()

  for (const group of groups) {
    for (const ageLabel of group.ageLabels) {
      const broadAge = group.slices.find((slice) => slice.ageLabel === ageLabel)?.broadAge
      if (!broadAge) continue

      const current = bestByBroad.get(broadAge)
      if (current == null || group.lastMatchDate > current.lastMatchDate) {
        bestByBroad.set(broadAge, { ageLabel, lastMatchDate: group.lastMatchDate })
      }
    }
  }

  return new Set([...bestByBroad.values()].map((entry) => entry.ageLabel))
}

function staleAgeRuns(
  broadAge: BroadAge,
  groups: ChartGroup[],
  protectedAges: Set<string>,
): string[][] {
  const ages = sortCompetitionSubAgeGroups([
    ...new Set(
      groups
        .filter((group) => group.broadAges.includes(broadAge))
        .flatMap((group) => group.ageLabels),
    ),
  ])

  const runs: string[][] = []
  let current: string[] = []

  for (const age of ages) {
    if (protectedAges.has(age)) {
      if (current.length >= 2) runs.push(current)
      current = []
      continue
    }
    current.push(age)
  }

  if (current.length >= 2) runs.push(current)
  return runs
}

function groupsForAges(groups: ChartGroup[], ages: string[]): ChartGroup[] {
  const ageSet = new Set(ages)
  return groups.filter(
    (group) =>
      group.ageLabels.length > 0 &&
      group.ageLabels.every((age) => ageSet.has(age)) &&
      group.broadAges.length === 1,
  )
}

function collectAgeCollapseCandidates(
  groups: ChartGroup[],
  protectedAges: Set<string>,
  allowProtected: boolean,
): MergeCandidate[] {
  const candidates: MergeCandidate[] = []
  const seenAges = new Set<string>()

  for (const group of groups) {
    for (const ageLabel of group.ageLabels) {
      if (seenAges.has(ageLabel)) continue
      seenAges.add(ageLabel)

      if (!allowProtected && protectedAges.has(ageLabel)) continue

      const ageGroups = groupsOnlyForAge(groups, ageLabel)
      if (ageGroups.length < 2) continue

      const merged = mergeGroups('age', ageLabel, ageGroups)
      candidates.push({
        kind: 'age',
        replaceIds: ageGroups.map((entry) => groupId(entry.kind, entry.label)),
        merged,
        staleness: merged.lastMatchDate,
      })
    }
  }

  return candidates
}

function collectRangeCollapseCandidates(
  groups: ChartGroup[],
  protectedAges: Set<string>,
  allowProtected: boolean,
): MergeCandidate[] {
  const candidates: MergeCandidate[] = []
  const broadAges = [...new Set(groups.flatMap((group) => group.broadAges))]

  for (const broadAge of broadAges) {
    for (const run of staleAgeRuns(broadAge, groups, protectedAges)) {
      if (!allowProtected && run.some((age) => protectedAges.has(age))) continue

      const runGroups = groupsForAges(groups, run)
      if (runGroups.length < 2) continue

      const label = formatAgeRangeLabel(run)
      const merged = mergeGroups('range', label, runGroups)
      candidates.push({
        kind: 'range',
        replaceIds: runGroups.map((entry) => groupId(entry.kind, entry.label)),
        merged,
        staleness: merged.lastMatchDate,
      })
    }
  }

  return candidates
}

function collectBroadLevelCandidates(
  groups: ChartGroup[],
  protectedAges: Set<string>,
  allowProtected: boolean,
): MergeCandidate[] {
  const candidates: MergeCandidate[] = []
  const keys = new Set<string>()

  for (const group of groups) {
    if (group.tournamentCategoryLabel == null || group.broadAges.length !== 1) continue

    const broadAge = group.broadAges[0]!
    const level = group.tournamentCategoryLabel
    const key = `${broadAge}\0${level}`
    if (keys.has(key)) continue
    keys.add(key)

    const matching = groups.filter(
      (entry) =>
        entry.broadAges.length === 1 &&
        entry.broadAges[0] === broadAge &&
        entry.tournamentCategoryLabel === level &&
        entry.ageLabels.length > 0,
    )

    if (matching.length < 2) continue
    if (
      !allowProtected &&
      matching.some((entry) => entry.ageLabels.some((age) => protectedAges.has(age)))
    ) {
      continue
    }

    const label = formatCategoryAgeLabel(level, BROAD_AGE_LABELS[broadAge])
    const merged = mergeGroups('broadLevel', label, matching)
    candidates.push({
      kind: 'broadLevel',
      replaceIds: matching.map((entry) => groupId(entry.kind, entry.label)),
      merged,
      staleness: merged.lastMatchDate,
    })
  }

  return candidates
}

function collectBroadCollapseCandidates(
  groups: ChartGroup[],
  protectedAges: Set<string>,
  allowProtected: boolean,
): MergeCandidate[] {
  const candidates: MergeCandidate[] = []

  for (const broadAge of [...new Set(groups.flatMap((group) => group.broadAges))] as BroadAge[]) {
    const matching = groups.filter(
      (entry) => entry.broadAges.length === 1 && entry.broadAges[0] === broadAge,
    )
    if (matching.length < 2) continue
    if (
      !allowProtected &&
      matching.some((entry) => entry.ageLabels.some((age) => protectedAges.has(age)))
    ) {
      continue
    }

    const merged = mergeGroups('broad', BROAD_AGE_LABELS[broadAge], matching)
    candidates.push({
      kind: 'broad',
      replaceIds: matching.map((entry) => groupId(entry.kind, entry.label)),
      merged,
      staleness: merged.lastMatchDate,
    })
  }

  return candidates
}

function pickBestMerge(
  groups: ChartGroup[],
  protectedAges: Set<string>,
  allowProtected: boolean,
): MergeCandidate | null {
  const candidates = [
    ...collectAgeCollapseCandidates(groups, protectedAges, allowProtected),
    ...collectRangeCollapseCandidates(groups, protectedAges, allowProtected),
    ...collectBroadLevelCandidates(groups, protectedAges, allowProtected),
    ...collectBroadCollapseCandidates(groups, protectedAges, allowProtected),
  ]

  if (candidates.length === 0) {
    if (!allowProtected) return pickBestMerge(groups, protectedAges, true)
    return null
  }

  candidates.sort((a, b) => {
    if (a.staleness !== b.staleness) return a.staleness.localeCompare(b.staleness)
    if (b.replaceIds.length !== a.replaceIds.length) return b.replaceIds.length - a.replaceIds.length
    const kindRank: Record<GroupKind, number> = {
      detail: 0,
      age: 1,
      range: 2,
      broadLevel: 3,
      broad: 4,
    }
    return kindRank[a.kind] - kindRank[b.kind]
  })

  return candidates[0]!
}

function applyMerge(groups: ChartGroup[], merge: MergeCandidate): ChartGroup[] {
  const replace = new Set(merge.replaceIds)
  const next = groups.filter((group) => !replace.has(groupId(group.kind, group.label)))
  next.push(merge.merged)
  return next
}

function groupSlicesForPie(slices: DetailSlice[], maxSlices: number): ChartGroup[] {
  let groups = slices.map(detailGroupFromSlice)
  if (groups.length <= maxSlices) return groups

  while (groups.length > maxSlices) {
    const protectedAges = protectedAgeLabels(groups)
    const merge = pickBestMerge(groups, protectedAges, false)
    if (merge == null) break
    groups = applyMerge(groups, merge)
  }

  return groups
}

function chartGroupToVolume(group: ChartGroup, total: number): CategoryAgeMatchVolume {
  const isGrouped = group.kind !== 'detail' || group.includedDetailLabels.length > 1
  const competitionAgeLabel =
    group.ageLabels.length === 1 ? group.ageLabels[0]! : null
  const broadAge = group.broadAges.length === 1 ? group.broadAges[0]! : null

  return {
    label: group.label,
    tournamentCategoryLabel: group.tournamentCategoryLabel,
    competitionAgeLabel,
    broadAge,
    matches: group.matches,
    percent: roundPercent(group.matches, total),
    isGrouped,
    includedLabels: isGrouped ? group.includedDetailLabels : undefined,
  }
}

/** Full detail — every age and tournament level combination. */
export function computeMatchesByCategoryAge(
  matches: NormalizedMatch[],
): CategoryAgeMatchVolume[] {
  const slices = buildDetailSlices(matches)
  const total = slices.reduce((sum, slice) => sum + slice.matches, 0)

  return slices
    .map((slice) => chartGroupToVolume(detailGroupFromSlice(slice), total))
    .sort(compareCategoryAgeVolumes)
}

/** Pie-ready slices with dynamic grouping when there are too many categories. */
export function computeMatchesByCategoryAgeForPie(
  matches: NormalizedMatch[],
  maxSlices = MAX_PIE_SLICES,
): CategoryAgeMatchVolume[] {
  const slices = buildDetailSlices(matches)
  const total = slices.reduce((sum, slice) => sum + slice.matches, 0)
  if (total === 0) return []

  const groups = groupSlicesForPie(slices, maxSlices)

  return groups
    .map((group) => chartGroupToVolume(group, total))
    .sort((a, b) => {
      if (b.matches !== a.matches) return b.matches - a.matches
      return a.label.localeCompare(b.label)
    })
}
