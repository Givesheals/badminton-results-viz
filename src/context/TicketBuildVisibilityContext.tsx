import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

const STORAGE_KEY = 'badminfo:ticket-build-visible'

type TicketBuildVisibilityContextValue = {
  ticketBuildVisible: boolean
  setTicketBuildVisible: (visible: boolean) => void
  toggleTicketBuildVisible: () => void
}

const TicketBuildVisibilityContext =
  createContext<TicketBuildVisibilityContextValue | null>(null)

function loadTicketBuildVisible(): boolean {
  if (typeof window === 'undefined') return true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === '0' || raw === 'false') return false
    return true
  } catch {
    return true
  }
}

function saveTicketBuildVisible(visible: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, visible ? '1' : '0')
  } catch {
    // Ignore quota / private-mode failures; in-memory state still applies.
  }
}

export function TicketBuildVisibilityProvider({ children }: { children: ReactNode }) {
  const [ticketBuildVisible, setVisible] = useState(loadTicketBuildVisible)

  const setTicketBuildVisible = useCallback((visible: boolean) => {
    setVisible(visible)
    saveTicketBuildVisible(visible)
  }, [])

  const toggleTicketBuildVisible = useCallback(() => {
    setVisible((current) => {
      const next = !current
      saveTicketBuildVisible(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      ticketBuildVisible,
      setTicketBuildVisible,
      toggleTicketBuildVisible,
    }),
    [setTicketBuildVisible, ticketBuildVisible, toggleTicketBuildVisible],
  )

  return (
    <TicketBuildVisibilityContext.Provider value={value}>
      {children}
    </TicketBuildVisibilityContext.Provider>
  )
}

export function useTicketBuildVisibility(): TicketBuildVisibilityContextValue {
  const value = useContext(TicketBuildVisibilityContext)
  if (!value) {
    return {
      ticketBuildVisible: true,
      setTicketBuildVisible: () => {},
      toggleTicketBuildVisible: () => {},
    }
  }
  return value
}
