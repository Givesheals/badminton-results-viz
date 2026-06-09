import { useLayoutEffect, useState, type RefObject } from 'react'

const VIEWPORT_MARGIN_PX = 16
const GAP_BELOW_TRIGGER_PX = 6

export function usePopoverPosition(
  open: boolean,
  triggerRef: RefObject<HTMLButtonElement | null>,
) {
  const [top, setTop] = useState(0)

  useLayoutEffect(() => {
    if (!open) return

    const update = () => {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setTop(rect.bottom + GAP_BELOW_TRIGGER_PX)
    }

    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open, triggerRef])

  return {
    top,
    left: VIEWPORT_MARGIN_PX,
    right: VIEWPORT_MARGIN_PX,
  }
}
