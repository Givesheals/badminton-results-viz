import { useEffect, useState } from 'react'
import { useTicketBuildVisibility } from '../context/TicketBuildVisibilityContext'

/**
 * Local ticket-build stage plus whether the dashed picker should render.
 * Hiding the picker snaps to the fully developed stage so the product UI is complete.
 */
export function useTicketBuildPicker<T>(
  fullStage: T,
  initialStage: T = fullStage,
): {
  stage: T
  setStage: (stage: T) => void
  pickerVisible: boolean
} {
  const { ticketBuildVisible } = useTicketBuildVisibility()
  const [stage, setStage] = useState<T>(ticketBuildVisible ? initialStage : fullStage)

  useEffect(() => {
    if (!ticketBuildVisible) {
      setStage(fullStage)
    }
  }, [fullStage, ticketBuildVisible])

  return {
    stage,
    setStage,
    pickerVisible: ticketBuildVisible,
  }
}

