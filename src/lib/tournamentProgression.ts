import type { MatchOutcome, NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch, isWalkoverWin } from './matchExclusions'
import { formatTournamentCategory } from './tournamentCategory'

export type ProgressionStage =
  | 'winner'
  | 'runner-up'
  | 'semi-final'
  | 'quarter-final'
  | 'knockout'
  /** Exited in the group phase without a group match win. */
  | 'group-stages'
  /** Exited in the group phase with at least one group match win. */
  | 'group-wins'

export const PROGRESSION_STAGE_ORDER: ProgressionStage[] = [
  'group-stages',
  'group-wins',
  'knockout',
  'quarter-final',
  'semi-final',
  'runner-up',
  'winner',
]

/** Ladder shown in the tournament progression depth bar and distribution chart (no knockout slice). */
export const PROGRESSION_UI_STAGE_ORDER: ProgressionStage[] = PROGRESSION_STAGE_ORDER.filter(
  (stage) => stage !== 'knockout',
)

export const PROGRESSION_STAGE_LABELS: Record<ProgressionStage, string> = {
  'group-stages': 'Group stages',
  'group-wins': 'Group match wins',
  knockout: 'Knockout',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
  'runner-up': 'Runner-up',
  winner: 'Winner',
}

/** Compact labels for charts and narrow layouts. */
export const PROGRESSION_STAGE_SHORT_LABELS: Record<ProgressionStage, string> = {
  'group-stages': 'Group',
  'group-wins': 'Grp MW',
  knockout: 'KO',
  'quarter-final': 'QF',
  'semi-final': 'SF',
  'runner-up': '2nd',
  winner: 'Winner',
}

export const STAGE_RANK: Record<ProgressionStage, number> = {
  'group-stages': 1,
  'group-wins': 2,
  knockout: 3,
  'quarter-final': 4,
  'semi-final': 5,
  'runner-up': 6,
  winner: 7,
}

/** Deepest stages first — for achievement chips and highlights. */
export const PROGRESSION_STAGE_CHIP_ORDER: ProgressionStage[] = [
  ...PROGRESSION_STAGE_ORDER,
].reverse()

export const PROGRESSION_STAGE_COLORS: Record<ProgressionStage, string> = {
  'group-stages': 'var(--color-ink-300)',
  'group-wins': 'var(--color-ink-400)',
  knockout: 'var(--color-brand-200)',
  'quarter-final': 'var(--color-brand-300)',
  'semi-final': 'var(--color-brand-400)',
  'runner-up': 'var(--color-brand-500)',
  winner: 'var(--color-brand-600)',
}

export type TournamentEntry = {
  key: string
  competitionName: string
  discipline: string
  disciplineLabel: string
  bestStage: ProgressionStage
  bestStageRank: number
  matchCount: number
}

export type ProgressionDistributionRow = {
  stage: ProgressionStage
  label: string
  shortLabel: string
  count: number
  percent: number
}

export type TournamentProgressionStats = {
  entries: TournamentEntry[]
  /** Full UI ladder for the depth bar (knockout merged into quarter-final). */
  depthBarSegments: ProgressionDistributionRow[]
  distribution: ProgressionDistributionRow[]
  /** Median depth rank — better reflects a typical finish when many events end early. */
  typicalRank: number | null
  typicalLabel: string | null
  /** Deepest stage reached in any tournament in this selection. */
  bestStage: ProgressionStage | null
  bestLabel: string | null
  /** Share of tournaments with best finish at knockout or deeper. */
  knockoutOrBetterPercent: number
  tournamentCount: number
}

/** Minimum stage rank counted as "knockout or better" for aspiration stats. */
export const KNOCKOUT_OR_BETTER_MIN_RANK = STAGE_RANK['knockout']

export function percentAtOrBeyondRank(
  entries: Pick<TournamentEntry, 'bestStageRank'>[],
  minRank: number,
): number {
  if (entries.length === 0) return 0
  const count = entries.filter((entry) => entry.bestStageRank >= minRank).length
  return Math.round((count / entries.length) * 100)
}

export function buildProgressionDistributionRows(
  counts: Map<ProgressionStage, number>,
  tournamentCount: number,
  stageOrder: ProgressionStage[] = PROGRESSION_STAGE_ORDER,
): ProgressionDistributionRow[] {
  if (tournamentCount === 0) return []
  return stageOrder.map((stage) => {
    const count = counts.get(stage) ?? 0
    return {
      stage,
      label: PROGRESSION_STAGE_LABELS[stage],
      shortLabel: PROGRESSION_STAGE_SHORT_LABELS[stage],
      count,
      percent: Math.round((count / tournamentCount) * 100),
    }
  })
}

/** Roll knockout finishes into quarter-final for the progression UI ladder only. */
export function mergeKnockoutCountsForProgressionUI(
  counts: Map<ProgressionStage, number>,
): Map<ProgressionStage, number> {
  const merged = new Map<ProgressionStage, number>()
  for (const stage of PROGRESSION_UI_STAGE_ORDER) {
    merged.set(stage, counts.get(stage) ?? 0)
  }
  merged.set(
    'quarter-final',
    (merged.get('quarter-final') ?? 0) + (counts.get('knockout') ?? 0),
  )
  return merged
}

export function buildProgressionUIDistributionRows(
  counts: Map<ProgressionStage, number>,
  tournamentCount: number,
): ProgressionDistributionRow[] {
  return buildProgressionDistributionRows(
    mergeKnockoutCountsForProgressionUI(counts),
    tournamentCount,
    PROGRESSION_UI_STAGE_ORDER,
  )
}

/** Full progression UI ladder for the depth bar (all visible stages, including 0%). */
export function progressionDepthBarSegments(
  counts: Map<ProgressionStage, number>,
  tournamentCount: number,
): ProgressionDistributionRow[] {
  return buildProgressionUIDistributionRows(counts, tournamentCount)
}

/** Non-zero UI stages only, deepest first — for the finish distribution chart. */
export function progressionDistributionBar(
  counts: Map<ProgressionStage, number>,
  tournamentCount: number,
): ProgressionDistributionRow[] {
  return buildProgressionUIDistributionRows(counts, tournamentCount)
    .filter((row) => row.count > 0)
    .reverse()
}

/**
 * Map a data median rank onto the progression UI bar (knockout → quarter-final segment).
 */
export function progressionBarMarkerRankForUI(typicalRank: number): number {
  if (typicalRank <= STAGE_RANK['group-wins']) return typicalRank
  if (typicalRank <= STAGE_RANK['knockout']) return STAGE_RANK['quarter-final']
  return typicalRank
}

/**
 * Relative size on the fixed depth ladder: Group = Match wins, 2nd = W, each later step ~½ the prior.
 */
export function progressionDepthBarStageWeight(stage: ProgressionStage): number {
  switch (stage) {
    case 'group-stages':
    case 'group-wins':
      return 8
    case 'quarter-final':
      return 4
    case 'semi-final':
      return 2
    case 'runner-up':
    case 'winner':
      return 1
    default:
      return 1
  }
}

/** Minimum share (%) for runner-up and winner so short labels stay readable. */
export const PROGRESSION_DEPTH_BAR_MIN_PODIUM_PERCENT = 7

function normalizeDepthBarPercentages(values: number[]): number[] {
  const sum = values.reduce((total, value) => total + value, 0)
  if (sum === 0) return []
  return values.map((value) => (value / sum) * 100)
}

function applyDepthBarPodiumFloor(
  percents: number[],
  segments: ProgressionDistributionRow[],
  minPercent: number,
): number[] {
  const next = [...percents]
  const podiumIndices = segments
    .map((row, index) => (row.stage === 'runner-up' || row.stage === 'winner' ? index : -1))
    .filter((index) => index >= 0)

  if (podiumIndices.length === 0) return next

  let deficit = 0
  for (const index of podiumIndices) {
    const shortfall = minPercent - (next[index] ?? 0)
    if (shortfall > 0) {
      next[index] = minPercent
      deficit += shortfall
    }
  }

  if (deficit <= 0) return next

  const groupIndices = segments
    .map((row, index) =>
      row.stage === 'group-stages' || row.stage === 'group-wins' ? index : -1,
    )
    .filter((index) => index >= 0)

  if (groupIndices.length === 0) return normalizeDepthBarPercentages(next)

  const groupTotal = groupIndices.reduce((sum, index) => sum + (next[index] ?? 0), 0)
  for (const index of groupIndices) {
    const share = groupTotal > 0 ? (next[index] ?? 0) / groupTotal : 1 / groupIndices.length
    next[index] = Math.max(0, (next[index] ?? 0) - deficit * share)
  }

  return normalizeDepthBarPercentages(next)
}

/** Fixed ladder widths for the depth bar; only the marker reflects player data. */
export function progressionBarDisplayWidths(
  segments: ProgressionDistributionRow[],
): number[] {
  if (segments.length === 0) return []

  const percents = normalizeDepthBarPercentages(
    segments.map((row) => progressionDepthBarStageWeight(row.stage)),
  )

  return applyDepthBarPodiumFloor(
    percents,
    segments,
    PROGRESSION_DEPTH_BAR_MIN_PODIUM_PERCENT,
  )
}

/**
 * Where the median marker sits inside a stage slice (0 = left edge, 1 = right edge).
 * Group exit is left; knockout through runner-up are centred; winner is right.
 */
export function progressionStageMarkerT(rank: number): number {
  if (rank <= 1) return 0
  if (rank >= 7) return 1
  return 0.5
}

function segmentMarkerPosition(
  segmentIndex: number,
  stageRank: number,
  displayWidths: number[],
): number {
  const start = displayWidths.slice(0, segmentIndex).reduce((total, width) => total + width, 0)
  const width = displayWidths[segmentIndex] ?? 0
  return start + width * progressionStageMarkerT(stageRank)
}

function anchorPositionForRank(
  rank: number,
  segments: ProgressionDistributionRow[],
  displayWidths: number[],
): number {
  const segmentIndex = segments.findIndex((row) => STAGE_RANK[row.stage] === rank)
  if (segmentIndex >= 0) {
    return segmentMarkerPosition(segmentIndex, rank, displayWidths)
  }

  let beforeRank = Number.NEGATIVE_INFINITY
  let beforePos = 0
  let afterRank = Number.POSITIVE_INFINITY
  let afterPos = 100

  for (let i = 0; i < segments.length; i++) {
    const stageRank = STAGE_RANK[segments[i]!.stage]
    const pos = segmentMarkerPosition(i, stageRank, displayWidths)
    if (stageRank < rank && stageRank > beforeRank) {
      beforeRank = stageRank
      beforePos = pos
    }
    if (stageRank > rank && stageRank < afterRank) {
      afterRank = stageRank
      afterPos = pos
    }
  }

  if (!Number.isFinite(beforeRank)) return afterPos
  if (!Number.isFinite(afterRank)) return beforePos
  const t = (rank - beforeRank) / (afterRank - beforeRank)
  return beforePos + (afterPos - beforePos) * t
}

/** Place the median marker from typical depth rank on the display bar. */
export function progressionBarMarkerPercentFromTypicalRank(
  typicalRank: number,
  segments: ProgressionDistributionRow[],
  displayWidths: number[],
): number {
  if (segments.length === 0) return 0

  const low = Math.floor(typicalRank)
  const high = Math.ceil(typicalRank)
  const lowPos = anchorPositionForRank(low, segments, displayWidths)
  if (low === high) return lowPos

  const highPos = anchorPositionForRank(high, segments, displayWidths)
  return lowPos + (highPos - lowPos) * (typicalRank - low)
}

/** Compact label for the depth bar on narrow viewports (display width is layout %, not data %). */
export function progressionBarMobileLabel(
  stage: ProgressionStage,
  displayWidthPercent: number,
): string {
  if (stage === 'group-wins') {
    return displayWidthPercent >= 10 ? 'Match wins' : 'Grp MW'
  }
  if (stage === 'winner') return 'W'
  return PROGRESSION_STAGE_SHORT_LABELS[stage]
}

export function getMatchRound(match: NormalizedMatch): string {
  const raw = match.raw.Round
  if (raw == null) return ''
  return String(raw).trim()
}

/** True when the round is a semi-final (not a bronze/silver placement final). */
export function isSemiFinalRound(round: string): boolean {
  if (isMissingRound(round)) return false
  const text = normalizeRoundText(round)
  if (/\b(semi|sf)\b/.test(text) || /\blast\s*4\b/.test(text) || /\bround\s*of\s*4\b/.test(text)) {
    return true
  }
  return false
}

/** True when the player lost in a semi-final at this event (joint 3rd / 4th). */
export function lostInSemiFinal(matches: NormalizedMatch[]): boolean {
  for (const match of matches) {
    if (!isCompetitiveMatch(match)) continue
    const round = getMatchRound(match)
    if (!isSemiFinalRound(round)) continue
    if (match.outcome === 'loss') return true
  }
  return false
}

/** True when the round is a bronze placement final (not a main or semi-final). */
export function isBronzeFinalRound(round: string): boolean {
  if (isMissingRound(round)) return false
  const text = normalizeRoundText(round)
  return /\bbronze\b/.test(text) && /\bfinal\b/.test(text)
}

/** True when the player won the bronze final at this event (3rd place). */
export function wonBronzeFinal(matches: NormalizedMatch[]): boolean {
  for (const match of matches) {
    if (!isCompetitiveMatch(match)) continue
    const round = getMatchRound(match)
    if (!isBronzeFinalRound(round)) continue
    if (match.outcome === 'win') return true
  }
  return false
}

function isMainFinalRound(round: string): boolean {
  const text = normalizeRoundText(round)
  return (
    /\b(final|gold)\b/.test(text) &&
    !/\b(quarter|semi|group|pool|bronze|prelim|plate)\b/.test(text)
  )
}

export function isCountyTournament(match: NormalizedMatch): boolean {
  const { label } = formatTournamentCategory(match.raw['Tournament Category'])
  return label === 'County'
}

function normalizeRoundText(round: string): string {
  return round
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[._-]/g, ' ')
}

function isMissingRound(round: string): boolean {
  const normalized = normalizeRoundText(round)
  return (
    normalized === '' ||
    normalized === 'n/a' ||
    normalized === 'na' ||
    normalized === 'none' ||
    normalized === 'unknown'
  )
}

/** Standard stage label for match rows (e.g. "Group", "Semi-final"). */
const MATCH_STAGE_LABELS: Partial<Record<ProgressionStage, string>> = {
  'group-stages': 'Group',
  knockout: 'Knockout',
  'quarter-final': 'Quarter-final',
  'semi-final': 'Semi-final',
}

export function formatMatchStageLabel(round: string): string | null {
  if (isMissingRound(round)) return null
  if (isMainFinalRound(round)) return 'Final'

  const stage = parseRoundToStage(round)
  if (stage == null) return null

  return MATCH_STAGE_LABELS[stage] ?? null
}

/** Map a round label to the stage reached in that match (before outcome refinement). */
export function parseRoundToStage(round: string): ProgressionStage | null {
  if (isMissingRound(round)) return null

  const text = normalizeRoundText(round)

  if (
    /\b(groups|group|pool|league|rr|round robin|grp|gs|box)\b/.test(text) ||
    /\bgroup\s*stage\b/.test(text) ||
    /^g\d+\b/.test(text) ||
    /\bgroup\s*[a-z0-9]\b/.test(text) ||
    /\bprelim\b/.test(text)
  ) {
    return 'group-stages'
  }

  if (
    /\b(quarter|qf)\b/.test(text) ||
    /\br\s*8\b/.test(text) ||
    /\blast\s*8\b/.test(text) ||
    /\bround\s*of\s*8\b/.test(text)
  ) {
    return 'quarter-final'
  }

  if (/\b(semi|sf)\b/.test(text) || /\blast\s*4\b/.test(text) || /\bround\s*of\s*4\b/.test(text)) {
    return 'semi-final'
  }

  if (
    /\b(final|gold|silver|bronze)\b/.test(text) &&
    !/\b(quarter|semi|group|pool|prelim)\b/.test(text)
  ) {
    return 'semi-final'
  }

  if (
    /\b(r\s*(128|64|32|16)|last\s*(128|64|32|16)|round\s*of\s*(128|64|32|16))\b/.test(text) ||
    /\bknockout\b/.test(text) ||
    /\bko\b/.test(text)
  ) {
    return 'knockout'
  }

  return null
}

export function stageFromMatch(round: string, outcome: MatchOutcome): ProgressionStage | null {
  const base = parseRoundToStage(round)
  if (base == null) return null

  if (isMainFinalRound(round)) {
    if (outcome === 'win') return 'winner'
    if (outcome === 'loss') return 'runner-up'
  }

  return base
}

/** Stage reached in a match for tournament partners (includes walkover finals). */
export function stageFromMatchForAchievements(match: NormalizedMatch): ProgressionStage | null {
  const round = getMatchRound(match)
  if (match.nonCompetitiveReason === 'no_match') return null

  if (match.nonCompetitiveReason === 'walkover') {
    const base = parseRoundToStage(round)
    if (base == null) return null
    if (isMainFinalRound(round)) {
      return isWalkoverWin(match) ? 'winner' : 'runner-up'
    }
    return base
  }

  return stageFromMatch(round, match.outcome)
}

export function tournamentKey(match: NormalizedMatch): string {
  return `${match.competitionName}\0${match.discipline}`
}

export function bestStageFromMatches(matches: NormalizedMatch[]): ProgressionStage | null {
  return refineGroupExitStage(
    matches,
    bestStageFromMatchStages(matches, (m) => stageFromMatch(getMatchRound(m), m.outcome)),
    false,
  )
}

export function bestStageFromMatchesForAchievements(
  matches: NormalizedMatch[],
): ProgressionStage | null {
  return refineGroupExitStage(
    matches,
    bestStageFromMatchStages(matches, (m) => stageFromMatchForAchievements(m)),
    true,
  )
}

function bestStageFromMatchStages(
  matches: NormalizedMatch[],
  stageForMatch: (match: NormalizedMatch) => ProgressionStage | null,
): ProgressionStage | null {
  let best: ProgressionStage | null = null
  let bestRank = 0

  for (const match of matches) {
    const stage = stageForMatch(match)
    if (stage == null) continue
    const rank = STAGE_RANK[stage]
    if (rank > bestRank) {
      bestRank = rank
      best = stage
    }
  }

  return best
}

/** Light group-stage swatches need a darker chip fill for readable white text. */
export function isLightGroupProgressionStage(stage: ProgressionStage): boolean {
  return stage === 'group-stages' || stage === 'group-wins'
}

function isGroupMatchWin(match: NormalizedMatch, forAchievements: boolean): boolean {
  if (parseRoundToStage(getMatchRound(match)) !== 'group-stages') return false
  if (match.nonCompetitiveReason === 'no_match') return false

  if (forAchievements && match.nonCompetitiveReason === 'walkover') {
    return isWalkoverWin(match)
  }

  return match.outcome === 'win'
}

function countGroupMatchWins(matches: NormalizedMatch[], forAchievements: boolean): number {
  let wins = 0
  for (const match of matches) {
    if (isGroupMatchWin(match, forAchievements)) wins++
  }
  return wins
}

/** At least one competitive win in a group-phase match. */
export function hasGroupMatchWins(matches: NormalizedMatch[]): boolean {
  return countGroupMatchWins(matches, false) > 0
}

/** Split a pure group exit by wins in group matches (proxy for group standing). */
function refineGroupExitStage(
  matches: NormalizedMatch[],
  best: ProgressionStage | null,
  forAchievements: boolean,
): ProgressionStage | null {
  if (best !== 'group-stages') return best
  return countGroupMatchWins(matches, forAchievements) > 0 ? 'group-wins' : 'group-stages'
}

export function isProgressionTournament(matches: NormalizedMatch[]): boolean {
  if (matches.length === 0) return false
  if (matches.some(isCountyTournament)) return false
  return matches.some((match) => parseRoundToStage(getMatchRound(match)) != null)
}

export function computeTournamentProgression(
  matches: NormalizedMatch[],
): TournamentProgressionStats {
  const byTournament = new Map<string, NormalizedMatch[]>()

  for (const match of matches) {
    if (isCountyTournament(match)) continue
    const key = tournamentKey(match)
    const bucket = byTournament.get(key) ?? []
    bucket.push(match)
    byTournament.set(key, bucket)
  }

  const entries: TournamentEntry[] = []

  for (const [key, tournamentMatches] of byTournament) {
    if (!isProgressionTournament(tournamentMatches)) continue

    const bestStage = bestStageFromMatches(tournamentMatches)
    if (bestStage == null) continue

    const sample = tournamentMatches[0]
    entries.push({
      key,
      competitionName: sample.competitionName,
      discipline: sample.discipline,
      disciplineLabel: sample.disciplineLabel,
      bestStage,
      bestStageRank: STAGE_RANK[bestStage],
      matchCount: tournamentMatches.length,
    })
  }

  entries.sort((a, b) => b.bestStageRank - a.bestStageRank)

  const tournamentCount = entries.length
  const counts = new Map<ProgressionStage, number>()
  for (const stage of PROGRESSION_STAGE_ORDER) {
    counts.set(stage, 0)
  }
  for (const entry of entries) {
    counts.set(entry.bestStage, (counts.get(entry.bestStage) ?? 0) + 1)
  }

  const depthBarSegments = progressionDepthBarSegments(counts, tournamentCount)
  const distribution = progressionDistributionBar(counts, tournamentCount)

  const ranks = entries.map((entry) => entry.bestStageRank)
  const typicalRank = medianRank(ranks)

  const typicalLabel =
    typicalRank != null ? describeTypicalRank(typicalRank) : null

  const bestEntry = entries[0] ?? null

  return {
    entries,
    depthBarSegments,
    distribution,
    typicalRank,
    typicalLabel,
    bestStage: bestEntry?.bestStage ?? null,
    bestLabel: bestEntry != null ? PROGRESSION_STAGE_LABELS[bestEntry.bestStage] : null,
    knockoutOrBetterPercent: percentAtOrBeyondRank(entries, KNOCKOUT_OR_BETTER_MIN_RANK),
    tournamentCount,
  }
}

export function medianRank(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2
  }
  return sorted[mid]!
}

export function describeTypicalRank(rank: number): string {
  const rounded = Math.round(rank)
  const index = Math.min(PROGRESSION_STAGE_ORDER.length - 1, Math.max(0, rounded - 1))
  return PROGRESSION_STAGE_LABELS[PROGRESSION_STAGE_ORDER[index]]
}
