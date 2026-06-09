type Props = {
  filteredCount: number
  totalCount: number
}

export function FilterMatchCount({ filteredCount, totalCount }: Props) {
  if (filteredCount >= totalCount) return null

  return (
    <p className="text-xs text-ink-700">
      Showing {filteredCount} of {totalCount} matches
    </p>
  )
}
