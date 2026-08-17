type Props = {
  filteredCount: number
  totalCount: number
  /**
   * When true, still render “Showing N of N matches” if nothing is filtered out.
   * Default false — other sections hide the line when showing everything.
   */
  showWhenUnfiltered?: boolean
}

export function FilterMatchCount({
  filteredCount,
  totalCount,
  showWhenUnfiltered = false,
}: Props) {
  if (!showWhenUnfiltered && filteredCount >= totalCount) return null

  return (
    <p className="text-xs text-ink-700">
      Showing {filteredCount} of {totalCount} matches
    </p>
  )
}
