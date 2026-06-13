import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { DashboardTabId } from '../components/dashboard/DashboardTabs'
import {
  DASHBOARD_SECTIONS,
  dashboardSectionHref,
  isDashboardSectionId,
  type DashboardSectionId,
} from '../lib/dashboardSections'

type Navigator = {
  selectTab: (tab: DashboardTabId) => void
  activeTab: DashboardTabId
}

type DashboardNavigationContextValue = {
  navigateToSection: (sectionId: DashboardSectionId) => void
  registerNavigator: (navigator: Navigator | null) => void
  scrollTarget: DashboardSectionId | null
  clearScrollTarget: () => void
}

const DashboardNavigationContext =
  createContext<DashboardNavigationContextValue | null>(null)

export function DashboardNavigationProvider({ children }: { children: ReactNode }) {
  const [scrollTarget, setScrollTarget] = useState<DashboardSectionId | null>(null)
  const navigatorRef = useRef<Navigator | null>(null)

  const registerNavigator = useCallback((next: Navigator | null) => {
    navigatorRef.current = next
  }, [])

  const navigateToSection = useCallback((sectionId: DashboardSectionId) => {
    const meta = DASHBOARD_SECTIONS[sectionId]
    window.history.replaceState(null, '', dashboardSectionHref(sectionId))
    setScrollTarget(sectionId)
    navigatorRef.current?.selectTab(meta.tab)
  }, [])

  const clearScrollTarget = useCallback(() => {
    setScrollTarget(null)
  }, [])

  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (isDashboardSectionId(hash)) {
      setScrollTarget(hash)
      navigatorRef.current?.selectTab(DASHBOARD_SECTIONS[hash].tab)
    }
  }, [])

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (!isDashboardSectionId(hash)) return
      setScrollTarget(hash)
      navigatorRef.current?.selectTab(DASHBOARD_SECTIONS[hash].tab)
    }

    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <DashboardNavigationContext.Provider
      value={{
        navigateToSection,
        registerNavigator,
        scrollTarget,
        clearScrollTarget,
      }}
    >
      {children}
    </DashboardNavigationContext.Provider>
  )
}

export function useDashboardNavigation(): DashboardNavigationContextValue {
  const value = useContext(DashboardNavigationContext)
  if (!value) {
    throw new Error('useDashboardNavigation must be used within DashboardNavigationProvider')
  }
  return value
}

const SECTION_LINK_CLASS =
  'mt-1.5 inline-block text-xs font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200'

type DashboardSectionLinkProps = {
  sectionId: DashboardSectionId
  children?: ReactNode
  className?: string
}

export function DashboardSectionLink({
  sectionId,
  children,
  className = SECTION_LINK_CLASS,
}: DashboardSectionLinkProps) {
  const { navigateToSection } = useDashboardNavigation()
  const label = children ?? `View ${DASHBOARD_SECTIONS[sectionId].label} ↓`

  return (
    <a
      href={dashboardSectionHref(sectionId)}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        navigateToSection(sectionId)
      }}
    >
      {label}
    </a>
  )
}
