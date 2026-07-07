import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { sampleDataset } from '../data/sampleDataset'
import { parseSpreadsheetFile } from '../lib/parseSpreadsheet'
import type { ParsedDataset } from '../types/dataset'

type DatasetContextValue = {
  dataset: ParsedDataset | null
  isLoading: boolean
  error: string | null
  loadFile: (file: File) => Promise<void>
  loadSample: () => void
  loadParsed: (parsed: ParsedDataset) => void
  clearDataset: () => void
}

const DatasetContext = createContext<DatasetContextValue | null>(null)

function clearDashboardSectionHash() {
  if (typeof window === 'undefined' || !window.location.hash) return
  window.history.replaceState(
    null,
    '',
    window.location.pathname + window.location.search,
  )
}

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadFile = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)
    try {
      const parsed = await parseSpreadsheetFile(file)
      if (parsed.rows.length === 0) {
        throw new Error('No data rows found. Check that the first row contains column headers.')
      }
      clearDashboardSectionHash()
      setDataset(parsed)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to read file.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadSample = useCallback(() => {
    setError(null)
    clearDashboardSectionHash()
    setDataset({ ...sampleDataset, importedAt: new Date().toISOString() })
  }, [])

  const loadParsed = useCallback((parsed: ParsedDataset) => {
    setError(null)
    clearDashboardSectionHash()
    setDataset(parsed)
  }, [])

  const clearDataset = useCallback(() => {
    setDataset(null)
    setError(null)
  }, [])

  const value = useMemo(
    () => ({
      dataset,
      isLoading,
      error,
      loadFile,
      loadSample,
      loadParsed,
      clearDataset,
    }),
    [dataset, isLoading, error, loadFile, loadSample, loadParsed, clearDataset],
  )

  return (
    <DatasetContext.Provider value={value}>{children}</DatasetContext.Provider>
  )
}

export function useDataset() {
  const ctx = useContext(DatasetContext)
  if (!ctx) {
    throw new Error('useDataset must be used within DatasetProvider')
  }
  return ctx
}
