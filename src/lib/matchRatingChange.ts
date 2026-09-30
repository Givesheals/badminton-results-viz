/**
 * PROTOTYPE: per-match rating change.
 *
 * The match history only holds each player's rating going into a match, so real
 * per-match changes are not available yet. This module splits a discipline's
 * total rating change (the number shown top-right on the discipline card) across
 * its matches so the badges always add up to that total.
 *
 * Wins come out positive and losses negative wherever the total allows it.
 * Upset wins move the rating more; losses you were expected to win cost more.
 */

export type MatchRatingChange = {
  /** Signed whole rating points for this match. */
  points: number
  /** Plain-language explanation shown in the badge popover. */
  explanation: string
}

export type RatingChangeInput = {
  key: string
  outcome: 'win' | 'loss'
  /** Pre-match chance of winning (0-1), when known. */
  winProbability: number | null
}

/** Rating points a loss costs per unit of expected-win chance (prototype tuning). */
const LOSS_POINTS_PER_UNIT = 6
/** Wins should share at least this many points per unit of upset-ness. */
const MIN_WIN_POINTS_PER_UNIT = 2
/** Keeps very lopsided matches from rounding to nothing. */
const MIN_WEIGHT = 0.1

function weightFor(input: RatingChangeInput): number {
  const chance = input.winProbability ?? 0.5
  const raw = input.outcome === 'win' ? 1 - chance : chance
  return Math.max(MIN_WEIGHT, raw)
}

function sortedByWeightDesc(indexes: number[], weights: number[]): number[] {
  return [...indexes].sort((a, b) => weights[b]! - weights[a]!)
}

/**
 * Splits `total` across the inputs as whole numbers that sum exactly to `total`.
 * Returns a map from input key to points.
 */
export function allocateRatingChanges(
  inputs: RatingChangeInput[],
  total: number,
): Map<string, number> {
  const result = new Map<string, number>()
  if (inputs.length === 0) return result

  const weights = inputs.map(weightFor)
  const winIdx: number[] = []
  const lossIdx: number[] = []
  inputs.forEach((input, index) => {
    if (input.outcome === 'win') winIdx.push(index)
    else lossIdx.push(index)
  })

  const winWeight = winIdx.reduce((sum, i) => sum + weights[i]!, 0)
  const lossWeight = lossIdx.reduce((sum, i) => sum + weights[i]!, 0)

  let winTotal = 0
  let lossTotal = 0
  if (winIdx.length > 0 && lossIdx.length > 0) {
    lossTotal = lossWeight * LOSS_POINTS_PER_UNIT
    winTotal = total + lossTotal
    if (winTotal < winWeight * MIN_WIN_POINTS_PER_UNIT) {
      winTotal = winWeight * MIN_WIN_POINTS_PER_UNIT
      lossTotal = winTotal - total
    }
  } else if (winIdx.length > 0) {
    winTotal = total
  } else {
    lossTotal = -total
  }

  const values = inputs.map((_, index) => {
    if (inputs[index]!.outcome === 'win') {
      return winWeight > 0 ? (winTotal * weights[index]!) / winWeight : 0
    }
    return lossWeight > 0 ? (-lossTotal * weights[index]!) / lossWeight : 0
  })

  const points = values.map((value) => Math.round(value))

  // Avoid "no change" badges on individual wins and losses when there is a
  // real total to spread. Single-match cards keep whatever the total says.
  if (inputs.length > 1) {
    points.forEach((value, index) => {
      if (value !== 0) return
      points[index] = inputs[index]!.outcome === 'win' ? 1 : -1
    })
  }

  // Nudge whole numbers until they sum exactly to the total.
  const winOrder = sortedByWeightDesc(winIdx, weights)
  const lossOrder = sortedByWeightDesc(lossIdx, weights)
  const everyOrder = sortedByWeightDesc(
    inputs.map((_, index) => index),
    weights,
  )

  let residual = total - points.reduce((sum, value) => sum + value, 0)
  let guard = 0
  while (residual !== 0 && guard < 10_000) {
    guard += 1
    const step = residual > 0 ? 1 : -1
    const preferred = step > 0 ? winOrder : lossOrder
    const fallback = step > 0 ? lossOrder : winOrder
    // Preferred side can always absorb the nudge. The fallback side only
    // absorbs it while it keeps the sign (wins stay >= 1, losses stay <= -1).
    const pool =
      preferred.length > 0
        ? preferred
        : fallback.filter((i) => {
            const next = points[i]! + step
            return inputs[i]!.outcome === 'win' ? next >= 1 : next <= -1
          })
    const candidates = pool.length > 0 ? pool : everyOrder
    const target = candidates[(guard - 1) % candidates.length]!
    points[target] = points[target]! + step
    residual -= step
  }

  inputs.forEach((input, index) => result.set(input.key, points[index]!))
  return result
}

function formatChance(probability: number): string {
  const percent = Math.round(probability * 100)
  return `${Math.min(99, Math.max(1, percent))}%`
}

export function formatRatingChangePoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return String(points)
  return '±0'
}

export function buildMatchRatingChange(
  input: RatingChangeInput,
  points: number,
): MatchRatingChange {
  const chanceClause =
    input.winProbability != null
      ? ` Going in, you had about a ${formatChance(input.winProbability)} chance of winning.`
      : ''
  const amount = Math.abs(points)
  const unit = amount === 1 ? 'point' : 'points'

  let explanation: string
  if (points === 0) {
    explanation = `Your rating did not change from this match.${chanceClause}`
  } else if (points > 0) {
    explanation = `You gained ${amount} rating ${unit} for this ${
      input.outcome === 'win' ? 'win' : 'match'
    }.${chanceClause} The less likely the win, the more it moves your rating.`
  } else {
    explanation = `You lost ${amount} rating ${unit} from this ${
      input.outcome === 'loss' ? 'loss' : 'match'
    }.${chanceClause} The more likely you were to win, the more a defeat costs.`
  }

  return { points, explanation }
}

/**
 * Builds a rating change for each input, summing exactly to `total`.
 * Returns a map from input key to its rating change.
 */
export function buildRatingChanges(
  inputs: RatingChangeInput[],
  total: number,
): Map<string, MatchRatingChange> {
  const points = allocateRatingChanges(inputs, total)
  const changes = new Map<string, MatchRatingChange>()
  for (const input of inputs) {
    changes.set(input.key, buildMatchRatingChange(input, points.get(input.key) ?? 0))
  }
  return changes
}
