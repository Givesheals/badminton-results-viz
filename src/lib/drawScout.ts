import type { DrawDisciplineGroup, DrawMatchup } from './drawTypes'
import type { NormalizedMatch } from '../types/matchHistory'
import { DISCIPLINE_LABELS } from '../types/matchHistory'
import {
  getDrawScoutPreviousMatches,
} from './drawScoutMatches'
import {
  getNotesForOpponent,
  isScoutingNote,
  noteHasStoredContent,
  sortNotesNewestFirst,
  type OpponentNote,
} from './opponentNotes'
import { recapMatchKey } from './tournamentRecap'
import { parseRoundToStage, STAGE_RANK } from './tournamentProgression'

export type DrawScoutLaterOpponent = {
  name: string
  disciplineCode: string
  /** Knockout round where paths could meet, e.g. Quarter-finals */
  roundLabel: string
}

export type DrawScoutEntrant = {
  name: string
  isYou?: boolean
  isFavourite?: boolean
  disciplineGroups: DrawDisciplineGroup[]
}

export type DrawScoutCompetition = {
  slug: string
  name: string
  /** ISO date (YYYY-MM-DD) of first competition day */
  startDate: string
  /** ISO date (YYYY-MM-DD) of last competition day */
  endDate: string
  competitionUrl: string
  entrants: DrawScoutEntrant[]
  laterOpponentsByEntrant: Record<string, DrawScoutLaterOpponent[]>
}

function parseLocalDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Date(year!, month! - 1, day!)
}

function endOfLocalDay(date: Date): Date {
  const copy = new Date(date)
  copy.setHours(23, 59, 59, 999)
  return copy
}

/** Last Sat/Sun calendar day within the event, else the event end date. */
export function getEventWeekendLastDay(startDate: string, endDate: string): string {
  const start = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  let lastWeekendDay: Date | null = null

  for (let cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
    const day = cursor.getDay()
    if (day === 0 || day === 6) {
      lastWeekendDay = new Date(cursor)
    }
  }

  if (lastWeekendDay == null) return endDate

  const year = lastWeekendDay.getFullYear()
  const month = String(lastWeekendDay.getMonth() + 1).padStart(2, '0')
  const day = String(lastWeekendDay.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isDrawScoutCompetitionExpired(
  comp: Pick<DrawScoutCompetition, 'startDate' | 'endDate'>,
  now: Date = new Date(),
): boolean {
  const competitionEnd = endOfLocalDay(parseLocalDate(comp.endDate))
  const weekendEnd = endOfLocalDay(parseLocalDate(getEventWeekendLastDay(comp.startDate, comp.endDate)))
  const competitionFinished = now > competitionEnd
  const weekendPassed = now > weekendEnd
  return competitionFinished && weekendPassed
}

/** Upcoming or in-progress competitions with a published draw (prototype: all mock comps). */
export function isDrawScoutCompetitionActive(
  comp: DrawScoutCompetition,
  now: Date = new Date(),
): boolean {
  return !isDrawScoutCompetitionExpired(comp, now)
}

export function listActiveDrawScoutCompetitions(
  competitions: DrawScoutCompetition[],
  now: Date = new Date(),
): DrawScoutCompetition[] {
  return competitions
    .filter((comp) => isDrawScoutCompetitionActive(comp, now))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
}

export function getEntrantForCompetition(
  comp: DrawScoutCompetition,
  playerName: string,
): DrawScoutEntrant | null {
  const normalized = playerName.trim().toLowerCase()
  return comp.entrants.find((entrant) => entrant.name.trim().toLowerCase() === normalized) ?? null
}

export function collectOpponentNamesFromDraw(groups: DrawDisciplineGroup[]): string[] {
  const names = new Set<string>()
  for (const group of groups) {
    for (const matchup of group.matchups) {
      for (const player of matchup.opponentSide) {
        names.add(player.name)
      }
    }
  }
  return [...names]
}

export function collectAllOpponentNamesForEntrant(
  comp: DrawScoutCompetition,
  entrant: DrawScoutEntrant,
): string[] {
  const names = new Set(collectOpponentNamesFromDraw(entrant.disciplineGroups))
  for (const later of comp.laterOpponentsByEntrant[entrant.name] ?? []) {
    names.add(later.name)
  }
  return [...names]
}

export function opponentHasScoutingNotes(
  allNotes: OpponentNote[],
  opponentName: string,
): boolean {
  return getNotesForOpponent(allNotes, opponentName).some(
    (note) => isScoutingNote(note) && noteHasStoredContent(note),
  )
}

export function countDrawOpponentsWithNotes(
  comp: DrawScoutCompetition,
  entrant: DrawScoutEntrant,
  allNotes: OpponentNote[],
): number {
  let count = 0
  for (const name of collectAllOpponentNamesForEntrant(comp, entrant)) {
    if (opponentHasScoutingNotes(allNotes, name)) count += 1
  }
  return count
}

export function getDefaultCompetitionSlug(
  competitions: DrawScoutCompetition[],
  options: {
    youName?: string | null
    deepLinkSlug?: string | null
    now?: Date
  } = {},
): string | null {
  const active = listActiveDrawScoutCompetitions(competitions, options.now)
  if (active.length === 0) return null

  if (options.deepLinkSlug) {
    const linked = active.find((comp) => comp.slug === options.deepLinkSlug)
    if (linked) return linked.slug
  }

  const youName = options.youName?.trim().toLowerCase()
  if (youName) {
    const yours = active.find((comp) =>
      comp.entrants.some((entrant) => entrant.isYou || entrant.name.trim().toLowerCase() === youName),
    )
    if (yours) return yours.slug
  }

  const favouriteComp = active.find((comp) => comp.entrants.some((entrant) => entrant.isFavourite))
  if (favouriteComp) return favouriteComp.slug

  return active[0]!.slug
}

export function getDefaultPlayerName(
  comp: DrawScoutCompetition,
  youName?: string | null,
): string | null {
  const you = comp.entrants.find((entrant) => entrant.isYou)
  if (you) return you.name

  if (youName) {
    const match = getEntrantForCompetition(comp, youName)
    if (match) return match.name
  }

  return null
}

export function shouldAutoShowDrawScoutCard(
  competitions: DrawScoutCompetition[],
  options: {
    youName?: string | null
    deepLinkSlug?: string | null
    now?: Date
  } = {},
): boolean {
  const active = listActiveDrawScoutCompetitions(competitions, options.now)
  if (active.length === 0) return false
  if (options.deepLinkSlug && active.some((comp) => comp.slug === options.deepLinkSlug)) {
    return true
  }

  const youName = options.youName?.trim().toLowerCase()
  const youEntered = youName
    ? active.some((comp) =>
        comp.entrants.some(
          (entrant) =>
            entrant.isYou || entrant.name.trim().toLowerCase() === youName,
        ),
      )
    : active.some((comp) => comp.entrants.some((entrant) => entrant.isYou))

  if (youEntered) return true

  return active.some((comp) => comp.entrants.some((entrant) => entrant.isFavourite))
}

export function formatCompetitionPickerLabel(comp: DrawScoutCompetition): string {
  const date = parseLocalDate(comp.startDate)
  const formatted = date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  return `${comp.name} · ${formatted}`
}

export function formatCompetitionDateRange(comp: DrawScoutCompetition): string {
  const start = parseLocalDate(comp.startDate)
  const end = parseLocalDate(comp.endDate)
  const sameDay =
    comp.startDate === comp.endDate ||
    start.toDateString() === end.toDateString()
  if (sameDay) {
    return start.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  const from = start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const to = end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${from} – ${to}`
}

export type DrawRoundGroup = {
  roundLabel: string
  matchups: DrawMatchup[]
}

/** Group matchups that share a round (typical for upcoming group-stage draws). */
export function groupMatchupsByRound(matchups: DrawMatchup[]): DrawRoundGroup[] {
  const order: string[] = []
  const byRound = new Map<string, DrawMatchup[]>()
  for (const matchup of matchups) {
    if (!byRound.has(matchup.roundLabel)) {
      order.push(matchup.roundLabel)
      byRound.set(matchup.roundLabel, [])
    }
    byRound.get(matchup.roundLabel)!.push(matchup)
  }
  return order.map((roundLabel) => ({
    roundLabel,
    matchups: byRound.get(roundLabel)!,
  }))
}

export function getMatchupOpponentNames(matchup: DrawMatchup): string[] {
  return matchup.opponentSide.map((player) => player.name)
}

export type MatchupIntelCounts = {
  noteCount: number
  gamesPlayed: number
}

/** Aggregates personal notes + unique previous meetings across a matchup’s opponent side. */
export function getMatchupIntelCounts(
  matchup: DrawMatchup,
  displayNotes: OpponentNote[],
  displayMatches: NormalizedMatch[],
  viewerName: string,
): MatchupIntelCounts {
  let noteCount = 0
  const matchKeys = new Set<string>()
  const seenNoteIds = new Set<string>()

  for (const player of matchup.opponentSide) {
    for (const note of getNotesForOpponent(displayNotes, player.name)) {
      if (!isScoutingNote(note) || !noteHasStoredContent(note)) continue
      if (seenNoteIds.has(note.id)) continue
      seenNoteIds.add(note.id)
      noteCount += 1
    }

    for (const match of getDrawScoutPreviousMatches(displayMatches, player.name, viewerName)
      .matches) {
      matchKeys.add(recapMatchKey(match))
    }
  }

  return { noteCount, gamesPlayed: matchKeys.size }
}

export function isExactDrawPairNote(
  note: OpponentNote,
  opponentA: string,
  opponentB: string,
): boolean {
  if (note.target.kind !== 'pair') return false
  if (!isScoutingNote(note) || !noteHasStoredContent(note)) return false
  const names = new Set(note.context.opponentNames.map((name) => name.trim().toLowerCase()))
  return (
    names.has(opponentA.trim().toLowerCase()) && names.has(opponentB.trim().toLowerCase())
  )
}

export function getExactDrawPairNotes(
  displayNotes: OpponentNote[],
  opponentA: string,
  opponentB: string,
): OpponentNote[] {
  return sortNotesNewestFirst(
    displayNotes.filter((note) => isExactDrawPairNote(note, opponentA, opponentB)),
  )
}

/** Solo notes + pair notes with a different partner (exact draw-pair notes excluded). */
export function getIndividualDrawScoutNotes(
  displayNotes: OpponentNote[],
  opponentName: string,
  coOpponentName: string | null,
): OpponentNote[] {
  return sortNotesNewestFirst(
    getNotesForOpponent(displayNotes, opponentName).filter((note) => {
      if (!isScoutingNote(note) || !noteHasStoredContent(note)) return false
      if (note.target.kind === 'opponent') return true
      if (note.target.kind !== 'pair') return false
      if (coOpponentName == null) return true
      return !isExactDrawPairNote(note, opponentName, coOpponentName)
    }),
  )
}

/**
 * Collapsed draw-scout teaser. Prefers a notes CTA when personal notes exist;
 * history-only rows keep the games label (UI still reserves the notes badge slot).
 * Null when there is nothing to open.
 */
export type MatchupIntelTeaser = {
  hasNotes: boolean
  /** Present when the matchup has personal notes — rendered as a pill CTA. */
  notesCta: string | null
  gamesLabel: string | null
}

export function formatGamesPlayedLabel(gamesPlayed: number): string | null {
  if (gamesPlayed <= 0) return null
  return `Your games: ${gamesPlayed}`
}

export function formatMatchupIntelTeaser(
  noteCount: number,
  gamesPlayed: number,
  _options?: { viewingOwnDraw?: boolean },
): MatchupIntelTeaser | null {
  const gamesLabel = formatGamesPlayedLabel(gamesPlayed)

  if (noteCount > 0) {
    return { hasNotes: true, notesCta: 'View notes', gamesLabel }
  }
  if (gamesLabel != null) {
    return { hasNotes: false, notesCta: null, gamesLabel }
  }
  return null
}

export function getLaterOpponentRoundRank(opponent: Pick<DrawScoutLaterOpponent, 'roundLabel'>): number {
  const stage = parseRoundToStage(opponent.roundLabel)
  return stage != null ? STAGE_RANK[stage] : Number.MAX_SAFE_INTEGER
}

export function formatLaterOpponentDisciplineLabel(opponent: DrawScoutLaterOpponent): string {
  return DISCIPLINE_LABELS[opponent.disciplineCode] ?? opponent.disciplineCode
}

/** Sort knockout-path opponents earliest round first (quarters before semis). */
export function sortLaterOpponents(
  opponents: DrawScoutLaterOpponent[],
): DrawScoutLaterOpponent[] {
  return [...opponents].sort((a, b) => {
    const roundDiff = getLaterOpponentRoundRank(a) - getLaterOpponentRoundRank(b)
    if (roundDiff !== 0) return roundDiff
    const disciplineDiff = a.disciplineCode.localeCompare(b.disciplineCode)
    if (disciplineDiff !== 0) return disciplineDiff
    return a.name.localeCompare(b.name)
  })
}

export type LaterOpponentRoundGroup = {
  roundLabel: string
  opponents: DrawScoutLaterOpponent[]
}

export function groupLaterOpponentsByRound(
  opponents: DrawScoutLaterOpponent[],
): LaterOpponentRoundGroup[] {
  const sorted = sortLaterOpponents(opponents)
  const order: string[] = []
  const byRound = new Map<string, DrawScoutLaterOpponent[]>()

  for (const opponent of sorted) {
    if (!byRound.has(opponent.roundLabel)) {
      order.push(opponent.roundLabel)
      byRound.set(opponent.roundLabel, [])
    }
    byRound.get(opponent.roundLabel)!.push(opponent)
  }

  return order.map((roundLabel) => ({
    roundLabel,
    opponents: byRound.get(roundLabel)!,
  }))
}

export function laterOpponentHasViewerIntel(
  opponent: DrawScoutLaterOpponent,
  displayNotes: OpponentNote[],
  displayMatches: NormalizedMatch[],
  viewerName: string,
): boolean {
  const hasNotes = opponentHasScoutingNotes(displayNotes, opponent.name)
  const hasHistory =
    getDrawScoutPreviousMatches(displayMatches, opponent.name, viewerName).matches.length > 0
  return hasNotes || hasHistory
}

export function filterLaterOpponentsWithViewerIntel(
  opponents: DrawScoutLaterOpponent[],
  displayNotes: OpponentNote[],
  displayMatches: NormalizedMatch[],
  viewerName: string,
): DrawScoutLaterOpponent[] {
  return sortLaterOpponents(opponents).filter((opponent) =>
    laterOpponentHasViewerIntel(opponent, displayNotes, displayMatches, viewerName),
  )
}
