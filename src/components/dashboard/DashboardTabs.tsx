import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { useDashboardNavigation } from '../../context/DashboardNavigationContext'
import { DASHBOARD_SECTIONS } from '../../lib/dashboardSections'

export type DashboardTabId =
  | 'latest-event'
  | 'notes'
  | 'this-season'
  | 'all-time'
  | 'people'

const TAB_STORAGE_KEY = 'dashboard-active-tab'

/** Hidden for MVP; set to true to restore the This season tab. */
const THIS_SEASON_TAB_ENABLED = false

const ALL_TABS: { id: DashboardTabId; label: string }[] = [
  { id: 'latest-event', label: 'Events' },
  { id: 'notes', label: 'Notes' },
  { id: 'people', label: 'People' },
  { id: 'all-time', label: 'Stats' },
  { id: 'this-season', label: 'This season' },
]

const TABS = THIS_SEASON_TAB_ENABLED
  ? ALL_TABS
  : ALL_TABS.filter((tab) => tab.id !== 'this-season')

const TAB_IDS = TABS.map((tab) => tab.id)

const DEFAULT_TAB: DashboardTabId = 'latest-event'

function isVisibleTabId(value: string | null): value is DashboardTabId {
  return value != null && TAB_IDS.includes(value as DashboardTabId)
}

function readStoredTab(): DashboardTabId {
  if (typeof window === 'undefined') return DEFAULT_TAB
  const saved = window.sessionStorage.getItem(TAB_STORAGE_KEY)
  return isVisibleTabId(saved) ? saved : DEFAULT_TAB
}

type Props = {
  importedAt: string
  panels: Record<DashboardTabId, ReactNode>
}

export function DashboardTabs({ importedAt, panels }: Props) {
  const baseId = useId()
  const tabRefs = useRef<Partial<Record<DashboardTabId, HTMLButtonElement>>>({})
  const suppressSectionScrollRef = useRef(false)
  const [activeTab, setActiveTab] = useState<DashboardTabId>(readStoredTab)
  const { registerNavigator, scrollTarget, clearScrollTarget, clearMilestoneTarget } =
    useDashboardNavigation()

  const selectTab = useCallback((id: DashboardTabId) => {
    setActiveTab(id)
    window.sessionStorage.setItem(TAB_STORAGE_KEY, id)
  }, [])

  useEffect(() => {
    registerNavigator({ selectTab, activeTab })
    return () => registerNavigator(null)
  }, [activeTab, registerNavigator, selectTab])

  useEffect(() => {
    suppressSectionScrollRef.current = true
    const params = new URLSearchParams(window.location.search)
    const tabFromUrl = params.get('tab')
    const hasDrawDeepLink = params.get('draw') != null
    // Draw companion moved to tournament page; deep links still open Events for now.
    const initialTab: DashboardTabId = hasDrawDeepLink
      ? 'latest-event'
      : tabFromUrl === 'notes' && TAB_IDS.includes('notes' as DashboardTabId)
        ? ('notes' as DashboardTabId)
        : isVisibleTabId(tabFromUrl)
          ? tabFromUrl
          : DEFAULT_TAB
    selectTab(initialTab)
    clearScrollTarget()
    clearMilestoneTarget()
    // Keep section scroll suppressed until after mount so deep-link targets
    // don't jump the page when data first loads.
    requestAnimationFrame(() => {
      suppressSectionScrollRef.current = false
    })
  }, [clearMilestoneTarget, clearScrollTarget, importedAt, selectTab])

  useEffect(() => {
    if (!scrollTarget || suppressSectionScrollRef.current) return
    const meta = DASHBOARD_SECTIONS[scrollTarget]
    if (activeTab !== meta.tab) {
      selectTab(meta.tab)
      return
    }

    const sectionId = scrollTarget
    clearScrollTarget()
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    })
  }, [activeTab, clearScrollTarget, scrollTarget, selectTab])

  const focusTab = useCallback((id: DashboardTabId) => {
    tabRefs.current[id]?.focus()
  }, [])

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tabId: DashboardTabId) => {
      const index = TAB_IDS.indexOf(tabId)
      if (index < 0) return

      let nextIndex: number | null = null

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          nextIndex = (index + 1) % TAB_IDS.length
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          nextIndex = (index - 1 + TAB_IDS.length) % TAB_IDS.length
          break
        case 'Home':
          nextIndex = 0
          break
        case 'End':
          nextIndex = TAB_IDS.length - 1
          break
        default:
          return
      }

      event.preventDefault()
      const nextId = TAB_IDS[nextIndex]
      selectTab(nextId)
      focusTab(nextId)
    },
    [focusTab, selectTab],
  )

  return (
    <div>
      <div className="sticky top-0 z-30 -mx-1 bg-white px-1">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="flex gap-1 overflow-x-auto border-b border-ink-200"
        >
          {TABS.map((tab) => {
            const selected = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  tabRefs.current[tab.id] = node ?? undefined
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${tab.id}`}
                aria-selected={selected}
                aria-controls={`${baseId}-panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                  selected
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-brand-700 hover:text-brand-600'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4">
        {TABS.map((tab) => {
          const selected = activeTab === tab.id
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`${baseId}-panel-${tab.id}`}
              aria-labelledby={`${baseId}-tab-${tab.id}`}
              hidden={!selected}
              className="space-y-6"
            >
              {selected ? panels[tab.id] : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function TabSubgroupHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-ink-800">{children}</h3>
  )
}
