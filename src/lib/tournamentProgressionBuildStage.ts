/** Ticket build-out stages for screenshotting Tournament progression (1 = shell … 6 = full). */
export const TOURNAMENT_PROGRESSION_BUILD_STAGES = [1, 2, 3, 4, 5, 6] as const
export type TournamentProgressionBuildStage =
  (typeof TOURNAMENT_PROGRESSION_BUILD_STAGES)[number]

export type TournamentProgressionBuildFeatures = {
  /** Stage ≥ 2 — Showing X of Y matches (full dataset before filters) */
  showMatchCount: boolean
  /** Stage ≥ 3 — Typical run (average, bar, flavor text) */
  showTypicalRun: boolean
  /** Stage ≥ 4 — Finish distribution chart */
  showFinishDistribution: boolean
  /** Stage ≥ 5 — Filters + Showing… scope line (default primary combo) */
  showFilters: boolean
  /** Stage ≥ 6 — Info icon + pop-out on the section title */
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
    shortLabel: 'Data',
    summary: 'Showing N of N matches — full dataset for narration',
  },
  3: {
    shortLabel: 'Typical run',
    summary: 'Typical run — average depth, bar, and flavor text',
  },
  4: {
    shortLabel: 'Distribution',
    summary: 'Finish distribution heading + graph',
  },
  5: {
    shortLabel: 'Filters',
    summary: 'Filters + Showing… line with default primary-combo selection',
  },
  6: {
    shortLabel: 'Info',
    summary: 'Info icon + pop-out on the section title',
  },
}

/** Full feature set (stage 6 / no progressive gating). */
export function fullTournamentProgressionBuildFeatures(): TournamentProgressionBuildFeatures {
  return getTournamentProgressionBuildFeatures(6)
}

export function getTournamentProgressionBuildFeatures(
  stage: TournamentProgressionBuildStage,
): TournamentProgressionBuildFeatures {
  return {
    showMatchCount: stage >= 2,
    showTypicalRun: stage >= 3,
    showFinishDistribution: stage >= 4,
    showFilters: stage >= 5,
    showInfo: stage >= 6,
  }
}
