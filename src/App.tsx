import { useMemo } from 'react'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/dashboard/Dashboard'
import { EmptyState } from './components/dashboard/EmptyState'
import { FileUpload } from './components/upload/FileUpload'
import { PremiumUserMenu } from './components/premium/PremiumUserMenu'
import { DatasetProvider, useDataset } from './context/DatasetContext'
import { PremiumProvider } from './context/PremiumContext'
import { computeStatsFromMatches } from './lib/computeStats'
import { normalizeDataset } from './lib/matchHistory'

function AppContent() {
  const { dataset } = useDataset()

  const playerName = useMemo(() => {
    if (!dataset) return null
    return computeStatsFromMatches(normalizeDataset(dataset)).playerName
  }, [dataset])

  const headerRight =
    dataset && playerName ? <PremiumUserMenu playerName={playerName} /> : undefined

  return (
    <AppShell headerRight={headerRight}>
      <div className="space-y-8">
        <FileUpload />
        {dataset ? <Dashboard /> : <EmptyState />}
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
