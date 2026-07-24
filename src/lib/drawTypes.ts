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

export type DrawMatchup = {
  id: string
  roundLabel: string
  yourSide: DrawPlayer[]
  opponentSide: DrawPlayer[]
}

export type DrawDisciplineGroup = {
  disciplineCode: string
  disciplineLabel: string
  matchups: DrawMatchup[]
}
