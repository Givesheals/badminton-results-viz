import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/dashboard/Dashboard'
import { EmptyState } from './components/dashboard/EmptyState'
import { FileUpload } from './components/upload/FileUpload'
import { DatasetProvider, useDataset } from './context/DatasetContext'

function AppContent() {
  const { dataset } = useDataset()

  return (
    <AppShell>
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
      <AppContent />
    </DatasetProvider>
  )
}
