import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

export type DashboardTabId =
  | 'latest-event'
  | 'this-season'
  | 'all-time'
  | 'people'

const TAB_STORAGE_KEY = 'dashboard-active-tab'

const TABS: { id: DashboardTabId; label: string; subtitle: string }[] = [
  {
    id: 'latest-event',
    label: 'Latest event',
    subtitle: 'How did my last tournament go?',
  },
  {
    id: 'this-season',
    label: 'This season',
    subtitle: "How's my season going so far?",
  },
  {
    id: 'all-time',
    label: 'All time',
    subtitle: 'My career in numbers — and how I play',
  },
  {
    id: 'people',
    label: 'People',
    subtitle: 'Who do I play with and against?',
  },
]

const TAB_IDS = TABS.map((tab) => tab.id)

const DEFAULT_TAB: DashboardTabId = 'latest-event'

function isDashboardTabId(value: string | null): value is DashboardTabId {
  return value != null && TAB_IDS.includes(value as DashboardTabId)
}

function readStoredTab(): DashboardTabId {
  if (typeof window === 'undefined') return DEFAULT_TAB
  const saved = window.sessionStorage.getItem(TAB_STORAGE_KEY)
  return isDashboardTabId(saved) ? saved : DEFAULT_TAB
}

type Props = {
  importedAt: string
  panels: Record<DashboardTabId, ReactNode>
}

export function DashboardTabs({ importedAt, panels }: Props) {
  const baseId = useId()
  const tabRefs = useRef<Partial<Record<DashboardTabId, HTMLButtonElement>>>({})
  const [activeTab, setActiveTab] = useState<DashboardTabId>(readStoredTab)

  const selectTab = useCallback((id: DashboardTabId) => {
    setActiveTab(id)
    window.sessionStorage.setItem(TAB_STORAGE_KEY, id)
  }, [])

  useEffect(() => {
    selectTab(DEFAULT_TAB)
  }, [importedAt, selectTab])

  const activeMeta = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]

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
    <div className="space-y-4">
      <div className="sticky top-0 z-10 -mx-1 space-y-2 bg-white/95 px-1 pb-2 pt-1 backdrop-blur-sm">
        <div
          role="tablist"
          aria-label="Dashboard sections"
          className="-mx-1 overflow-x-auto px-1"
        >
          <div className="inline-flex min-w-full gap-1 rounded-xl border border-ink-100 bg-white p-1 shadow-sm sm:min-w-0">
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
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm transition-colors sm:px-4 ${
                    selected
                      ? 'bg-court-50 font-medium text-court-800 shadow-sm ring-1 ring-court-200/80'
                      : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                  }`}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>
        <p className="text-sm text-ink-600">{activeMeta.subtitle}</p>
      </div>

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
  )
}

export function TabSubgroupHeading({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-ink-800">{children}</h3>
  )
}
