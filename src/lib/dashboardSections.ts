export type DashboardSectionId =
  | 'best-wins'
  | 'opponent-matchups'
  | 'partner-chemistry'

export type DashboardSectionTab = 'people'

export const DASHBOARD_SECTIONS: Record<
  DashboardSectionId,
  { tab: DashboardSectionTab; label: string }
> = {
  'best-wins': { tab: 'people', label: 'Best wins' },
  'opponent-matchups': {
    tab: 'people',
    label: 'Nemeses & favourite opponents',
  },
  'partner-chemistry': { tab: 'people', label: 'Partner chemistry' },
}

export function isDashboardSectionId(value: string): value is DashboardSectionId {
  return value in DASHBOARD_SECTIONS
}

export function dashboardSectionHref(sectionId: DashboardSectionId): string {
  return `#${sectionId}`
}
