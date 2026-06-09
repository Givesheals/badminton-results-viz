import { useEffect, useState } from 'react'

export type ProgressionChartLabelMode = 'short' | 'full'

/** `short` below md; full labels from md breakpoint up. */
export function useProgressionChartLabels(): ProgressionChartLabelMode {
  const [mode, setMode] = useState<ProgressionChartLabelMode>(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
      ? 'full'
      : 'short',
  )

  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const update = () => setMode(query.matches ? 'full' : 'short')
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  return mode
}
