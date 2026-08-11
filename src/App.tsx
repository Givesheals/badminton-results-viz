import { useEffect, useMemo, useRef, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/dashboard/Dashboard'
import { EmptyState } from './components/dashboard/EmptyState'
import { AddNewDataPage } from './components/upload/AddNewDataPage'
import { PremiumUserMenu } from './components/premium/PremiumUserMenu'
import { ShowcaseRecordSurface } from './components/premium/showcase/ShowcaseRecordSurface'
import {
  DEFAULT_DATASET_FILE,
  DEFAULT_DATASET_URL,
  DatasetProvider,
  useDataset,
} from './context/DatasetContext'
import { PremiumProvider } from './context/PremiumContext'
import { computeStatsFromMatches } from './lib/computeStats'
import { normalizeDataset } from './lib/matchHistory'
import { getShowcaseRecordSlideId, isShowcaseMode } from './lib/showcaseMode'

function AppContent() {
  const { dataset, loadParsed, loadFromUrl, isLoading, error } = useDataset()
  const showcaseMode = isShowcaseMode()
  const recordSlideId = getShowcaseRecordSlideId()
  const [addNewDataOpen, setAddNewDataOpen] = useState(false)
  const defaultLoadStarted = useRef(false)

  useEffect(() => {
    if (!showcaseMode) return

    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}premium-showcase/dataset.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load showcase dataset.')
        return response.json()
      })
      .then((parsed) => {
        if (!cancelled) loadParsed(parsed)
      })
      .catch(() => {
        // Showcase capture page fails loudly in the capture script if data never loads.
      })
    return () => {
      cancelled = true
    }
  }, [loadParsed, showcaseMode])

  useEffect(() => {
    if (showcaseMode || defaultLoadStarted.current) return
    defaultLoadStarted.current = true
    void loadFromUrl(DEFAULT_DATASET_URL, DEFAULT_DATASET_FILE)
  }, [showcaseMode, loadFromUrl])

  const playerName = useMemo(() => {
    if (!dataset) return null
    return computeStatsFromMatches(normalizeDataset(dataset)).playerName
  }, [dataset])

  if (recordSlideId) {
    return <ShowcaseRecordSurface slideId={recordSlideId} />
  }

  const headerRight =
    dataset && playerName && !showcaseMode ? (
      <PremiumUserMenu
        playerName={playerName}
        onOpenAddNewData={() => setAddNewDataOpen(true)}
      />
    ) : undefined

  const showDefaultLoading = !showcaseMode && !dataset && isLoading && !addNewDataOpen

  return (
    <AppShell headerRight={headerRight} minimal={showcaseMode}>
      <div className="space-y-8" data-showcase-ready={showcaseMode && dataset ? 'true' : undefined}>
        {dataset ? (
          <Dashboard
            showcaseMode={showcaseMode}
            onOpenAddNewData={() => setAddNewDataOpen(true)}
          />
        ) : showcaseMode ? null : showDefaultLoading ? (
          <section className="rounded-2xl border border-brand-200/70 bg-white px-6 py-12 text-center shadow-sm">
            <p className="text-lg font-medium text-ink-900">Loading your results…</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-700">
              Opening {DEFAULT_DATASET_FILE}
            </p>
          </section>
        ) : (
          <EmptyState
            error={error}
            onOpenAddNewData={() => setAddNewDataOpen(true)}
          />
        )}
      </div>

      {!showcaseMode && (
        <AddNewDataPage open={addNewDataOpen} onClose={() => setAddNewDataOpen(false)} />
      )}
    </AppShell>
  )
}

export default function App() {
  return (
    <DatasetProvider>
      <PremiumProvider>
        <AppContent />
      </PremiumProvider>
    </DatasetProvider>
  )
}
