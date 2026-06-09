export function formatCount(value: number): string {
  return value.toLocaleString('en-GB')
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatWholePercent(value: number): string {
  return `${Math.round(value)}%`
}

export function formatWinLossRecord(wins: number, losses: number): string {
  const winPart = `${wins} win${wins === 1 ? '' : 's'}`
  const lossPart = `${losses} loss${losses === 1 ? '' : 'es'}`
  return `${winPart}, ${lossPart}`
}

/** Opponent minus player rating before the match; positive = they were higher rated. */
export function formatRatingGap(gap: number): string {
  if (gap > 0) return `+${Math.round(gap)}`
  if (gap < 0) return String(Math.round(gap))
  return '±0'
}
