import type { DrawDisciplineGroup, DrawMatchup } from './drawTypes'
import type { DrawScoutCompetition, DrawScoutEntrant } from './drawScout'

/** Ticket build-out stages for screenshotting Draw companion (1 = shell … 7 = full). */
export const DRAW_COMPANION_BUILD_STAGES = [1, 2, 3, 4, 5, 6, 7] as const
export type DrawCompanionBuildStage = (typeof DRAW_COMPANION_BUILD_STAGES)[number]

export type DrawCompanionBuildFeatures = {
  /** Stage ≥ 2 — matchup cards under Companion */
  showDraw: boolean
  /** Stage ≥ 3 — Whose draw picker */
  showPlayerPicker: boolean
  /** Stage ≥ 4 — accordion + past games (no notes) */
  showMatchHistory: boolean
  /** Stage ≥ 5 — compact Win/Loss result cards */
  showCompletedResults: boolean
  /** Stage ≥ 6 — cross-discipline “still playing” banner */
  showBusyBanner: boolean
  /** Stage ≥ 7 — You may also meet + opponent-TBD probable next */
  showYouMayAlsoMeet: boolean
  /**
   * Stages 2–4 — OS + OD only (singles + one pair draw for screenshots).
   * Stages 5–7 — full progressive multi-discipline fixture (incl. XD).
   */
  earlyDisciplinesOnly: boolean
}

export const DRAW_COMPANION_BUILD_STAGE_META: Record<
  DrawCompanionBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'Shell',
    summary: 'Companion chip + content shell (no draw yet)',
  },
  2: {
    shortLabel: 'Flat draw',
    summary: 'OS + OD flat cards — no accordion, games, or notes',
  },
  3: {
    shortLabel: 'Picker',
    summary: 'Whose draw — favourites first',
  },
  4: {
    shortLabel: 'History',
    summary: 'Accordion + past games (no notes)',
  },
  5: {
    shortLabel: 'Completed',
    summary: 'Win/Loss compact cards + all disciplines',
  },
  6: {
    shortLabel: 'Busy',
    summary: 'Callum still playing OD banner',
  },
  7: {
    shortLabel: 'May meet',
    summary: 'You may also meet + probable next',
  },
}

export function getDrawCompanionBuildFeatures(
  stage: DrawCompanionBuildStage,
): DrawCompanionBuildFeatures {
  return {
    showDraw: stage >= 2,
    showPlayerPicker: stage >= 3,
    showMatchHistory: stage >= 4,
    showCompletedResults: stage >= 5,
    showBusyBanner: stage >= 6,
    showYouMayAlsoMeet: stage >= 7,
    earlyDisciplinesOnly: stage >= 2 && stage <= 4,
  }
}

/** Disciplines shown on ticket stages 2–4 (singles + doubles pair example). */
const EARLY_STAGE_DISCIPLINE_CODES = new Set(['OS', 'OD'])

function transformMatchup(
  matchup: DrawMatchup,
  features: DrawCompanionBuildFeatures,
): DrawMatchup | null {
  // Opponent-TBD probable next belongs to ticket 7.
  if (!features.showYouMayAlsoMeet && matchup.opponentPending) {
    return null
  }

  if (features.showCompletedResults) {
    return matchup
  }

  // Before ticket 5, every matchup looks upcoming (no Win/Loss compact card).
  const { result: _result, ...rest } = matchup
  return rest
}

function transformDisciplineGroup(
  group: DrawDisciplineGroup,
  features: DrawCompanionBuildFeatures,
): DrawDisciplineGroup | null {
  const matchups = group.matchups
    .map((matchup) => transformMatchup(matchup, features))
    .filter((matchup): matchup is DrawMatchup => matchup != null)

  if (matchups.length === 0) return null
  return { ...group, matchups }
}

function transformEntrant(
  entrant: DrawScoutEntrant,
  features: DrawCompanionBuildFeatures,
): DrawScoutEntrant {
  let groups = entrant.disciplineGroups
    .map((group) => transformDisciplineGroup(group, features))
    .filter((group): group is DrawDisciplineGroup => group != null)

  if (features.earlyDisciplinesOnly) {
    const early = groups.filter((group) =>
      EARLY_STAGE_DISCIPLINE_CODES.has(group.disciplineCode),
    )
    groups = early.length > 0 ? early : groups.slice(0, 1)
  }

  return { ...entrant, disciplineGroups: groups }
}

/**
 * Shape competition fixture data to match the selected ticket build stage.
 * Notes are never included in build-stage screenshots (handled separately in UI).
 */
export function applyDrawCompanionBuildStage(
  competition: DrawScoutCompetition,
  stage: DrawCompanionBuildStage,
): DrawScoutCompetition {
  const features = getDrawCompanionBuildFeatures(stage)

  return {
    ...competition,
    busyPlayersByName: features.showBusyBanner
      ? competition.busyPlayersByName
      : undefined,
    laterOpponentsByEntrant: features.showYouMayAlsoMeet
      ? competition.laterOpponentsByEntrant
      : {},
    entrants: competition.entrants.map((entrant) => transformEntrant(entrant, features)),
  }
}
