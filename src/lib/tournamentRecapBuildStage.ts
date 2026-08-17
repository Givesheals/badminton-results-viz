/** Ticket build-out stages for screenshotting Events / tournament recap (1 = shell … 10 = full). */
export const TOURNAMENT_RECAP_BUILD_STAGES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const
export type TournamentRecapBuildStage = (typeof TOURNAMENT_RECAP_BUILD_STAGES)[number]

export type TournamentRecapBuildFeatures = {
  /** Stage ≥ 2 — By discipline section */
  showDisciplines: boolean
  /** Stage ≥ 3 — match wins % card (incl. 100% treatment) */
  showWinPercent: boolean
  /** Stage ≥ 4 — Winner / Runner-up / Third Place podium cards */
  showPodium: boolean
  /** Stage ≥ 4 — first-tournament (`debut`) milestone cards */
  showDebutMilestones: boolean
  /** Stage ≥ 4 — personal best + matched best cards */
  showPersonalBests: boolean
  /** Stage ≥ 4 — Senior County Debut card */
  showSeniorCountyDebut: boolean
  /** Stage ≥ 5 — competition callouts (Great form, busy, tough luck) */
  showEventSummaries: boolean
  /** Stage ≥ 6 — per-discipline callouts (Great run, chemistry) */
  showDisciplineCallouts: boolean
  /** Stage ≥ 7 — match highlight chips (Strongest beaten, Big upset) */
  showMatchHighlights: boolean
  /** Stage ≥ 8 — all-time record milestone cards */
  showRecordMilestones: boolean
  /** Stage ≥ 9 — curiosities / freak flags */
  showFreakFlags: boolean
  /** Stage ≥ 10 — opponent notes icon on match rows */
  showNotes: boolean
}

export const TOURNAMENT_RECAP_BUILD_STAGE_META: Record<
  TournamentRecapBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'Shell',
    summary: 'Event title, older/newer nav, category chip, date range',
  },
  2: {
    shortLabel: 'Disciplines',
    summary: 'By discipline — rating, W–L, stage, partner, match rows',
  },
  3: {
    shortLabel: 'Win %',
    summary: 'Match wins % card (incl. 100% treatment)',
  },
  4: {
    shortLabel: 'Results',
    summary:
      'Podium, first tournament, personal best / matched best, Senior County Debut',
  },
  5: {
    shortLabel: 'Event callouts',
    summary: 'Great form / busy / tough luck competition cards',
  },
  6: {
    shortLabel: 'Discipline callouts',
    summary: 'Great run / chemistry callouts under each discipline',
  },
  7: {
    shortLabel: 'Match emojis',
    summary: 'Strongest beaten / Big upset chips on match rows',
  },
  8: {
    shortLabel: 'Records',
    summary: 'All-time record milestone cards',
  },
  9: {
    shortLabel: 'Curiosities',
    summary: 'Curiosities section at the bottom of the event card',
  },
  10: {
    shortLabel: 'Notes',
    summary: 'Opponent notes icon on match rows',
  },
}

/** Full feature set (stage 10 / no progressive gating). */
export function fullTournamentRecapBuildFeatures(): TournamentRecapBuildFeatures {
  return getTournamentRecapBuildFeatures(10)
}

export function getTournamentRecapBuildFeatures(
  stage: TournamentRecapBuildStage,
): TournamentRecapBuildFeatures {
  return {
    showDisciplines: stage >= 2,
    showWinPercent: stage >= 3,
    showPodium: stage >= 4,
    showDebutMilestones: stage >= 4,
    showPersonalBests: stage >= 4,
    showSeniorCountyDebut: stage >= 4,
    showEventSummaries: stage >= 5,
    showDisciplineCallouts: stage >= 6,
    showMatchHighlights: stage >= 7,
    showRecordMilestones: stage >= 8,
    showFreakFlags: stage >= 9,
    showNotes: stage >= 10,
  }
}
