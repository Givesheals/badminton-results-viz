/**
 * Shared draw-preview shapes used by the draw-out email and draw scout card.
 */

export type DrawPlayer = {
  name: string
  url: string
  /** Seeding prefix shown before the name, e.g. '[1]'. */
  seedLabel?: string
  /** Pre-match / draw rating shown after the name, e.g. 572. */
  rating?: number
}

/** Result of a played draw matchup, from the viewed player's perspective. */
export type DrawMatchResult = {
  outcome: 'win' | 'loss'
  /** e.g. "21-18, 19-21, 21-15" */
  scoreSummary: string
}

/** Probable knockout opponent while the bracket side is still unsettled. */
export type DrawProbableOpponent = {
  opponentSide: DrawPlayer[]
  /** Likelihood of facing this side; opponents for the same pending matchup sum to 1. */
  probability: number
}

export type DrawMatchup = {
  id: string
  roundLabel: string
  yourSide: DrawPlayer[]
  opponentSide: DrawPlayer[]
  /** When set, the match has been played — UI shows a compact result card. */
  result?: DrawMatchResult
  /**
   * Next-round slot where the opponent is not yet decided.
   * When true, `opponentSide` is empty and `probableOpponents` lists ranked candidates.
   */
  opponentPending?: boolean
  /** Ranked probable opponents when `opponentPending` is true. */
  probableOpponents?: DrawProbableOpponent[]
}

export type DrawDisciplineGroup = {
  disciplineCode: string
  disciplineLabel: string
  matchups: DrawMatchup[]
}
