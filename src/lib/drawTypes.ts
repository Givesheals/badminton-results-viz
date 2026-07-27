/**
 * Shared draw-preview shapes used by the draw-out email and draw companion card.
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
  /** Where this side currently sits in *this* discipline (group record / next round). */
  pathStatus?: DrawOpponentPathStatus
}

/**
 * Progress of a probable / pending opponent side in the discipline you’re waiting on.
 * Prefer remaining group games / next-round cues over P–W–L shorthand.
 */
export type DrawOpponentPathStatus = {
  /** e.g. "Group", "QF", "SF" — used when not still counting group games. */
  nextRoundShort: string
  /** Group games still to play in the box (knockout-safe alternative to W–L). */
  groupGamesRemaining?: number
}

/** How often this competition’s results feed tends to update. */
export type DrawUpdateCadence = 'live' | 'frequent' | 'sporadic'

/** A player still active in another discipline at the same competition. */
export type DrawPlayerBusyStatus = {
  disciplineCode: string
  /**
   * Next round they face in that discipline (knockout-safe — not a match count).
   * e.g. "QF", "SF", "F", "Group"
   */
  nextRoundShort: string
}

/** Named person blocking settlement of a pending next opponent. */
export type DrawOpponentDecidedBlocker = {
  playerName: string
  disciplineLabel: string
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
  /**
   * Matches still needed on the bracket path before this pending opponent is known.
   */
  gamesUntilOpponentDecided?: number
  /** When one person is the clear reason the opponent is unsettled. */
  opponentDecidedBlocker?: DrawOpponentDecidedBlocker
}

export type DrawDisciplineGroup = {
  disciplineCode: string
  disciplineLabel: string
  matchups: DrawMatchup[]
}
