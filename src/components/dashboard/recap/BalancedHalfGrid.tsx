import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import {
  halfGridRows,
  placeHalfGrid,
  sequentialHalfGrid,
} from '../../../lib/halfGridPlacement'

const DESKTOP_QUERY = '(min-width: 1024px)'

type Props = {
  children: ReactNode
}

function heightsChanged(prev: number[], next: number[]): boolean {
  if (prev.length !== next.length) return true
  return next.some((height, index) => Math.abs(height - (prev[index] ?? 0)) > 2)
}

/**
 * On a laptop-width screen, lay cards out two per row.
 * The two closest heights share a row. A leftover card stays half width
 * on the row below, so a single card never stretches to look more important.
 * Narrow screens keep the original stacked order.
 */
export function BalancedHalfGrid({ children }: Props) {
  const items = Children.toArray(children).filter(isValidElement)
  const itemKey = items.map((child, index) => String(child.key ?? index)).join('|')
  const itemsRef = useRef(items)
  itemsRef.current = items
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [wide, setWide] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
  )
  const [measuredKey, setMeasuredKey] = useState('')
  const [heights, setHeights] = useState<number[]>([])

  useLayoutEffect(() => {
    const media = window.matchMedia(DESKTOP_QUERY)
    const apply = () => setWide(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useLayoutEffect(() => {
    if (!wide) return
    const measure = () => {
      const current = itemsRef.current
      const next = current.map(
        (_, index) => refs.current[index]?.getBoundingClientRect().height ?? 0,
      )
      if (next.length === 0 || next.some((height) => height <= 0)) return
      setHeights((prev) => (heightsChanged(prev, next) ? next : prev))
      setMeasuredKey((prev) => (prev === itemKey ? prev : itemKey))
    }
    measure()
    const observer = new ResizeObserver(measure)
    for (let index = 0; index < itemsRef.current.length; index++) {
      const element = refs.current[index]
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [wide, itemKey])

  if (items.length === 0) return null

  if (!wide) {
    return <div className="space-y-3">{items}</div>
  }

  const slots =
    measuredKey === itemKey && heights.length === items.length
      ? placeHalfGrid(heights)
      : sequentialHalfGrid(items.length)
  const rows = halfGridRows(slots)

  return (
    <div className="space-y-3">
      {rows.map((indexes) => (
        <div
          key={indexes.join('-')}
          className="grid grid-cols-2 items-start gap-3"
        >
          {indexes.map((index) => {
            const child = items[index] as ReactElement
            return (
              <div
                key={String(child.key ?? index)}
                ref={(element) => {
                  refs.current[index] = element
                }}
                className="min-w-0"
              >
                {child}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}
