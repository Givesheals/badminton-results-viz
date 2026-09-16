/** Ticket build-out stages for screenshotting Tournament partners (1 = shell … 8 = full). */
export const PARTNER_HIGHLIGHTS_BUILD_STAGES = [1, 2, 3, 3.5, 4, 5, 6, 7, 8] as const
export type PartnerHighlightsBuildStage = (typeof PARTNER_HIGHLIGHTS_BUILD_STAGES)[number]

export type PartnerHighlightsBuildFeatures = {
  /** Stage ≥ 2 — Doubles and Mixed family sections (always both, even if empty) */
  showDisciplines: boolean
  /** Stage ≥ 3 — Partner cards (name + event count, top 2, Show more) */
  showPartnerCards: boolean
  /** Stage 3.5 — Force both families empty so screenshots show the no-partners look */
  forceEmptyFamilies: boolean
  /** Stage ≥ 4 — Finish-count badges on partner cards */
  showStageChips: boolean
  /** Stage ≥ 5 — Partner cards become accordions of stage groups and tournaments */
  showHistoryAccordion: boolean
  /** Stage ≥ 6 — Expand a tournament to see matches in chronological order */
  showMatches: boolean
  /** Stage ≥ 7 — Per-family filters bar */
  showFilters: boolean
  /** Stage ≥ 8 — Information button on the section title */
  showInfo: boolean
}

export const PARTNER_HIGHLIGHTS_BUILD_STAGE_META: Record<
  PartnerHighlightsBuildStage,
  { shortLabel: string; summary: string }
> = {
  1: {
    shortLabel: 'Shell',
    summary: 'Tournament partners card and title only',
  },
  2: {
    shortLabel: 'Disciplines',
    summary: 'Doubles and Mixed sections, even if a discipline has no partners',
  },
  3: {
    shortLabel: 'Partners',
    summary: 'Partner cards with event counts — top 2, plus Show more',
  },
  3.5: {
    shortLabel: 'Empty',
    summary: 'Doubles and Mixed with no partners to show',
  },
  4: {
    shortLabel: 'Badges',
    summary: 'Finish badges for how far the partnership has gone',
  },
  5: {
    shortLabel: 'History',
    summary: 'Partner name becomes an accordion of events grouped by stage reached',
  },
  6: {
    shortLabel: 'Matches',
    summary: 'Expand a tournament to see each match in chronological order',
  },
  7: {
    shortLabel: 'Filters',
    summary: 'Filters bar on each discipline section',
  },
  8: {
    shortLabel: 'Info',
    summary: 'Information button on the Tournament partners title',
  },
}

/** Full feature set (stage 8 / no progressive gating). */
export function fullPartnerHighlightsBuildFeatures(): PartnerHighlightsBuildFeatures {
  return getPartnerHighlightsBuildFeatures(8)
}

export function getPartnerHighlightsBuildFeatures(
  stage: PartnerHighlightsBuildStage,
): PartnerHighlightsBuildFeatures {
  return {
    showDisciplines: stage >= 2,
    showPartnerCards: stage >= 3,
    forceEmptyFamilies: stage === 3.5,
    showStageChips: stage >= 4,
    showHistoryAccordion: stage >= 5,
    showMatches: stage >= 6,
    showFilters: stage >= 7,
    showInfo: stage >= 8,
  }
}
