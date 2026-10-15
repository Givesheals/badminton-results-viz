export type HalfGridSlot = { row: number; col: 1 | 2 }

/**
 * Two-column placement for wide screens.
 * Cards that are closest in height share a row. Within a row, the earlier
 * card stays on the left. When the count is odd, the leftover card is half
 * width on the last row, in the left column.
 */
export function placeHalfGrid(heights: number[]): HalfGridSlot[] {
  const count = heights.length
  const slots: HalfGridSlot[] = Array.from({ length: count }, () => ({
    row: 1,
    col: 1 as const,
  }))
  if (count === 0) return []
  if (count === 1) return slots

  const indexes = heights.map((_, index) => index)
  if (count % 2 === 0) {
    writePairs(slots, pairByHeight(indexes, heights))
    return slots
  }

  let bestSingleton = -1
  let bestCost = Infinity
  let bestPairs: Array<[number, number]> = []

  for (const singleton of indexes) {
    const rest = indexes.filter((index) => index !== singleton)
    const pairs = pairByHeight(rest, heights)
    const cost = pairs.reduce(
      (sum, [left, right]) => sum + Math.abs(heights[left] - heights[right]),
      0,
    )
    // Equal heights keep the original order and drop the last card below.
    if (cost < bestCost || (cost === bestCost && singleton > bestSingleton)) {
      bestCost = cost
      bestSingleton = singleton
      bestPairs = pairs
    }
  }

  writePairs(slots, bestPairs)
  slots[bestSingleton] = { row: bestPairs.length + 1, col: 1 }
  return slots
}

/** Tallest first. Equal heights keep their original order. */
export function tallestFirstIndexes(heights: number[]): number[] {
  return heights
    .map((height, index) => ({ height, index }))
    .sort((a, b) => b.height - a.height || a.index - b.index)
    .map((item) => item.index)
}

/**
 * Tallest card at the top left, then across and down, shortest at the bottom right.
 * An odd last card stays in the left column.
 */
export function placeTallestFirst(heights: number[]): HalfGridSlot[] {
  const slots: HalfGridSlot[] = heights.map(() => ({ row: 1, col: 1 as const }))
  tallestFirstIndexes(heights).forEach((itemIndex, position) => {
    slots[itemIndex] = {
      row: Math.floor(position / 2) + 1,
      col: ((position % 2) + 1) as 1 | 2,
    }
  })
  return slots
}

/** Fallback before heights are known: event 1 left, event 2 right, and so on. */
export function sequentialHalfGrid(count: number): HalfGridSlot[] {
  return Array.from({ length: count }, (_, index) => ({
    row: Math.floor(index / 2) + 1,
    col: ((index % 2) + 1) as 1 | 2,
  }))
}

/**
 * Left-to-right, top-to-bottom order for the discipline cards.
 * Three events are one row on a wide screen. Every other count stays two columns.
 * Before heights are known, the original order is kept.
 */
export function visualDisciplineIndexes(
  count: number,
  measuredHeights: number[] | null,
): number[] {
  if (count <= 0) return []
  if (count === 1) return [0]
  const measured = measuredHeights != null && measuredHeights.length === count
  if (count === 3) {
    return measured ? tallestFirstIndexes(measuredHeights) : [0, 1, 2]
  }
  const slots = measured ? placeTallestFirst(measuredHeights) : sequentialHalfGrid(count)
  return halfGridRows(slots).flat()
}

/** Same left-to-right order as the event cards. Unknown codes stay in their original order at the end. */
export function sortByDisciplineOrder<T extends { discipline: string }>(
  items: readonly T[],
  order: readonly string[],
): T[] {
  if (order.length === 0) return [...items]
  const rank = new Map(order.map((code, index) => [code, index]))
  return items
    .map((item, index) => ({ item, index }))
    .sort((a, b) => {
      const aRank = rank.get(a.item.discipline) ?? order.length
      const bRank = rank.get(b.item.discipline) ?? order.length
      return aRank - bRank || a.index - b.index
    })
    .map(({ item }) => item)
}

export function halfGridRows(slots: HalfGridSlot[]): number[][] {
  const byRow = new Map<number, { col: number; index: number }[]>()
  slots.forEach((slot, index) => {
    const cells = byRow.get(slot.row) ?? []
    cells.push({ col: slot.col, index })
    byRow.set(slot.row, cells)
  })
  return [...byRow.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, cells]) => cells.sort((a, b) => a.col - b.col).map((cell) => cell.index))
}

function pairByHeight(indexes: number[], heights: number[]): Array<[number, number]> {
  const sorted = [...indexes].sort(
    (a, b) => heights[a] - heights[b] || a - b,
  )
  const pairs: Array<[number, number]> = []
  for (let index = 0; index < sorted.length; index += 2) {
    const left = sorted[index]!
    const right = sorted[index + 1]!
    pairs.push(left < right ? [left, right] : [right, left])
  }
  return pairs
}

function writePairs(slots: HalfGridSlot[], pairs: Array<[number, number]>) {
  const ordered = [...pairs].sort(
    (a, b) => Math.min(a[0], a[1]) - Math.min(b[0], b[1]),
  )
  ordered.forEach(([left, right], rowIndex) => {
    const row = rowIndex + 1
    slots[left] = { row, col: 1 }
    slots[right] = { row, col: 2 }
  })
}
