import {
  bestWinRowKey,
  detectBestWinRecapMilestones,
  type BestWinMetricKind,
  type BestWinRecapMilestone,
} from './bestWins'
import {
  detectOpponentMatchupRecapMilestones,
  type OpponentMatchupRecapMilestone,
} from './opponentMatchups'
import type { NormalizedMatch } from '../types/matchHistory'

export type RecapRecordMilestoneKind =
  | 'best_win_strength'
  | 'best_win_upset'
  | 'nemesis_top5'
  | 'scalp_top5'

export type RecapRecordMilestone = {
  id: string
  kind: RecapRecordMilestoneKind
  title: string
  detail: string
  discipline?: string
  sectionId: 'best-wins' | 'opponent-matchups'
}

function formatOrdinal(rank: number): string {
  const mod100 = rank % 100
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`
  switch (rank % 10) {
    case 1:
      return `${rank}st`
    case 2:
      return `${rank}nd`
    case 3:
      return `${rank}rd`
    default:
      return `${rank}th`
  }
}

function bestWinTitle(kind: BestWinMetricKind): string {
  return kind === 'strength' ? 'New strongest beaten!' : 'New biggest upset!'
}

function bestWinDetail(row: BestWinRecapMilestone['row']): string {
  return `Beat ${row.match.opponents}`
}

function opponentTitle(kind: OpponentMatchupRecapMilestone['kind'], rank: number): string {
  const place = formatOrdinal(rank)
  if (kind === 'nemesis') {
    return `New nemesis in your top 5 (${place})`
  }
  return `New favourite opponent in your top 5 (${place})`
}

function opponentDetail(
  kind: OpponentMatchupRecapMilestone['kind'],
  name: string,
): string {
  const label = kind === 'nemesis' ? 'nemesis' : 'favourite opponents'
  return `${name} joined your ${label} list.`
}

function disciplineForWeekendOpponent(
  weekendMatches: NormalizedMatch[],
  opponentName: string,
): string | undefined {
  for (const match of weekendMatches) {
    if (match.opponents === opponentName || match.opponents.includes(opponentName)) {
      return match.discipline
    }
  }
  return undefined
}

function toBestWinMilestone(raw: BestWinRecapMilestone): RecapRecordMilestone {
  const kind =
    raw.kind === 'strength' ? 'best_win_strength' : ('best_win_upset' as const)
  const rankLabel = formatOrdinal(raw.rank)
  return {
    id: `${kind}-${bestWinRowKey(raw.row)}`,
    kind,
    title: `${bestWinTitle(raw.kind)} (${rankLabel} all time)`,
    detail: bestWinDetail(raw.row),
    discipline: raw.row.match.discipline,
    sectionId: 'best-wins',
  }
}

function toOpponentMilestone(
  raw: OpponentMatchupRecapMilestone,
  weekendMatches: NormalizedMatch[],
): RecapRecordMilestone {
  const kind = raw.kind === 'nemesis' ? 'nemesis_top5' : 'scalp_top5'
  return {
    id: `${kind}-${raw.opponentName}`,
    kind,
    title: opponentTitle(raw.kind, raw.rank),
    detail: opponentDetail(raw.kind, raw.opponentName),
    discipline: disciplineForWeekendOpponent(weekendMatches, raw.opponentName),
    sectionId: 'opponent-matchups',
  }
}

export function buildRecapRecordMilestones(
  weekendMatches: NormalizedMatch[],
  priorMatches: NormalizedMatch[],
): RecapRecordMilestone[] {
  const bestWins = detectBestWinRecapMilestones(weekendMatches, priorMatches).map(
    toBestWinMilestone,
  )
  const opponents = detectOpponentMatchupRecapMilestones(
    weekendMatches,
    priorMatches,
  ).map((raw) => toOpponentMilestone(raw, weekendMatches))

  return [...bestWins, ...opponents]
}
