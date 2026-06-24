import type { MatchOutcome, NormalizedMatch } from '../types/matchHistory'
import {
  computeBestWins,
  countEligibleRatedWinsInMatches,
  findBestWinInMatches,
  findBigUpsetWinsInMatches,
  rankBestWinRow,
  type BestWinRow,
} from './bestWins'
import {
  clampDisplayWinChance,
  formatUpsetWinChanceDisplay,
} from './ratingWinChance'
import {
  buildRecapRecordMilestones,
  type RecapRecordMilestone,
} from './recapRecordMilestones'
import { sortMatchesChronologically } from './matchChronology'
import {
  buildNoteContextFromMatch,
  type OpponentNoteMatchContext,
} from './opponentNotes'
import { isCompetitiveMatch } from './matchExclusions'
import { getMatchGames, getMatchVolume } from './matchScores'
import { getMatchExpectedWinProbability, getPlayerRating } from './ratings'
import {
  bestStageFromMatches,
  competitionAgeLabelFromMatch,
  earnedKnockoutOrBetterDepth,
  eventHasCompetitiveWin,
  formatMatchStageLabel,
  getMatchRound,
  isCountyTournament,
  isProgressionTournament,
  isSeniorCountyMatch,
  medianRank,
  parseRoundToStage,
  hasGroupMatchWins,
  qualifiesForThirdPlace,
  PROGRESSION_STAGE_LABELS,
  SENIOR_COUNTY_DEBUT_DETAIL,
  SENIOR_COUNTY_DEBUT_TITLE,
  STAGE_RANK,
  type ProgressionStage,
} from './tournamentProgression'

export type ComparisonLevel = 'above' | 'typical'

import type { DashboardSectionId } from './dashboardSections'

export type RecapSummaryCard = {
  id: string
  icon: string
  label: string
  detail?: string
  sectionId?: DashboardSectionId
}

export type DisciplineMatchHighlight = {
  id: string
  label: string
  /** When set, the chip opens a tap-friendly explanation popover. */
  popoverText?: string
}

export type DisciplineMatchRecap = {
  matchKey: string
  date: string
  opponents: string
  partnerName: string | null
  showPartnerName: boolean
  showDate: boolean
  outcome: MatchOutcome
  scoreSummary: string
  roundLabel: string | null
  highlights: DisciplineMatchHighlight[]
  noteContext: OpponentNoteMatchContext
}

export type DisciplineRecap = {
  discipline: string
  disciplineLabel: string
  partnerName: string | null
  ratingStart: number | null
  ratingEnd: number | null
  ratingDelta: number | null
  ratingVsTypical: ComparisonLevel | null
  bestStage: ProgressionStage | null
  bestStageLabel: string | null
  progressionVsTypical: ComparisonLevel | null
  matchWins: number
  matchLosses: number
  eventCallouts: RecapSummaryCard[]
  matches: DisciplineMatchRecap[]
}

/** Stable identity for a recap match row (aligned with bestWinRowKey). */
export function recapMatchKey(match: NormalizedMatch): string {
  return `${match.competitionName}\0${match.date}\0${match.discipline}\0${match.opponents}`
}

export type PartnerChemistryHighlight = {
  partnerName: string
  discipline: string
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
  | 'biggest_upset'
  | 'partner_chemistry'
  | 'win_rate_above'
  | 'busy_weekend'

export type RecapInsightScope = 'yours' | 'event'

export type RecapInsight = {
  kind: RecapInsightKind
  scope?: RecapInsightScope
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
  competitionAgeLabel: string | null
  subtitle?: string
}

export type MilestoneCelebration = {
  id: string
  variant: 'personal_best' | 'matched_best' | 'debut'
  discipline: string
  disciplineLabel: string
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
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
  competitionAgeLabel: string | null
}

export type SeniorCountyDebutCelebration = {
  title: string
  detail: string
  disciplines: { discipline: string; disciplineLabel: string }[]
}

export type RecapCelebrations = {
  winners: PodiumCelebration[]
  runnerUps: PodiumCelebration[]
  jointThirds: PodiumCelebration[]
  stageReaches: StageReachCelebration[]
  milestones: MilestoneCelebration[]
  seniorCountyDebut: SeniorCountyDebutCelebration | null
}

export type TournamentRecap = {
  key: string
  competitionName: string
  dateFrom: string
  dateTo: string
  tournamentCategoryLabel: string
  disciplines: DisciplineRecap[]
  eventSummaries: RecapSummaryCard[]
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
const MAX_PARTNER_CHEMISTRY_CALLOUTS_PER_DISCIPLINE = 1

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

function competitionAgeLabelForDiscipline(
  matches: NormalizedMatch[],
  discipline: string,
): string | null {
  const sample = matches.find((m) => m.discipline === discipline)
  return sample ? competitionAgeLabelFromMatch(sample) : null
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
  currentWeekendKey: string,
  allWeekends: WeekendBucket[],
): boolean {
  for (const weekend of allWeekends) {
    if (weekend.key === currentWeekendKey) continue
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
  currentWeekendKey: string,
  allWeekends: WeekendBucket[],
): number {
  let maxRank = 0

  for (const weekend of allWeekends) {
    if (weekend.key === currentWeekendKey) continue
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
  currentWeekendKey: string,
): NormalizedMatch[] {
  if (weekend.key === currentWeekendKey) return []

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
  currentWeekendKey: string,
  allWeekends: WeekendBucket[],
): number {
  let count = 0

  for (const weekend of allWeekends) {
    const matches = priorWeekendDisciplineMatches(
      weekend,
      categoryLabel,
      discipline,
      currentWeekendKey,
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

function canCelebrateStageDepth(
  disciplineMatches: NormalizedMatch[],
  stage: StageReachCelebration['stage'],
  celebrateFirstGroupWins: boolean,
  bestStage: ProgressionStage | null,
): boolean {
  if (stage === 'group-wins') {
    return celebrateFirstGroupWins
  }
  if (stage === 'knockout') {
    return earnedKnockoutOrBetterDepth(disciplineMatches, 'knockout', bestStage)
  }
  if (stage === 'quarter-final') {
    return earnedKnockoutOrBetterDepth(disciplineMatches, 'quarter-final', bestStage)
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
  if (!eventHasCompetitiveWin(disciplineMatches)) return false

  if (bestStage === 'group-wins' || bestStage === 'group-stages') {
    return hasGroupMatchWins(disciplineMatches)
  }

  if (STAGE_RANK[bestStage] >= STAGE_RANK['knockout']) {
    return earnedKnockoutOrBetterDepth(disciplineMatches, bestStage, bestStage)
  }

  return true
}

function canCelebrateMatchedBest(
  disciplineMatches: NormalizedMatch[],
  bestStage: ProgressionStage,
): boolean {
  if (!eventHasCompetitiveWin(disciplineMatches)) return false

  if (STAGE_RANK[bestStage] >= STAGE_RANK['knockout']) {
    return earnedKnockoutOrBetterDepth(disciplineMatches, bestStage, bestStage)
  }

  return hasGroupMatchWins(disciplineMatches)
}

function hasJointThirdPodium(
  d: DisciplineRecap,
  weekendMatches: NormalizedMatch[],
): boolean {
  if (d.bestStage !== 'semi-final') return false
  const disciplineMatches = weekendDisciplineMatches(weekendMatches, d.discipline)
  return qualifiesForThirdPlace(disciplineMatches, d.bestStage)
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
  currentWeekendKey: string,
  allWeekends: WeekendBucket[],
): boolean {
  for (const weekend of allWeekends) {
    if (weekend.key === currentWeekendKey) continue
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
  bestStage: ProgressionStage | null,
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
    if (!canCelebrateStageDepth(disciplineMatches, stage, celebrateFirstGroupWins, bestStage)) {
      continue
    }
    if (stageRank > reachedRank) {
      reached = stage
      reachedRank = stageRank
    }
  }

  return reached
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
  currentWeekendKey: string,
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
    const competitionAgeLabel = competitionAgeLabelForDiscipline(weekendMatches, d.discipline)
    const priorMax = priorMaxStageRank(
      categoryLabel,
      d.discipline,
      currentWeekendKey,
      allWeekends,
    )

    const podium: PodiumCelebration = {
      kind: d.bestStage === 'winner' ? 'winner' : 'runner-up',
      discipline: d.discipline,
      disciplineLabel: d.disciplineLabel,
      tournamentCategoryLabel: categoryLabel,
      competitionAgeLabel,
    }

    if (d.bestStage === 'winner') {
      const priorWinsInDiscipline = countPriorFinishesAtStage(
        categoryLabel,
        d.discipline,
        'winner',
        currentWeekendKey,
        allWeekends,
      )
      const priorWinsInCategory = countPriorFinishesAtStage(
        categoryLabel,
        null,
        'winner',
        currentWeekendKey,
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
    const competitionAgeLabel = competitionAgeLabelForDiscipline(weekendMatches, d.discipline)
    const priorMax = priorMaxStageRank(
      categoryLabel,
      d.discipline,
      currentWeekendKey,
      allWeekends,
    )

    const podium: PodiumCelebration = {
      kind: 'joint-third',
      discipline: d.discipline,
      disciplineLabel: d.disciplineLabel,
      tournamentCategoryLabel: categoryLabel,
      competitionAgeLabel,
    }

    if (priorMax < STAGE_RANK['semi-final']) {
      podium.subtitle = `Your first ${categoryLabel} semi-final finish`
    }

    jointThirds.push(podium)
  }

  jointThirds.sort((a, b) => a.discipline.localeCompare(b.discipline))

  for (const d of disciplines) {
    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    const competitionAgeLabel = competitionAgeLabelForDiscipline(weekendMatches, d.discipline)
    if (categoryLabel === 'Other') continue

    const isCategoryDebut = !hasPriorCategoryDisciplineEvent(
      categoryLabel,
      d.discipline,
      currentWeekendKey,
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
      competitionAgeLabel,
      stage: debutStage,
      stageLabel:
        d.bestStageLabel ?? PROGRESSION_STAGE_LABELS[debutStage],
      title: `First ${categoryLabel} tournament`,
      detail: d.disciplineLabel,
    })
  }

  for (const d of disciplines) {
    const categoryLabel = categoryLabelForDiscipline(weekendMatches, d.discipline)
    const competitionAgeLabel = competitionAgeLabelForDiscipline(weekendMatches, d.discipline)
    const disciplineMatches = categoryDisciplineMatches(
      weekendMatches,
      categoryLabel,
      d.discipline,
    )
    const hasPrior = hasPriorCategoryDisciplineEvent(
      categoryLabel,
      d.discipline,
      currentWeekendKey,
      allWeekends,
    )
    const celebrateFirstGroupWins =
      hasPrior &&
      eventHasCompetitiveWin(disciplineMatches) &&
      hasGroupMatchWins(disciplineMatches) &&
      !hadPriorWinAtCategoryDiscipline(
        categoryLabel,
        d.discipline,
        currentWeekendKey,
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
      currentWeekendKey,
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
        d.bestStage,
      )
      if (newReach != null) {
        stageReaches.push({
          stage: newReach,
          discipline: d.discipline,
          disciplineLabel: d.disciplineLabel,
          tournamentCategoryLabel: categoryLabel,
          competitionAgeLabel,
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
          competitionAgeLabel,
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
          competitionAgeLabel,
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
    seniorCountyDebut: buildSeniorCountyDebutCelebration(
      weekendMatches,
      allWeekends,
      currentWeekendKey,
    ),
  }
}

function seniorCountyDisciplines(
  weekendMatches: NormalizedMatch[],
): { discipline: string; disciplineLabel: string }[] {
  const seen = new Set<string>()
  const disciplines: { discipline: string; disciplineLabel: string }[] = []

  for (const match of weekendMatches) {
    if (!isCompetitiveMatch(match) || !isSeniorCountyMatch(match)) continue
    if (seen.has(match.discipline)) continue
    seen.add(match.discipline)
    disciplines.push({
      discipline: match.discipline,
      disciplineLabel: match.disciplineLabel,
    })
  }

  disciplines.sort((a, b) => a.discipline.localeCompare(b.discipline))
  return disciplines
}

function hasPriorSeniorCountyOutsideWeekend(
  allWeekends: WeekendBucket[],
  currentWeekendKey: string,
): boolean {
  for (const weekend of allWeekends) {
    if (weekend.key === currentWeekendKey) continue
    if (
      weekend.matches.some(
        (m) => isCompetitiveMatch(m) && isSeniorCountyMatch(m),
      )
    ) {
      return true
    }
  }
  return false
}

function buildSeniorCountyDebutCelebration(
  weekendMatches: NormalizedMatch[],
  allWeekends: WeekendBucket[],
  currentWeekendKey: string,
): SeniorCountyDebutCelebration | null {
  const disciplines = seniorCountyDisciplines(weekendMatches)
  if (disciplines.length === 0) return null

  if (hasPriorSeniorCountyOutsideWeekend(allWeekends, currentWeekendKey)) {
    return null
  }

  return {
    title: SENIOR_COUNTY_DEBUT_TITLE,
    detail: SENIOR_COUNTY_DEBUT_DETAIL,
    disciplines,
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

function allTimeStrengthRank(
  row: BestWinRow,
  weekendMatches: NormalizedMatch[],
  priorMatches: NormalizedMatch[],
): number | null {
  const { byOpponentStrength } = computeBestWins([...priorMatches, ...weekendMatches])
  return rankBestWinRow(row, byOpponentStrength)
}

function strongestBeatenPopoverText(
  row: BestWinRow,
  disciplineLabel: string,
  allTimeRank: number | null,
): string {
  const context = `Your highest-rated opponent beaten in ${disciplineLabel} at this event.`
  const rating = `Their team was rated ${row.opponentTeamRating}.`
  if (allTimeRank != null) {
    return `${context} ${rating} Among all your rated wins, that's your ${formatOrdinal(allTimeRank)} strongest beaten victory.`
  }
  return `${context} ${rating}`
}

function bigUpsetExplanation(row: BestWinRow): string {
  const chance = formatUpsetWinChanceDisplay(
    clampDisplayWinChance(row.preMatchWinChancePercent),
  )
  return `You won this match even though your opponent was rated ${row.ratingGap} points higher on average beforehand — about a ${chance} chance of winning going in.`
}

type DisciplineTimeline = {
  eventCallouts: RecapSummaryCard[]
  matches: DisciplineMatchRecap[]
}

function buildDisciplineTimeline(
  d: DisciplineRecap,
  disciplineMatches: NormalizedMatch[],
  weekendMatches: NormalizedMatch[],
  priorMatches: NormalizedMatch[],
  partnerChemistryHighlights: PartnerChemistryHighlight[],
  sharedPartner: string | null,
  showMatchDates: boolean,
): DisciplineTimeline {
  const eventCallouts: RecapSummaryCard[] = []
  const bestWin = findBestWinInMatches(disciplineMatches)

  if (d.progressionVsTypical === 'above' && d.bestStageLabel) {
    eventCallouts.push({
      id: 'great-run',
      icon: '🏃',
      label: 'Great run',
      detail: `Reached ${d.bestStageLabel} — further than you typically get in this event`,
    })
  }

  for (const highlight of partnerChemistryHighlights
    .filter((h) => h.discipline === d.discipline)
    .slice(0, MAX_PARTNER_CHEMISTRY_CALLOUTS_PER_DISCIPLINE)) {
    eventCallouts.push({
      id: `partner-chemistry-${highlight.partnerName}`,
      icon: '🤝',
      label: `Even better with ${highlight.partnerName}`,
      detail: partnerChemistryDetailShort(
        highlight.weekendOverperformance,
        highlight.overallOverperformance,
      ),
      sectionId: 'partner-chemistry',
    })
  }

  const highlightsByKey = new Map<string, DisciplineMatchHighlight[]>()

  function addHighlight(key: string, highlight: DisciplineMatchHighlight): void {
    const list = highlightsByKey.get(key) ?? []
    list.push(highlight)
    highlightsByKey.set(key, list)
  }

  if (bestWin != null && countEligibleRatedWinsInMatches(disciplineMatches) > 1) {
    const allTimeRank = allTimeStrengthRank(bestWin, weekendMatches, priorMatches)
    addHighlight(recapMatchKey(bestWin.match), {
      id: 'your-strongest-beaten',
      label: 'Your strongest beaten',
      popoverText: strongestBeatenPopoverText(
        bestWin,
        d.disciplineLabel,
        allTimeRank,
      ),
    })
  }

  for (const upset of findBigUpsetWinsInMatches(disciplineMatches)) {
    const key = recapMatchKey(upset.match)
    addHighlight(key, {
      id: `big-upset-${key}`,
      label: 'Big upset!',
      popoverText: bigUpsetExplanation(upset),
    })
  }

  const matches = sortMatchesChronologically(disciplineMatches).map((match) => {
      const key = recapMatchKey(match)
      return {
        matchKey: key,
        date: match.date,
        opponents: match.opponents,
        partnerName: match.partnerName,
        showPartnerName: match.partnerName != null && sharedPartner == null,
        showDate: showMatchDates,
        outcome: match.outcome,
        scoreSummary: match.scoreSummary,
        roundLabel: formatMatchStageLabel(getMatchRound(match)),
        highlights: highlightsByKey.get(key) ?? [],
        noteContext: buildNoteContextFromMatch(match),
      }
    })

  return {
    eventCallouts,
    matches,
  }
}

function calendarDaysBetween(earlier: string, later: string): number {
  const start = new Date(`${earlier}T12:00:00`).getTime()
  const end = new Date(`${later}T12:00:00`).getTime()
  return Math.round((end - start) / 86_400_000)
}

function clusterConsecutiveDates(dates: string[]): string[][] {
  const sorted = [...new Set(dates.filter((d) => d && d !== '—'))].sort()
  if (sorted.length === 0) return []

  const clusters: string[][] = [[sorted[0]!]]
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!
    const curr = sorted[i]!
    if (calendarDaysBetween(prev, curr) === 1) {
      clusters[clusters.length - 1]!.push(curr)
    } else {
      clusters.push([curr])
    }
  }
  return clusters
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

  const buckets: WeekendBucket[] = []

  for (const [competitionName, competitionMatches] of byCompetition) {
    const clusters = clusterConsecutiveDates(competitionMatches.map((m) => m.date))

    for (const clusterDates of clusters) {
      const dateSet = new Set(clusterDates)
      const clusterMatches = competitionMatches.filter((m) => dateSet.has(m.date))
      const clusterStart = clusterDates[0]!
      buckets.push({
        key: `${competitionName}\0${clusterStart}`,
        competitionName,
        matches: clusterMatches,
      })
    }
  }

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
  const sorted = sortMatchesChronologically(matches.filter(isCompetitiveMatch))
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

function uniformPartnerName(matches: NormalizedMatch[]): string | null {
  const competitive = matches.filter(isCompetitiveMatch)
  const partners = competitive.map((m) => m.partnerName).filter(Boolean)
  if (partners.length === 0 || partners.length !== competitive.length) return null
  const unique = new Set(partners)
  return unique.size === 1 ? partners[0]! : null
}

function buildDisciplineRecaps(
  weekendMatches: NormalizedMatch[],
  allWeekends: WeekendBucket[],
  currentKey: string,
  priorMatches: NormalizedMatch[],
  partnerChemistryHighlights: PartnerChemistryHighlight[],
  showMatchDates: boolean,
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

      const sharedPartner = uniformPartnerName(disciplineMatches)

      const recap: DisciplineRecap = {
        discipline,
        disciplineLabel: sample.disciplineLabel,
        partnerName: sharedPartner,
        ratingStart,
        ratingEnd,
        ratingDelta,
        ratingVsTypical,
        bestStage,
        bestStageLabel,
        progressionVsTypical,
        matchWins,
        matchLosses,
        eventCallouts: [],
        matches: [],
      }

      const timeline = buildDisciplineTimeline(
        recap,
        disciplineMatches,
        weekendMatches,
        priorMatches,
        partnerChemistryHighlights,
        sharedPartner,
        showMatchDates,
      )

      return {
        ...recap,
        eventCallouts: timeline.eventCallouts,
        matches: timeline.matches,
      }
    })
    .sort((a, b) => a.discipline.localeCompare(b.discipline))
}

function buildPartnerChemistryHighlights(
  weekendMatches: NormalizedMatch[],
  allCompetitive: NormalizedMatch[],
  weekendMatchKeys: Set<string>,
): PartnerChemistryHighlight[] {
  const weekendCompetitive = weekendMatches.filter(isCompetitiveMatch)

  const partnersByDiscipline = new Map<string, Set<string>>()
  for (const match of weekendCompetitive) {
    if (!match.partnerName) continue
    const partners = partnersByDiscipline.get(match.discipline) ?? new Set<string>()
    partners.add(match.partnerName)
    partnersByDiscipline.set(match.discipline, partners)
  }

  const highlights: PartnerChemistryHighlight[] = []

  for (const [discipline, partners] of partnersByDiscipline) {
    for (const partnerName of partners) {
      const weekendWithPartner = weekendCompetitive.filter(
        (m) => m.discipline === discipline && m.partnerName === partnerName,
      )
      if (weekendWithPartner.length === 0) continue

      const priorMatches = allCompetitive.filter(
        (m) =>
          m.discipline === discipline &&
          m.partnerName === partnerName &&
          !weekendMatchKeys.has(recapMatchKey(m)),
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
        discipline,
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
  }

  return highlights.sort(
    (a, b) => b.weekendOverperformance - a.weekendOverperformance,
  )
}

function buildEventSummaries(
  weekendMatches: NormalizedMatch[],
  overallWinPercent: number | null,
): RecapSummaryCard[] {
  const summaries: RecapSummaryCard[] = []
  const competitive = weekendMatches.filter(isCompetitiveMatch)

  if (overallWinPercent != null && competitive.length > 0) {
    const wins = competitive.filter((m) => m.outcome === 'win').length
    const weekendWinPercent = roundPercent((wins / competitive.length) * 100)
    if (weekendWinPercent > overallWinPercent) {
      summaries.push({
        id: 'great-form',
        icon: '💪',
        label: 'Great form',
        detail: `${weekendWinPercent}% match wins at this event vs ${overallWinPercent}% overall`,
      })
    }
  }

  if (competitive.length >= BUSY_TOURNAMENT_MIN_MATCHES) {
    summaries.push({
      id: 'busy-weekend',
      icon: '🥵',
      label: "You've been busy!",
      detail: `${competitive.length} competitive matches at this event`,
    })
  }

  return summaries
}

function buildWeekendRecap(
  bucket: WeekendBucket,
  allWeekends: WeekendBucket[],
  allCompetitive: NormalizedMatch[],
  overallWinPercent: number | null,
): TournamentRecap {
  const { dateFrom, dateTo } = weekendDateRange(bucket.matches)
  const showMatchDates = dateFrom !== dateTo
  const weekendMatchKeys = new Set(bucket.matches.map((m) => recapMatchKey(m)))
  const priorMatches = allCompetitive.filter(
    (m) => !weekendMatchKeys.has(recapMatchKey(m)),
  )
  const partnerChemistryHighlights = buildPartnerChemistryHighlights(
    bucket.matches,
    allCompetitive,
    weekendMatchKeys,
  )
  const disciplines = buildDisciplineRecaps(
    bucket.matches,
    allWeekends,
    bucket.key,
    priorMatches,
    partnerChemistryHighlights,
    showMatchDates,
  )
  const bestWin = findBestWinInMatches(bucket.matches)
  const freakFlags = detectFreakFlags(bucket.matches)
  const competitive = bucket.matches.filter(isCompetitiveMatch)
  const wins = competitive.filter((m) => m.outcome === 'win').length
  const weekendWinPercent =
    competitive.length > 0 ? roundPercent((wins / competitive.length) * 100) : null

  const recordMilestones = buildRecapRecordMilestones(
    bucket.matches,
    priorMatches,
  )

  const eventSummaries = buildEventSummaries(bucket.matches, overallWinPercent)

  const celebrations = buildCelebrations(
    disciplines,
    bucket.matches,
    bucket.key,
    allWeekends,
  )

  return {
    key: bucket.key,
    competitionName: bucket.competitionName,
    dateFrom,
    dateTo,
    tournamentCategoryLabel: dominantCategoryLabel(bucket.matches),
    disciplines,
    eventSummaries,
    celebrations,
    emojiInsights: [],
    otherEventInsights: [],
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
