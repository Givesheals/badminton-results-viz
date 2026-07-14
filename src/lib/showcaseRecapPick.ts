import type { TournamentRecap } from './tournamentRecap'

/** Prefer a busy weekend with lots of matches and “wow” callouts for the signup preview. */
export function pickShowcaseRecapIndex(recaps: TournamentRecap[]): number {
  if (recaps.length === 0) return 0

  let bestIndex = 0
  let bestScore = Number.NEGATIVE_INFINITY

  for (let index = 0; index < recaps.length; index += 1) {
    const recap = recaps[index]!
    const disciplineMatchCount = recap.disciplines.reduce(
      (sum, discipline) => sum + discipline.matches.length,
      0,
    )
    const score =
      recap.totalMatches * 12 +
      disciplineMatchCount * 4 +
      recap.disciplines.length * 8 +
      recap.freakFlags.length * 10 +
      recap.emojiInsights.length * 3 +
      recap.otherEventInsights.length * 2 +
      recap.eventSummaries.length * 4 +
      recap.recordMilestones.length * 5 +
      recap.celebrations.winners.length * 8 +
      recap.celebrations.runnerUps.length * 4 +
      recap.celebrations.milestones.length * 3

    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  return bestIndex
}
