/** Distinct fills for pie charts — one per slice, max 8 (see MAX_PIE_SLICES). */
export const DISTINCT_PIE_SLICE_COLORS = [
  '#41016f',
  '#047e10',
  '#159eda',
  '#a16207',
  '#64748b',
  '#0f766e',
  '#c2410c',
  '#6d28d9',
] as const

export function getDistinctPieSliceColors(sliceCount: number): string[] {
  return DISTINCT_PIE_SLICE_COLORS.slice(0, sliceCount)
}
