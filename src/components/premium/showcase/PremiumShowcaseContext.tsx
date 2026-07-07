import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { DashboardNavigationProvider } from '../../../context/DashboardNavigationContext'
import { OpponentNotesProvider } from '../../../context/OpponentNotesContext'
import { computeStatsFromMatches } from '../../../lib/computeStats'
import { buildFilterOptions } from '../../../lib/filterMatches'
import { normalizeDataset } from '../../../lib/matchHistory'
import type { ParsedDataset } from '../../../types/dataset'
import type { FilterOptions } from '../../../types/filters'
import type { NormalizedMatch } from '../../../types/matchHistory'

type ShowcaseData = {
  allMatches: NormalizedMatch[]
  filterOptions: FilterOptions
  importedAt: string
  playerName: string | null
}

const PremiumShowcaseContext = createContext<ShowcaseData | null>(null)

export function PremiumShowcaseProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<ParsedDataset | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}premium-showcase/dataset.json`)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load showcase data')
        return response.json() as Promise<ParsedDataset>
      })
      .then((parsed) => {
        if (!cancelled) setDataset(parsed)
      })
      .catch(() => {
        // Carousel shows a loading state when data is unavailable.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo<ShowcaseData | null>(() => {
    if (!dataset) return null
    const allMatches = normalizeDataset(dataset)
    return {
      allMatches,
      filterOptions: buildFilterOptions(allMatches),
      importedAt: dataset.importedAt,
      playerName: computeStatsFromMatches(allMatches).playerName,
    }
  }, [dataset])

  return (
    <DashboardNavigationProvider>
      <PremiumShowcaseContext.Provider value={value}>
        <PremiumShowcaseNotesProvider>{children}</PremiumShowcaseNotesProvider>
      </PremiumShowcaseContext.Provider>
    </DashboardNavigationProvider>
  )
}

export function usePremiumShowcase() {
  return useContext(PremiumShowcaseContext)
}

function PremiumShowcaseNotesProvider({ children }: { children: ReactNode }) {
  const data = usePremiumShowcase()
  if (!data) return children
  return <OpponentNotesProvider playerName={data.playerName}>{children}</OpponentNotesProvider>
}
