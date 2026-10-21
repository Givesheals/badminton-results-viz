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

function useAppHeaderOffset() {
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const header = document.querySelector('[data-app-header]')
    if (!(header instanceof HTMLElement)) return

    const update = () => setOffset(Math.round(header.getBoundingClientRect().height))
    update()
    const observer = new ResizeObserver(update)
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  return offset
}

export function DashboardTabs({ importedAt, panels }: Props) {
  const baseId = useId()
  const tabRefs = useRef<Partial<Record<DashboardTabId, HTMLButtonElement>>>({})
  const sentinelRef = useRef<HTMLDivElement>(null)
  const suppressSectionScrollRef = useRef(false)
  const [activeTab, setActiveTab] = useState<DashboardTabId>(readStoredTab)
  const [stuck, setStuck] = useState(false)
  const headerOffset = useAppHeaderOffset()
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
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => setStuck(!entry.isIntersecting),
      { rootMargin: `-${headerOffset}px 0px 0px 0px`, threshold: 0 },
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [headerOffset])

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
      <div ref={sentinelRef} aria-hidden className="h-px" />
      <div
        className={`sticky z-20 -mx-4 bg-white px-4 py-3 sm:-mx-6 sm:px-6 ${
          stuck ? 'border-b border-ink-200 shadow-[0_8px_18px_-6px_rgba(20,25,38,0.35)]' : ''
        }`}
        style={{ top: headerOffset }}
      >
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-[#f7f6fa] p-1"
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
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
                  selected
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-brand-700 hover:text-brand-600'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
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
