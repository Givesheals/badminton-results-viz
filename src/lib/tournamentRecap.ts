import type { NormalizedMatch } from '../types/matchHistory'
import {
  bestWinRowKey,
  detectBestWinRecapMilestones,
  findBestWinInMatches,
  type BestWinRow,
} from './bestWins'
import {
  buildRecapRecordMilestones,
  type RecapRecordMilestone,
} from './recapRecordMilestones'
import { isCompetitiveMatch } from './matchExclusions'
import { getMatchGames, getMatchVolume } from './matchScores'
import { getMatchExpectedWinProbability, getPlayerRating } from './ratings'
import {
  bestStageFromMatches,
  formatMatchStageLabel,
  getMatchRound,
  isCountyTournament,
  isProgressionTournament,
  lostInSemiFinal,
  medianRank,
  parseRoundToStage,
  hasGroupMatchWins,
  PROGRESSION_STAGE_LABELS,
  STAGE_RANK,
  type ProgressionStage,
} from './tournamentProgression'

export type ComparisonLevel = 'above' | 'typical'

export type DisciplineRecap = {
  discipline: string
  disciplineLabel: string
  ratingStart: number | null
  ratingEnd: number | null
  ratingDelta: number | null
  ratingVsTypical: ComparisonLevel | null
  bestStage: ProgressionStage | null
  bestStageLabel: string | null
  progressionVsTypical: ComparisonLevel | null
  matchWins: number
  matchLosses: number
  disciplineInsights: RecapInsight[]
}

export type PartnerChemistryHighlight = {
  partnerName: string
  priorOverperformance: number | null
  weekendOverperformance: number
  overallOverperformance: number
  detail: string
}

export type FreakFlagKind = 'nailbiter' | 'single_digit_scare' | 'money_worth'

export type FreakFlagGameHighlight = 'lost_single_digit'

export type FreakFlagGameScore = {
  player: number
  opponent: number
  highlight?: FreakFlagGameHighlight
}

export type FreakFlagMatchDetail = {
  discipline: string
  partnerName: string | null
  roundLabel: string | null
  opponents: string
  scoreSummary: string
  /** Per-game scores with optional highlights (e.g. single-digit scare). */
  games?: FreakFlagGameScore[]
}

export type FreakFlag = {
  id: string
  kind: FreakFlagKind
  label: string
  /** Optional explainer — omitted when the match list speaks for itself. */
  summary?: string
  /** Highlighted match (nailbiter, single-digit scare). */
  match?: FreakFlagMatchDetail
  /** All relevant matches (e.g. every three-game match at the event). */
  matches?: FreakFlagMatchDetail[]
}

export type RecapInsightKind =
  | 'progression_above'
  | 'best_win'
  | 'partner_chemistry'
  | 'win_rate_above'
  | 'busy_weekend'

export type RecapInsight = {
  kind: RecapInsightKind
  title: string
  detail?: string
  discipline?: string
  /** Leading emoji for event-wide cards (chemistry, busy). */
  icon?: string
}

export type PodiumCelebration = {
  kind: 'winner' | 'runner-up' | 'joint-third'
  discipline: string
  disciplineLabel: string
  tournamentCategoryLabel: string
  subtitle?: string
}

export type MilestoneCelebration = {
  id: string
  variant: 'personal_best' | 'matched_best' | 'debut'
  discipline: string
  disciplineLabel: string
  tournamentCategoryLabel: string
  stage: ProgressionStage
  stageLabel: string
  title: string
  detail?: string
}

/** First time reaching a stage at this category + discipline (below semi-final). */
export type StageReachCelebration = {
  stage: 'group-wins' | 'knockout' | 'quarter-final'
  discipline: string
  disciplineLabel: string
  tournamentCategoryLabel: string
}

export type RecapCelebrations = {
  winners: PodiumCelebration[]
  runnerUps: PodiumCelebration[]
  jointThirds: PodiumCelebration[]
  stageReaches: StageReachCelebration[]
  milestones: MilestoneCelebration[]
}

export type TournamentRecap = {
  key: string
  competitionName: string
  dateFrom: string
  dateTo: string
  tournamentCategoryLabel: string
  disciplines: DisciplineRecap[]
  celebrations: RecapCelebrations
  emojiInsights: RecapInsight[]
  otherEventInsights: RecapInsight[]
  recordMilestones: RecapRecordMilestone[]
  freakFlags: FreakFlag[]
  bestWin: BestWinRow | null
  partnerChemistryHighlights: PartnerChemistryHighlight[]
  totalMatches: number
  weekendWinPercent: number | null
}

export type TournamentRecapsResult = {
  recaps: TournamentRecap[]
}

const BUSY_TOURNAMENT_MIN_MATCHES = 7
const RATING_TYPICAL_TOLERANCE = 2
const MAX_EMOJI_CHEMISTRY_INSIGHTS = 1

/** First-time depth milestones shown as podium cards (semi-final+ uses winner/runner-up/joint-3rd). */
const STAGE_REACH_PODIUM_STAGES = [
  'group-wins',
  'knockout',
  'quarter-final',
] as const satisfies readonly ProgressionStage[]

function historyKey(categoryLabel: string, discipline: string): string {
  return `${categoryLabel}\0${discipline}`
}

function categoryLabelForDiscipline(matches: NormalizedMatch[], discipline: string): string {
  const sample = matches.find((m) => m.discipline === discipline)
  return sample?.tournamentCategoryLabel ?? 'Other'
}

function disciplineHistoryMatches(
  weekend: WeekendBucket,
  categoryLabel: string,
  discipline: string,
): NormalizedMatch[] {
  const disciplineMatches = weekend.matches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.discipline === discipline &&
      m.tournamentCategoryLabel === categoryLabel &&
      !isCountyTournament(m),
  )
  if (disciplineMatches.length === 0) return []
  if (!isProgressionTournament(disciplineMatches)) return []
  return disciplineMatches
}

function priorCategoryDisciplineMatches(
  weekend: WeekendBucket,
  categoryLabel: string,
  discipline: string,
): NormalizedMatch[] {
  return weekend.matches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.discipline === discipline &&
      m.tournamentCategoryLabel === categoryLabel,
  )
}

function hasPriorCategoryDisciplineEvent(
  categoryLabel: string,
  discipline: string,
  currentCompetitionName: string,
  allWeekends: WeekendBucket[],
): boolean {
  for (const weekend of allWeekends) {
    if (weekend.competitionName === currentCompetitionName) continue
    if (
      priorCategoryDisciplineMatches(weekend, categoryLabel, discipline).length >
      0
    ) {
      return true
    }
  }
  return false
}

function priorMaxStageRank(
  categoryLabel: string,
  discipline: string,
  currentCompetitionName: string,
  allWeekends: WeekendBucket[],
): number {
  let maxRank = 0

  for (const weekend of allWeekends) {
    if (weekend.competitionName === currentCompetitionName) continue
    const disciplineMatches = disciplineHistoryMatches(
      weekend,
      categoryLabel,
      discipline,
    )
    if (disciplineMatches.length === 0) continue

    const stage = bestStageFromMatches(disciplineMatches)
    if (stage == null) continue
    maxRank = Math.max(maxRank, STAGE_RANK[stage])
  }

  return maxRank
}

function priorWeekendDisciplineMatches(
  weekend: WeekendBucket,
  categoryLabel: string,
  discipline: string | null,
  currentCompetitionName: string,
): NormalizedMatch[] {
  if (weekend.competitionName === currentCompetitionName) return []

  if (discipline == null) {
    const categoryMatches = weekend.matches.filter(
      (m) =>
        isCompetitiveMatch(m) &&
        m.tournamentCategoryLabel === categoryLabel,
    )
    if (categoryMatches.length === 0) return []
    if (!isProgressionTournament(categoryMatches)) return []
    return categoryMatches
  }

  return disciplineHistoryMatches(weekend, categoryLabel, discipline)
}

function countPriorFinishesAtStage(
  categoryLabel: string,
  discipline: string | null,
  stage: ProgressionStage,
  currentCompetitionName: string,
  allWeekends: WeekendBucket[],
): number {
  let count = 0

  for (const weekend of allWeekends) {
    const matches = priorWeekendDisciplineMatches(
      weekend,
      categoryLabel,
      discipline,
      currentCompetitionName,
    )
    if (matches.length === 0) continue
    if (bestStageFromMatches(matches) === stage) count += 1
  }

  return count
}

function ordinalFinish(n: number): string {
  if (n === 1) return '1st'
  if (n === 2) return '2nd'
  if (n === 3) return '3rd'
  return `${n}th`
}

function weekendDisciplineMatches(
  weekendMatches: NormalizedMatch[],
  discipline: string,
): NormalizedMatch[] {
  return weekendMatches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.discipline === discipline &&
      !isCountyTournament(m),
  )
}

function categoryDisciplineMatches(
  weekendMatches: NormalizedMatch[],
  categoryLabel: string,
  discipline: string,
): NormalizedMatch[] {
  return weekendMatches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.discipline === discipline &&
      m.tournamentCategoryLabel === categoryLabel &&
      !isCountyTournament(m),
  )
}

function eventHasWin(matches: NormalizedMatch[]): boolean {
  return matches.some((m) => m.outcome === 'win')
}

function playedGroupOrKnockoutRound(matches: NormalizedMatch[]): boolean {
  return matches.some((m) => {
    const stage = parseRoundToStage(getMatchRound(m))
    return stage === 'group-stages' || stage === 'knockout'
  })
}

/** Knockout / QF depth only counts when the player won a match and did not start the event there. */
function earnedKnockoutOrBetterDepth(
  disciplineMatches: NormalizedMatch[],
  stage: ProgressionStage,
): boolean {
  if (!eventHasWin(disciplineMatches)) return false

  if (stage === 'knockout') {
    if (!disciplineMatches.some((m) => parseRoundToStage(getMatchRound(m)) === 'knockout')) {
      return false
    }
    return playedGroupOrKnockoutRound(disciplineMatches)
  }

  if (stage === 'quarter-final') {
    return shouldCelebrateFirstQuarterFinal(disciplineMatches)
  }

  return true
}

function canCelebrateStageDepth(
  disciplineMatches: NormalizedMatch[],
  stage: StageReachCelebration['stage'],
  celebrateFirstGroupWins: boolean,
): boolean {
  if (stage === 'group-wins') {
    return celebrateFirstGroupWins
  }
  if (stage === 'knockout') {
    return earnedKnockoutOrBetterDepth(disciplineMatches, 'knockout')
  }
  if (stage === 'quarter-final') {
    return earnedKnockoutOrBetterDepth(disciplineMatches, 'quarter-final')
  }
  return false
}

function canCelebratePersonalBest(
  disciplineMatches: NormalizedMatch[],
  bestStage: ProgressionStage,
  currentRank: number,
  priorMax: number,
): boolean {
  if (currentRank <= priorMax) return false
  if (!eventHasWin(disciplineMatches)) return false

  if (bestStage === 'group-wins' || bestStage === 'group-stages') {
    return hasGroupMatchWins(disciplineMatches)
  }

  if (STAGE_RANK[bestStage] >= STAGE_RANK['knockout']) {
    return earnedKnockoutOrBetterDepth(disciplineMatches, bestStage)
  }

  return true
}

function canCelebrateMatchedBest(
  disciplineMatches: NormalizedMatch[],
  bestStage: ProgressionStage,
): boolean {
  if (!eventHasWin(disciplineMatches)) return false

  if (STAGE_RANK[bestStage] >= STAGE_RANK['knockout']) {
    return earnedKnockoutOrBetterDepth(disciplineMatches, bestStage)
  }

  return hasGroupMatchWins(disciplineMatches)
}

function hasJointThirdPodium(
  d: DisciplineRecap,
  weekendMatches: NormalizedMatch[],
): boolean {
  if (d.bestStage !== 'semi-final') return false
  return lostInSemiFinal(weekendDisciplineMatches(weekendMatches, d.discipline))
}

function hasPodiumCrowningDepth(
  d: DisciplineRecap,
  weekendMatches: NormalizedMatch[],
): boolean {
  if (d.bestStage === 'winner' || d.bestStage === 'runner-up') return true
  if (hasJointThirdPodium(d, weekendMatches)) return true
  if (d.bestStage == null) return false
  return STAGE_RANK[d.bestStage] >= STAGE_RANK['semi-final']
}

function hadPriorWinAtCategoryDiscipline(
  categoryLabel: string,
  discipline: string,
  currentCompetitionName: string,
  allWeekends: WeekendBucket[],
): boolean {
  for (const weekend of allWeekends) {
    if (weekend.competitionName === currentCompetitionName) continue
    const matches = priorCategoryDisciplineMatches(
      weekend,
      categoryLabel,
      discipline,
    )
    if (matches.some((m) => m.outcome === 'win')) return true
  }
  return false
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

function deepestNewStageReach(
  currentRank: number,
  priorMax: number,
  podiumRank: number,
  disciplineMatches: NormalizedMatch[],
  celebrateFirstGroupWins: boolean,
): StageReachCelebration['stage'] | null {
  let reached: StageReachCelebration['stage'] | null = null
  let reachedRank = 0

  for (const stage of STAGE_REACH_PODIUM_STAGES) {
    const stageRank = STAGE_RANK[stage]
    if (currentRank < stageRank) continue
    if (stage === 'group-wins') {
      if (!celebrateFirstGroupWins) continue
    } else if (priorMax >= stageRank) {
      continue
    }
    if (podiumRank > 0 && stageRank <= podiumRank) continue
    if (!stagePlayedAtEvent(disciplineMatches, stage, celebrateFirstGroupWins)) {
      continue
    }
    if (!canCelebrateStageDepth(disciplineMatches, stage, celebrateFirstGroupWins)) {
      continue
    }
    if (stageRank > reachedRank) {
      reached = stage
      reachedRank = stageRank
    }
  }

  return reached
}

/** First QF is only celebrated when the player earned their way there with at least one win. */
function shouldCelebrateFirstQuarterFinal(disciplineMatches: NormalizedMatch[]): boolean {
  const wins = disciplineMatches.filter((m) => m.outcome === 'win').length
  if (wins === 0) return false

  const playedEarlierRound = disciplineMatches.some((m) => {
    const stage = parseRoundToStage(getMatchRound(m))
    return stage === 'group-stages' || stage === 'knockout'
  })
  return playedEarlierRound
}

function stagePlayedAtEvent(
  disciplineMatches: NormalizedMatch[],
  stage: ProgressionStage,
  celebrateFirstGroupWins: boolean,
): boolean {
  if (stage === 'group-wins') {
    if (celebrateFirstGroupWins) {
      return disciplineMatches.some((m) => m.outcome === 'win')
    }
    return hasGroupMatchWins(disciplineMatches)
  }

  return disciplineMatches.some(
    (m) => parseRoundToStage(getMatchRound(m)) === stage,
  )
}

function buildCelebrations(
  disciplines: DisciplineRecap[],
  weekendMatches: NormalizedMatch[],
  currentCompetitionName: string,
  allWeekends: WeekendBucket[],
): RecapCelebrations {
  const winners: PodiumCelebration[] = []
  const runnerUps: PodiumCelebration[] = []
  const jointThirds: PodiumCelebration[] = []
  const stageReaches: StageReachCelebration[] = []
  const milestones: MilestoneCelebration[] = []

  for (const d of disciplines) {
    if (d.bestStage !== 'winner' && d.bestStage !== 'runner-up') continue

    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    const priorMax = priorMaxStageRank(
      categoryLabel,
      d.discipline,
      currentCompetitionName,
      allWeekends,
    )

    const podium: PodiumCelebration = {
      kind: d.bestStage === 'winner' ? 'winner' : 'runner-up',
      discipline: d.discipline,
      disciplineLabel: d.disciplineLabel,
      tournamentCategoryLabel: categoryLabel,
    }

    if (d.bestStage === 'winner') {
      const priorWinsInDiscipline = countPriorFinishesAtStage(
        categoryLabel,
        d.discipline,
        'winner',
        currentCompetitionName,
        allWeekends,
      )
      const priorWinsInCategory = countPriorFinishesAtStage(
        categoryLabel,
        null,
        'winner',
        currentCompetitionName,
        allWeekends,
      )
      const winNumber = priorWinsInDiscipline + 1
      if (priorWinsInCategory === 0) {
        podium.subtitle = `Your first ${categoryLabel} title`
      } else if (priorWinsInDiscipline === 0) {
        podium.subtitle = `Your first ${categoryLabel} ${d.disciplineLabel} title`
      } else {
        podium.subtitle = `Your ${ordinalFinish(winNumber)} ${categoryLabel} title`
      }
      winners.push(podium)
    } else {
      if (priorMax < STAGE_RANK['runner-up']) {
        podium.subtitle = `Your first ${categoryLabel} runner-up finish`
      }
      runnerUps.push(podium)
    }
  }

  winners.sort((a, b) => a.discipline.localeCompare(b.discipline))
  runnerUps.sort((a, b) => a.discipline.localeCompare(b.discipline))

  for (const d of disciplines) {
    if (!hasJointThirdPodium(d, weekendMatches)) continue

    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    const priorMax = priorMaxStageRank(
      categoryLabel,
      d.discipline,
      currentCompetitionName,
      allWeekends,
    )

    const podium: PodiumCelebration = {
      kind: 'joint-third',
      discipline: d.discipline,
      disciplineLabel: d.disciplineLabel,
      tournamentCategoryLabel: categoryLabel,
    }

    if (priorMax < STAGE_RANK['semi-final']) {
      podium.subtitle = `Your first ${categoryLabel} semi-final finish`
    }

    jointThirds.push(podium)
  }

  jointThirds.sort((a, b) => a.discipline.localeCompare(b.discipline))

  for (const d of disciplines) {
    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    if (categoryLabel === 'Other') continue

    const isCategoryDebut = !hasPriorCategoryDisciplineEvent(
      categoryLabel,
      d.discipline,
      currentCompetitionName,
      allWeekends,
    )

    if (!isCategoryDebut) continue
    // Podium cards already celebrate first titles / runner-up / joint-3rd finishes.
    if (d.bestStage === 'winner' || d.bestStage === 'runner-up') continue
    if (hasJointThirdPodium(d, weekendMatches)) continue

    const debutStage: ProgressionStage = d.bestStage ?? 'group-stages'
    milestones.push({
      id: `debut-${historyKey(categoryLabel, d.discipline)}`,
      variant: 'debut',
      discipline: d.discipline,
      disciplineLabel: d.disciplineLabel,
      tournamentCategoryLabel: categoryLabel,
      stage: debutStage,
      stageLabel:
        d.bestStageLabel ?? PROGRESSION_STAGE_LABELS[debutStage],
      title: `First ${categoryLabel} tournament`,
      detail: d.disciplineLabel,
    })
  }

  for (const d of disciplines) {
    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    const disciplineMatches = categoryDisciplineMatches(
      weekendMatches,
      categoryLabel,
      d.discipline,
    )
    const hasPrior = hasPriorCategoryDisciplineEvent(
      categoryLabel,
      d.discipline,
      currentCompetitionName,
      allWeekends,
    )
    const celebrateFirstGroupWins =
      hasPrior &&
      eventHasWin(disciplineMatches) &&
      hasGroupMatchWins(disciplineMatches) &&
      !hadPriorWinAtCategoryDiscipline(
        categoryLabel,
        d.discipline,
        currentCompetitionName,
        allWeekends,
      )

    if (d.bestStage == null && !celebrateFirstGroupWins) continue
    if (!isProgressionTournament(disciplineMatches) && !celebrateFirstGroupWins) continue
    if (!hasPrior) continue

    const jointThirdPodium = hasJointThirdPodium(d, weekendMatches)
    const baseStage: ProgressionStage = d.bestStage ?? 'group-stages'
    const currentRank = effectiveStageRank(baseStage, disciplineMatches)
    const priorMax = priorMaxStageRank(
      categoryLabel,
      d.discipline,
      currentCompetitionName,
      allWeekends,
    )

    const podiumRank =
      d.bestStage === 'winner' || d.bestStage === 'runner-up'
        ? currentRank
        : jointThirdPodium
          ? STAGE_RANK['semi-final']
          : 0

    const stageLabel =
      d.bestStageLabel ??
      PROGRESSION_STAGE_LABELS[d.bestStage ?? 'group-wins']

    // Podium cards cover those finishes — no duplicate depth cards.
    let depthCardCoversMilestones = jointThirdPodium

    if (!hasPodiumCrowningDepth(d, weekendMatches)) {
      const newReach = deepestNewStageReach(
        currentRank,
        priorMax,
        podiumRank,
        disciplineMatches,
        celebrateFirstGroupWins,
      )
      if (newReach != null) {
        stageReaches.push({
          stage: newReach,
          discipline: d.discipline,
          disciplineLabel: d.disciplineLabel,
          tournamentCategoryLabel: categoryLabel,
        })
        if (STAGE_RANK[newReach] >= currentRank) {
          depthCardCoversMilestones = true
        }
      }
    }

    if (
      !jointThirdPodium &&
      d.bestStage !== 'winner' &&
      d.bestStage !== 'runner-up' &&
      !depthCardCoversMilestones &&
      d.bestStage != null
    ) {
      if (canCelebratePersonalBest(disciplineMatches, d.bestStage, currentRank, priorMax)) {
        milestones.push({
          id: `pb-${historyKey(categoryLabel, d.discipline)}`,
          variant: 'personal_best',
          discipline: d.discipline,
          disciplineLabel: d.disciplineLabel,
          tournamentCategoryLabel: categoryLabel,
          stage: d.bestStage,
          stageLabel,
          title: 'Personal best',
          detail: `Your deepest ${categoryLabel} ${d.disciplineLabel} run — ${stageLabel}`,
        })
      } else if (
        currentRank === priorMax &&
        priorMax >= STAGE_RANK['knockout'] &&
        canCelebrateMatchedBest(disciplineMatches, d.bestStage)
      ) {
        milestones.push({
          id: `matched-${historyKey(categoryLabel, d.discipline)}`,
          variant: 'matched_best',
          discipline: d.discipline,
          disciplineLabel: d.disciplineLabel,
          tournamentCategoryLabel: categoryLabel,
          stage: d.bestStage,
          stageLabel,
          title: 'Matched your best',
          detail: `As deep as you've gone at ${categoryLabel} ${d.disciplineLabel} before — ${stageLabel}`,
        })
      }
    }
  }

  stageReaches.sort((a, b) => {
    const rankDiff = STAGE_RANK[b.stage] - STAGE_RANK[a.stage]
    if (rankDiff !== 0) return rankDiff
    return a.discipline.localeCompare(b.discipline)
  })

  const seen = new Set<string>()
  const dedupedMilestones = milestones.filter((m) => {
    if (seen.has(m.id)) return false
    seen.add(m.id)
    return true
  })

  dedupedMilestones.sort((a, b) => {
    const rankDiff = STAGE_RANK[b.stage] - STAGE_RANK[a.stage]
    if (rankDiff !== 0) return rankDiff
    if (a.variant !== b.variant) {
      const priority = (v: MilestoneCelebration['variant']) =>
        v === 'personal_best' || v === 'debut' ? 0 : 1
      return priority(a.variant) - priority(b.variant)
    }
    return a.discipline.localeCompare(b.discipline)
  })

  return {
    winners,
    runnerUps,
    jointThirds,
    stageReaches,
    milestones: dedupedMilestones,
  }
}

type WeekendBucket = {
  key: string
  competitionName: string
  matches: NormalizedMatch[]
}

function roundRating(value: number): number {
  return Math.round(value)
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

/** Signed partnership overperformance (actual minus expected win %). */
function formatPartnershipDelta(points: number): string {
  const rounded = roundPercent(points)
  if (rounded > 0) return `+${rounded}%`
  if (rounded < 0) return `${rounded}%`
  return '0%'
}

export function partnerChemistryDetail(
  partnerName: string,
  weekendOverperformance: number,
  priorOverperformance: number,
  overallOverperformance: number,
): string {
  const atEvent = formatPartnershipDelta(weekendOverperformance)
  const overall = formatPartnershipDelta(overallOverperformance)
  const prior = formatPartnershipDelta(priorOverperformance)
  const overallShift = roundPercent(overallOverperformance - priorOverperformance)

  let overallClause: string
  if (overallShift > 0) {
    overallClause = `Your overall chemistry with ${partnerName} improved from ${prior} to ${overall}.`
  } else if (weekendOverperformance > priorOverperformance) {
    overallClause = `Your overall chemistry with ${partnerName} is ${overall} — stronger than your usual ${prior} together.`
  } else {
    overallClause = `Your overall chemistry with ${partnerName} is ${overall}.`
  }

  return `Chemistry at this event: ${atEvent} vs rating expectation. ${overallClause}`
}

/** Short copy for recap emoji cards (side-by-side layout). */
export function partnerChemistryDetailShort(
  weekendOverperformance: number,
  overallOverperformance: number,
): string {
  const atEvent = formatPartnershipDelta(weekendOverperformance)
  const overall = formatPartnershipDelta(overallOverperformance)
  return `${atEvent} at this event · overall ${overall}`
}

function formatOrdinal(rank: number): string {
  const mod100 = rank % 100
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`
  switch (rank % 10) {
    case 1:
      return `${rank}st`
    case 2:
      return `${rank}nd`
    case 3:
      return `${rank}rd`
    default:
      return `${rank}th`
  }
}

function buildDisciplineInsights(
  d: DisciplineRecap,
  bestWin: BestWinRow | null,
  strengthRank: number | null,
): RecapInsight[] {
  const insights: RecapInsight[] = []

  if (bestWin != null && bestWin.match.discipline === d.discipline) {
    let detail = `Beat ${bestWin.match.opponents} (team rated ${bestWin.opponentTeamRating})`
    if (strengthRank != null) {
      detail += ` — ${formatOrdinal(strengthRank)} strongest beaten all time`
    }
    insights.push({
      kind: 'best_win',
      title: 'Best win of the competition',
      detail,
      discipline: d.discipline,
    })
  }

  if (d.progressionVsTypical === 'above' && d.bestStageLabel) {
    insights.push({
      kind: 'progression_above',
      title: `Great run in ${d.discipline}`,
      detail: `Reached ${d.bestStageLabel} — further than you typically get in this event`,
      discipline: d.discipline,
    })
  }

  return insights
}

function attachDisciplineInsights(
  disciplines: DisciplineRecap[],
  bestWin: BestWinRow | null,
  strengthRank: number | null,
): DisciplineRecap[] {
  return disciplines.map((d) => ({
    ...d,
    disciplineInsights: buildDisciplineInsights(d, bestWin, strengthRank),
  }))
}

function buildEmojiInsights(
  partnerHighlights: PartnerChemistryHighlight[],
  weekendMatches: NormalizedMatch[],
): RecapInsight[] {
  const insights: RecapInsight[] = []

  for (const highlight of partnerHighlights.slice(0, MAX_EMOJI_CHEMISTRY_INSIGHTS)) {
    insights.push({
      kind: 'partner_chemistry',
      icon: '🤝',
      title: `Even better with ${highlight.partnerName}`,
      detail: partnerChemistryDetailShort(
        highlight.weekendOverperformance,
        highlight.overallOverperformance,
      ),
    })
  }

  const competitive = weekendMatches.filter(isCompetitiveMatch)
  if (competitive.length >= BUSY_TOURNAMENT_MIN_MATCHES) {
    insights.push({
      kind: 'busy_weekend',
      icon: '🥵',
      title: 'Busy tournament',
      detail: `${competitive.length} competitive matches`,
    })
  }

  return insights
}

function sortMatchesByDate(matches: NormalizedMatch[]): NormalizedMatch[] {
  return [...matches].sort((a, b) => a.date.localeCompare(b.date))
}

function groupWeekends(matches: NormalizedMatch[]): WeekendBucket[] {
  const competitive = matches.filter(isCompetitiveMatch)
  const byCompetition = new Map<string, NormalizedMatch[]>()

  for (const match of competitive) {
    const key = match.competitionName
    const bucket = byCompetition.get(key) ?? []
    bucket.push(match)
    byCompetition.set(key, bucket)
  }

  const buckets: WeekendBucket[] = [...byCompetition.entries()].map(([key, weekendMatches]) => ({
    key,
    competitionName: key,
    matches: weekendMatches,
  }))

  buckets.sort((a, b) => {
    const dateA = a.matches.reduce((max, m) => (m.date > max ? m.date : max), '')
    const dateB = b.matches.reduce((max, m) => (m.date > max ? m.date : max), '')
    return dateB.localeCompare(dateA)
  })

  return buckets
}

function weekendDateRange(matches: NormalizedMatch[]): { dateFrom: string; dateTo: string } {
  const dates = matches.map((m) => m.date).filter((d) => d && d !== '—')
  const sorted = [...dates].sort()
  return {
    dateFrom: sorted[0] ?? '—',
    dateTo: sorted[sorted.length - 1] ?? sorted[0] ?? '—',
  }
}

function dominantCategoryLabel(matches: NormalizedMatch[]): string {
  const counts = new Map<string, number>()
  for (const match of matches) {
    const label = match.tournamentCategoryLabel
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Other'
}

function ratingDeltaForDiscipline(matches: NormalizedMatch[]): {
  ratingStart: number | null
  ratingEnd: number | null
  ratingDelta: number | null
} {
  const sorted = sortMatchesByDate(matches.filter(isCompetitiveMatch))
  let ratingStart: number | null = null
  let ratingEnd: number | null = null

  for (const match of sorted) {
    const rating = getPlayerRating(match)
    if (rating == null) continue
    if (ratingStart == null) ratingStart = rating
    ratingEnd = rating
  }

  const ratingDelta =
    ratingStart != null && ratingEnd != null
      ? roundRating(ratingEnd - ratingStart)
      : null

  return { ratingStart, ratingEnd, ratingDelta }
}

function computeOverperformance(matches: NormalizedMatch[]): number | null {
  const competitive = matches.filter(
    (m) =>
      isCompetitiveMatch(m) &&
      m.partnerName != null &&
      (m.outcome === 'win' || m.outcome === 'loss'),
  )
  if (competitive.length === 0) return null

  let wins = 0
  let expectedSum = 0
  let ratedGames = 0

  for (const match of competitive) {
    if (match.outcome === 'win') wins += 1
    const expected = getMatchExpectedWinProbability(match)
    if (expected != null) {
      expectedSum += expected
      ratedGames += 1
    }
  }

  if (ratedGames === 0) return null

  const actualWinPercent = roundPercent((wins / competitive.length) * 100)
  const expectedWinPercent = roundPercent((expectedSum / ratedGames) * 100)
  return roundPercent(actualWinPercent - expectedWinPercent)
}

function isNailbiterMatch(match: NormalizedMatch): boolean {
  const games = getMatchGames(match)
  if (games.length !== 3) return false
  return games.every((g) => g.margin <= 2)
}

function isSingleDigitScareMatch(match: NormalizedMatch): boolean {
  if (!isCompetitiveMatch(match) || match.outcome !== 'win') return false
  const games = getMatchGames(match)
  return games.some((g) => g.player < g.opponent && g.player <= 9)
}

function roundLabelForMatch(match: NormalizedMatch): string | null {
  const round = getMatchRound(match)
  const formatted = formatMatchStageLabel(round)
  if (formatted) return formatted
  const trimmed = round.trim()
  if (
    trimmed === '' ||
    trimmed.toUpperCase() === 'N/A' ||
    trimmed.toUpperCase() === 'NA'
  ) {
    return null
  }
  return trimmed
}

function freakFlagMatchDetail(match: NormalizedMatch): FreakFlagMatchDetail {
  return {
    discipline: match.discipline,
    partnerName: match.partnerName,
    roundLabel: roundLabelForMatch(match),
    opponents: match.opponents,
    scoreSummary: match.scoreSummary,
  }
}

function freakFlagMatchDetailForSingleDigit(
  match: NormalizedMatch,
): FreakFlagMatchDetail {
  const games: FreakFlagGameScore[] = getMatchGames(match).map((g) => {
    const lostToSingleDigits = g.player < g.opponent && g.player <= 9
    return {
      player: g.player,
      opponent: g.opponent,
      highlight: lostToSingleDigits ? 'lost_single_digit' : undefined,
    }
  })

  return {
    ...freakFlagMatchDetail(match),
    games,
  }
}

function detectFreakFlags(matches: NormalizedMatch[]): FreakFlag[] {
  const competitive = matches.filter(isCompetitiveMatch)
  const flags: FreakFlag[] = []

  for (const match of competitive) {
    if (isNailbiterMatch(match)) {
      flags.push({
        id: `nailbiter-${match.discipline}-${match.date}`,
        kind: 'nailbiter',
        label: 'Nailbiter!',
        match: freakFlagMatchDetail(match),
      })
      break
    }
  }

  for (const match of competitive) {
    if (isSingleDigitScareMatch(match)) {
      flags.push({
        id: `single-digit-${match.discipline}-${match.date}`,
        kind: 'single_digit_scare',
        label: 'Single-digit scare',
        match: freakFlagMatchDetailForSingleDigit(match),
      })
      break
    }
  }

  const threeGameMatches = competitive.filter(
    (m) => getMatchVolume(m).gamesPlayed === 3,
  )
  if (
    competitive.length > 0 &&
    threeGameMatches.length === competitive.length
  ) {
    flags.push({
      id: 'money-worth',
      kind: 'money_worth',
      label: "Getting your money's worth!",
      matches: threeGameMatches.map(freakFlagMatchDetail),
    })
  }

  return flags
}

function compareToTypical(
  value: number,
  typicalValues: number[],
  tolerance = 0,
): ComparisonLevel | null {
  if (typicalValues.length === 0) return null
  const typical = medianRank(typicalValues)
  if (typical == null) return null
  if (value >= typical - tolerance) {
    return value > typical + tolerance ? 'above' : 'typical'
  }
  return null
}

function buildDisciplineRecaps(
  weekendMatches: NormalizedMatch[],
  allWeekends: WeekendBucket[],
  currentKey: string,
): DisciplineRecap[] {
  const disciplines = new Map<string, NormalizedMatch[]>()
  for (const match of weekendMatches.filter(isCompetitiveMatch)) {
    const bucket = disciplines.get(match.discipline) ?? []
    bucket.push(match)
    disciplines.set(match.discipline, bucket)
  }

  const otherWeekends = allWeekends.filter((w) => w.key !== currentKey)

  return [...disciplines.entries()]
    .map(([discipline, disciplineMatches]) => {
      const sample = disciplineMatches[0]!
      const { ratingStart, ratingEnd, ratingDelta } =
        ratingDeltaForDiscipline(disciplineMatches)

      const otherDeltas: number[] = []
      const otherStageRanks: number[] = []

      for (const weekend of otherWeekends) {
        const otherDisciplineMatches = weekend.matches.filter(
          (m) => isCompetitiveMatch(m) && m.discipline === discipline,
        )
        if (otherDisciplineMatches.length === 0) continue

        const { ratingDelta: otherDelta } =
          ratingDeltaForDiscipline(otherDisciplineMatches)
        if (otherDelta != null) otherDeltas.push(otherDelta)

        if (
          !otherDisciplineMatches.some(isCountyTournament) &&
          isProgressionTournament(otherDisciplineMatches)
        ) {
          const stage = bestStageFromMatches(otherDisciplineMatches)
          if (stage != null) otherStageRanks.push(STAGE_RANK[stage])
        }
      }

      let ratingVsTypical: ComparisonLevel | null = null
      if (ratingDelta != null) {
        ratingVsTypical = compareToTypical(
          ratingDelta,
          otherDeltas,
          RATING_TYPICAL_TOLERANCE,
        )
      }

      let bestStage: ProgressionStage | null = null
      let bestStageLabel: string | null = null
      let progressionVsTypical: ComparisonLevel | null = null

      const canProgress =
        !disciplineMatches.some(isCountyTournament) &&
        isProgressionTournament(disciplineMatches)

      if (canProgress) {
        bestStage = bestStageFromMatches(disciplineMatches)
        if (bestStage != null) {
          bestStageLabel = PROGRESSION_STAGE_LABELS[bestStage]
          const rank = STAGE_RANK[bestStage]
          progressionVsTypical = compareToTypical(rank, otherStageRanks)
        }
      }

      const matchWins = disciplineMatches.filter((m) => m.outcome === 'win').length
      const matchLosses = disciplineMatches.filter((m) => m.outcome === 'loss').length

      return {
        discipline,
        disciplineLabel: sample.disciplineLabel,
        ratingStart,
        ratingEnd,
        ratingDelta,
        ratingVsTypical,
        bestStage,
        bestStageLabel,
        progressionVsTypical,
        matchWins,
        matchLosses,
        disciplineInsights: [],
      }
    })
    .sort((a, b) => a.discipline.localeCompare(b.discipline))
}

function buildPartnerChemistryHighlights(
  weekendMatches: NormalizedMatch[],
  allCompetitive: NormalizedMatch[],
  competitionName: string,
): PartnerChemistryHighlight[] {
  const weekendCompetitive = weekendMatches.filter(isCompetitiveMatch)

  const partnersInWeekend = new Set<string>()
  for (const match of weekendCompetitive) {
    if (match.partnerName) partnersInWeekend.add(match.partnerName)
  }

  const highlights: PartnerChemistryHighlight[] = []

  for (const partnerName of partnersInWeekend) {
    const weekendWithPartner = weekendCompetitive.filter(
      (m) => m.partnerName === partnerName,
    )
    if (weekendWithPartner.length === 0) continue

    const priorMatches = allCompetitive.filter(
      (m) =>
        m.partnerName === partnerName && m.competitionName !== competitionName,
    )

    const priorCompetitive = priorMatches.filter(
      (m) =>
        isCompetitiveMatch(m) &&
        (m.outcome === 'win' || m.outcome === 'loss'),
    )

    if (priorCompetitive.length === 0) continue

    const priorOverperformance = computeOverperformance(priorCompetitive)
    const weekendOverperformance = computeOverperformance(weekendWithPartner)
    if (weekendOverperformance == null) continue

    const improved =
      priorOverperformance == null
        ? weekendOverperformance > 0
        : weekendOverperformance > priorOverperformance

    if (!improved || priorOverperformance == null) continue

    const allWithPartner = [...priorCompetitive, ...weekendWithPartner]
    const overallOverperformance = computeOverperformance(allWithPartner)
    if (overallOverperformance == null) continue

    const positiveAtEvent = weekendOverperformance > 0
    const positiveOverall = overallOverperformance > 0
    if (!positiveAtEvent && !positiveOverall) continue

    highlights.push({
      partnerName,
      priorOverperformance,
      weekendOverperformance,
      overallOverperformance,
      detail: partnerChemistryDetail(
        partnerName,
        weekendOverperformance,
        priorOverperformance,
        overallOverperformance,
      ),
    })
  }

  return highlights.sort(
    (a, b) => b.weekendOverperformance - a.weekendOverperformance,
  )
}

function buildOtherEventInsights(
  weekendMatches: NormalizedMatch[],
  overallWinPercent: number | null,
): RecapInsight[] {
  const insights: RecapInsight[] = []
  const competitive = weekendMatches.filter(isCompetitiveMatch)

  if (overallWinPercent != null && competitive.length > 0) {
    const wins = competitive.filter((m) => m.outcome === 'win').length
    const weekendWinPercent = roundPercent((wins / competitive.length) * 100)
    if (weekendWinPercent > overallWinPercent) {
      insights.push({
        kind: 'win_rate_above',
        icon: '💪',
        title: 'Great form at this event',
        detail: `${weekendWinPercent}% match wins vs ${overallWinPercent}% overall`,
      })
    }
  }

  return insights
}

function shortenStrengthMilestoneDetails(
  milestones: RecapRecordMilestone[],
  bestWin: BestWinRow | null,
  strengthRank: number | null,
): RecapRecordMilestone[] {
  if (bestWin == null || strengthRank == null) return milestones

  const key = bestWinRowKey(bestWin)
  return milestones.map((m) => {
    if (m.kind !== 'best_win_strength' || m.id !== `best_win_strength-${key}`) {
      return m
    }
    return {
      ...m,
      detail: `${formatOrdinal(strengthRank)} strongest beaten all time — see Best wins below.`,
    }
  })
}


function buildWeekendRecap(
  bucket: WeekendBucket,
  allWeekends: WeekendBucket[],
  allCompetitive: NormalizedMatch[],
  overallWinPercent: number | null,
): TournamentRecap {
  const { dateFrom, dateTo } = weekendDateRange(bucket.matches)
  const disciplines = buildDisciplineRecaps(bucket.matches, allWeekends, bucket.key)
  const bestWin = findBestWinInMatches(bucket.matches)
  const partnerChemistryHighlights = buildPartnerChemistryHighlights(
    bucket.matches,
    allCompetitive,
    bucket.competitionName,
  )
  const freakFlags = detectFreakFlags(bucket.matches)
  const competitive = bucket.matches.filter(isCompetitiveMatch)
  const wins = competitive.filter((m) => m.outcome === 'win').length
  const weekendWinPercent =
    competitive.length > 0 ? roundPercent((wins / competitive.length) * 100) : null

  const priorMatches = allCompetitive.filter(
    (m) => m.competitionName !== bucket.competitionName,
  )

  const strengthRank =
    bestWin != null
      ? (detectBestWinRecapMilestones(bucket.matches, priorMatches).find(
          (m) =>
            m.kind === 'strength' &&
            bestWinRowKey(m.row) === bestWinRowKey(bestWin),
        )?.rank ?? null)
      : null

  const disciplinesWithInsights = attachDisciplineInsights(
    disciplines,
    bestWin,
    strengthRank,
  )

  let recordMilestones = buildRecapRecordMilestones(
    bucket.matches,
    priorMatches,
  )
  recordMilestones = shortenStrengthMilestoneDetails(
    recordMilestones,
    bestWin,
    strengthRank,
  )

  const emojiInsights = buildEmojiInsights(
    partnerChemistryHighlights,
    bucket.matches,
  )
  const otherEventInsights = buildOtherEventInsights(
    bucket.matches,
    overallWinPercent,
  )

  const celebrations = buildCelebrations(
    disciplines,
    bucket.matches,
    bucket.competitionName,
    allWeekends,
  )

  return {
    key: bucket.key,
    competitionName: bucket.competitionName,
    dateFrom,
    dateTo,
    tournamentCategoryLabel: dominantCategoryLabel(bucket.matches),
    disciplines: disciplinesWithInsights,
    celebrations,
    emojiInsights,
    otherEventInsights,
    recordMilestones,
    freakFlags,
    bestWin,
    partnerChemistryHighlights,
    totalMatches: competitive.length,
    weekendWinPercent,
  }
}

export function computeTournamentRecaps(
  matches: NormalizedMatch[],
): TournamentRecapsResult {
  const allCompetitive = matches.filter(isCompetitiveMatch)
  const weekends = groupWeekends(matches)

  const overallWins = allCompetitive.filter((m) => m.outcome === 'win').length
  const overallWinPercent =
    allCompetitive.length > 0
      ? roundPercent((overallWins / allCompetitive.length) * 100)
      : null

  const recaps = weekends.map((bucket) =>
    buildWeekendRecap(bucket, weekends, allCompetitive, overallWinPercent),
  )

  return { recaps }
}
