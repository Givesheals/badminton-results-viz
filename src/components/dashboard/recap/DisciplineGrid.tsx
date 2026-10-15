import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { visualDisciplineIndexes } from '../../../lib/halfGridPlacement'

type Props = {
  children: ReactNode
  /** Left-to-right discipline codes, so celebration posters can sit above the same event. */
  onDisplayOrder?: (disciplines: string[]) => void
}

function heightsChanged(prev: number[], next: number[]): boolean {
  if (prev.length !== next.length) return true
  return next.some((height, index) => Math.abs(height - (prev[index] ?? 0)) > 2)
}

/**
 * Event cards in height order: tallest at the top left, shortest at the bottom right.
 * A single event, and any leftover card, stays half the row and sits on the left.
 * Three events share one row on a wide screen. Two events, and every other count,
 * stay two columns from a small tablet upward.
 */
function disciplineCode(child: ReactElement): string {
  const recap = (child.props as { recap?: { discipline?: string } }).recap
  return recap?.discipline ?? ''
}

export function DisciplineGrid({ children, onDisplayOrder }: Props) {
  const items = Children.toArray(children).filter(isValidElement)
  const itemKey = items.map((child, index) => String(child.key ?? index)).join('|')
  const itemsRef = useRef(items)
  itemsRef.current = items
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const onDisplayOrderRef = useRef(onDisplayOrder)
  onDisplayOrderRef.current = onDisplayOrder
  const [measuredKey, setMeasuredKey] = useState('')
  const [heights, setHeights] = useState<number[]>([])

  useLayoutEffect(() => {
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
  }, [itemKey])

  const measured = measuredKey === itemKey && heights.length === items.length
  const visualIndexes = visualDisciplineIndexes(items.length, measured ? heights : null)
  const displayOrder = visualIndexes
    .map((index) => disciplineCode(items[index] as ReactElement))
    .filter(Boolean)
  const displayOrderKey = displayOrder.join('|')
  const displayOrderRef = useRef(displayOrder)
  displayOrderRef.current = displayOrder

  useLayoutEffect(() => {
    if (items.length > 1 && !measured) return
    onDisplayOrderRef.current?.(displayOrderRef.current)
  }, [displayOrderKey, items.length, measured])

  if (items.length === 0) return null

  const card = (index: number) => {
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
  }

  if (items.length === 1) {
    return <div className="sm:grid sm:grid-cols-2 sm:gap-3">{card(0)}</div>
  }

  if (items.length === 3) {
    return (
      <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visualIndexes.map(card)}
      </div>
    )
  }

  const rows: number[][] = []
  for (let index = 0; index < visualIndexes.length; index += 2) {
    rows.push(visualIndexes.slice(index, index + 2))
  }

  return (
    <div className="space-y-3">
      {rows.map((indexes) => (
        <div
          key={indexes.join('-')}
          className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2"
        >
          {indexes.map(card)}
        </div>
      ))}
    </div>
  )
}
