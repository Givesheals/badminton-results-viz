import { useEffect, useMemo } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/dashboard/Dashboard'
import { EmptyState } from './components/dashboard/EmptyState'
import { FileUpload } from './components/upload/FileUpload'
import { PremiumUserMenu } from './components/premium/PremiumUserMenu'
import { DatasetProvider, useDataset } from './context/DatasetContext'
import { PremiumProvider } from './context/PremiumContext'
import { computeStatsFromMatches } from './lib/computeStats'
import { normalizeDataset } from './lib/matchHistory'
import { isShowcaseMode } from './lib/showcaseMode'

function AppContent() {
  const { dataset, loadParsed } = useDataset()
  const showcaseMode = isShowcaseMode()

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

  const playerName = useMemo(() => {
    if (!dataset) return null
    return computeStatsFromMatches(normalizeDataset(dataset)).playerName
  }, [dataset])

  const headerRight =
    dataset && playerName && !showcaseMode ? <PremiumUserMenu playerName={playerName} /> : undefined

  return (
    <AppShell headerRight={headerRight} minimal={showcaseMode}>
      <div className="space-y-8" data-showcase-ready={showcaseMode && dataset ? 'true' : undefined}>
        {!showcaseMode && <FileUpload />}
        {dataset ? <Dashboard showcaseMode={showcaseMode} /> : showcaseMode ? null : <EmptyState />}
      </div>
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
