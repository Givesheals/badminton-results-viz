/** Ticket build-out stages for screenshotting Tournament progression (1 = shell … 5 = full). */
export const TOURNAMENT_PROGRESSION_BUILD_STAGES = [1, 2, 3, 4, 5] as const
export type TournamentProgressionBuildStage =
  (typeof TOURNAMENT_PROGRESSION_BUILD_STAGES)[number]

export type TournamentProgressionBuildFeatures = {
  /** Stage ≥ 2 — Typical run (median, bar, flavor text) */
  showTypicalRun: boolean
  /** Stage ≥ 3 — Finish distribution chart */
  showFinishDistribution: boolean
  /** Stage ≥ 4 — Filters + Showing… scope line (default primary combo) */
  showFilters: boolean
  /** Stage ≥ 5 — Info icon + pop-out on the section title */
  showInfo: boolean
}

export const TOURNAMENT_PROGRESSION_BUILD_STAGE_META: Record<
  TournamentProgressionBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'Shell',
    summary: 'Card frame + Tournament progression title only',
  },
  2: {
    shortLabel: 'Typical run',
    summary: 'Typical run — median depth, bar, and flavor text',
  },
  3: {
    shortLabel: 'Distribution',
    summary: 'Finish distribution heading + graph',
  },
  4: {
    shortLabel: 'Filters',
    summary: 'Filters + Showing… line with default primary-combo selection',
  },
  5: {
    shortLabel: 'Info',
    summary: 'Info icon + pop-out on the section title',
  },
}

/** Full feature set (stage 5 / no progressive gating). */
export function fullTournamentProgressionBuildFeatures(): TournamentProgressionBuildFeatures {
  return getTournamentProgressionBuildFeatures(5)
}

export function getTournamentProgressionBuildFeatures(
  stage: TournamentProgressionBuildStage,
): TournamentProgressionBuildFeatures {
  return {
    showTypicalRun: stage >= 2,
    showFinishDistribution: stage >= 3,
    showFilters: stage >= 4,
    showInfo: stage >= 5,
  }
}
