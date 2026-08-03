import type {
  DrawDisciplineGroup,
  DrawMatchup,
  DrawOpponentPathStatus,
  DrawPlayer,
  DrawPlayerBusyStatus,
  DrawUpdateCadence,
} from './drawTypes'
import type { NormalizedMatch } from '../types/matchHistory'
import { DISCIPLINE_LABELS } from '../types/matchHistory'
import { getDisciplineFamily } from './disciplineStyle'
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
  opponentSide: DrawPlayer[]
  disciplineCode: string
  /** Knockout round where paths could meet, e.g. Quarter-finals */
  roundLabel: string
  /** Likelihood of facing this opponent in this round; opponents in the same round sum to 1. */
  probability: number
  /** Optional path cue when shown as a probable next opponent. */
  pathStatus?: DrawOpponentPathStatus
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
  /** Mock/prototype fixtures stay visible regardless of calendar date. */
  isPrototype?: boolean
  /** ISO datetime of last results ingest for this competition. */
  resultsLastUpdatedAt?: string
  /** How often this competition’s results feed tends to update. */
  updateCadence?: DrawUpdateCadence
  /** Players still active in another discipline (keyed by full display name). */
  busyPlayersByName?: Record<string, DrawPlayerBusyStatus>
}

/** Updates older than this are treated as stale for busy-banner wording. */
export const DRAW_RESULTS_STALE_MS = 2 * 60 * 60 * 1000

export function isDrawResultsUpdateStale(
  resultsLastUpdatedAt: string | undefined,
  now: Date = new Date(),
): boolean {
  if (resultsLastUpdatedAt == null || resultsLastUpdatedAt === '') return false
  const updated = new Date(resultsLastUpdatedAt)
  if (Number.isNaN(updated.getTime())) return false
  return now.getTime() - updated.getTime() >= DRAW_RESULTS_STALE_MS
}

/** Relative phrase for a past ISO datetime, e.g. "14 min ago", "2 hr ago". */
export function formatDrawRelativeTime(
  isoDatetime: string,
  now: Date = new Date(),
): string | null {
  const then = new Date(isoDatetime)
  if (Number.isNaN(then.getTime())) return null
  const deltaMs = Math.max(0, now.getTime() - then.getTime())
  const minutes = Math.floor(deltaMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

export function formatResultsLastUpdatedLine(
  comp: Pick<DrawScoutCompetition, 'resultsLastUpdatedAt' | 'updateCadence'>,
  now: Date = new Date(),
): string | null {
  if (comp.resultsLastUpdatedAt == null) return null
  const relative = formatDrawRelativeTime(comp.resultsLastUpdatedAt, now)
  if (relative == null) return null
  const base = `Results last updated ${relative}`
  if (comp.updateCadence === 'sporadic') {
    return `${base} · scores may lag`
  }
  return base
}

export type DrawBusyBannerCopy = {
  lead: string
  support: string
}

/**
 * Busy statuses for named players on a side (upcoming / probable only — caller
 * must not pass played matchups).
 */
export function getBusyStatusesForPlayers(
  players: { name: string }[],
  busyPlayersByName: Record<string, DrawPlayerBusyStatus> | undefined,
): Array<{ playerName: string; status: DrawPlayerBusyStatus }> {
  if (busyPlayersByName == null) return []
  const rows: Array<{ playerName: string; status: DrawPlayerBusyStatus }> = []
  for (const player of players) {
    const status = busyPlayersByName[player.name]
    if (status == null) continue
    if (!status.disciplineCode || !status.nextRoundShort) continue
    rows.push({ playerName: player.name, status })
  }
  return rows
}

export function formatCrossDisciplineBusyBanner(
  playerName: string,
  status: DrawPlayerBusyStatus,
  options: {
    resultsLastUpdatedAt?: string
    now?: Date
  } = {},
): DrawBusyBannerCopy {
  const now = options.now ?? new Date()
  const relative =
    options.resultsLastUpdatedAt != null
      ? formatDrawRelativeTime(options.resultsLastUpdatedAt, now)
      : null
  const stale = isDrawResultsUpdateStale(options.resultsLastUpdatedAt, now)
  const firstName = playerName.split(/\s+/)[0] ?? playerName
  const code = status.disciplineCode
  const lead =
    stale && relative != null
      ? `As of ${relative}: ${firstName} still in ${code}`
      : `${firstName} still playing ${code}`
  const roundCue = `${status.nextRoundShort} next`
  const support =
    !stale && relative != null ? `${roundCue} · ${relative}` : roundCue
  return { lead, support }
}

/**
 * Compact path line under a probable opponent: remaining group games or next
 * round, plus when results were last updated.
 *
 * Examples: `1 group game remaining · 14 min ago` · `QF next · 14 min ago`
 */
export function formatOpponentPathStatusLine(
  pathStatus: DrawOpponentPathStatus,
  options: {
    resultsLastUpdatedAt?: string
    now?: Date
  } = {},
): string {
  const now = options.now ?? new Date()
  const relative =
    options.resultsLastUpdatedAt != null
      ? formatDrawRelativeTime(options.resultsLastUpdatedAt, now)
      : null
  const remaining = pathStatus.groupGamesRemaining
  let core: string
  if (remaining != null && remaining > 0) {
    core =
      remaining === 1
        ? '1 group game remaining'
        : `${remaining} group games remaining`
  } else {
    core = `${pathStatus.nextRoundShort} next`
  }
  return relative != null ? `${core} · ${relative}` : core
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
  if (comp.isPrototype) return true
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
      for (const probable of matchup.probableOpponents ?? []) {
        for (const player of probable.opponentSide) {
          names.add(player.name)
        }
      }
    }
  }
  return [...names]
}

/**
 * Discipline header identity: singles = viewed player + rating;
 * doubles/mixed = viewed player & partner with ratings.
 */
export function getDisciplinePairIdentityLabel(
  group: DrawDisciplineGroup,
  viewedPlayerName: string,
): string | null {
  const family = getDisciplineFamily(group.disciplineCode)
  const viewedKey = viewedPlayerName.trim().toLowerCase()

  const formatPlayer = (player: DrawPlayer): string => {
    const rating = player.rating != null ? ` (${player.rating})` : ''
    return `${player.name}${rating}`
  }

  if (family === 'singles') {
    const yourSide =
      group.matchups.find((matchup) => matchup.yourSide.length >= 1)?.yourSide ?? null
    if (yourSide == null || yourSide.length === 0) return null
    const viewed =
      yourSide.find((player) => player.name.trim().toLowerCase() === viewedKey) ?? yourSide[0]!
    return formatPlayer(viewed)
  }

  if (family !== 'doubles' && family !== 'mixed') return null

  const yourSide =
    group.matchups.find((matchup) => matchup.yourSide.length >= 2)?.yourSide ?? null
  if (yourSide == null || yourSide.length < 2) return null

  const viewedIndex = yourSide.findIndex(
    (player) => player.name.trim().toLowerCase() === viewedKey,
  )
  const ordered =
    viewedIndex <= 0
      ? yourSide
      : [yourSide[viewedIndex]!, ...yourSide.filter((_, index) => index !== viewedIndex)]

  return ordered.slice(0, 2).map(formatPlayer).join(' & ')
}

/** Group-stage round labels (e.g. "Group A"); everything else is treated as knockout. */
export function isGroupRoundLabel(roundLabel: string): boolean {
  return /^group\b/i.test(roundLabel.trim())
}

/** True when the matchup has a recorded result (compact result card). */
export function isPlayedMatchup(matchup: DrawMatchup): boolean {
  return matchup.result != null
}

/**
 * True when this is a promoted next-round slot with the opponent still unsettled
 * (probable-opponents list, not a definite scout card).
 */
export function isProbableNextMatchup(matchup: DrawMatchup): boolean {
  return matchup.opponentPending === true
}

/** True when every matchup in the round has a recorded result. */
export function isRoundFullyPlayed(matchups: DrawMatchup[]): boolean {
  return matchups.length > 0 && matchups.every(isPlayedMatchup)
}

/** True when the round still has an unplayed or opponent-pending matchup. */
export function isRoundUnfinished(matchups: DrawMatchup[]): boolean {
  return matchups.some((matchup) => isProbableNextMatchup(matchup) || !isPlayedMatchup(matchup))
}

export type DrawRoundSectionRole = 'played' | 'up-next'

/**
 * First unfinished round is “up next”; fully-played rounds before (and after) are “played”.
 * Used to weight round headers so the next stage reads clearly.
 */
export function getDrawRoundSectionRoles(
  roundGroups: ReadonlyArray<{ roundLabel: string; matchups: DrawMatchup[] }>,
): Map<string, DrawRoundSectionRole> {
  const roles = new Map<string, DrawRoundSectionRole>()
  let markedNext = false

  for (const group of roundGroups) {
    if (!markedNext && isRoundUnfinished(group.matchups)) {
      roles.set(group.roundLabel, 'up-next')
      markedNext = true
      continue
    }
    roles.set(group.roundLabel, 'played')
  }

  return roles
}

export type DrawRoundSectionHeading = {
  title: string
  /** Optional quieter line under the title (e.g. group name while still in groups). */
  subtitle: string | null
}

/** Copy for round headers: played archive vs clear “still in groups” / “up next”. */
export function formatDrawRoundSectionHeading(
  roundLabel: string,
  role: DrawRoundSectionRole,
): DrawRoundSectionHeading {
  if (role === 'played') {
    return { title: `Played · ${roundLabel}`, subtitle: null }
  }
  if (isGroupRoundLabel(roundLabel)) {
    return { title: 'Still in group stages', subtitle: roundLabel }
  }
  return { title: `Up next · ${roundLabel}`, subtitle: null }
}

export function formatMatchResultOutcome(outcome: 'win' | 'loss'): string {
  return outcome === 'win' ? 'Win' : 'Loss'
}

export function collectAllOpponentNamesForEntrant(
  comp: DrawScoutCompetition,
  entrant: DrawScoutEntrant,
): string[] {
  const names = new Set(collectOpponentNamesFromDraw(entrant.disciplineGroups))
  for (const later of comp.laterOpponentsByEntrant[entrant.name] ?? []) {
    for (const player of later.opponentSide) {
      names.add(player.name)
    }
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
 * Collapsed draw-companion teaser. Prefers a notes CTA when personal notes exist;
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
  return `Played you: ${gamesPlayed}`
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

export function formatLaterOpponentProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`
}

export function laterOpponentDisplayName(opponent: DrawScoutLaterOpponent): string {
  return opponent.opponentSide.map((player) => player.name).join(' & ')
}

export function laterOpponentKey(opponent: DrawScoutLaterOpponent): string {
  return `${opponent.disciplineCode}:${opponent.roundLabel}:${laterOpponentDisplayName(opponent)}`
}

export function filterLaterOpponentsByDiscipline(
  opponents: DrawScoutLaterOpponent[],
  disciplineCode: string,
): DrawScoutLaterOpponent[] {
  return opponents.filter((opponent) => opponent.disciplineCode === disciplineCode)
}

/**
 * Later-opponent rows for a discipline, excluding rounds already promoted into
 * the main matchup list (definite or probable next).
 */
export function filterLaterOpponentsForDisciplineDraw(
  opponents: DrawScoutLaterOpponent[],
  disciplineCode: string,
  matchups: DrawMatchup[],
): DrawScoutLaterOpponent[] {
  const promotedRounds = new Set(
    matchups
      .filter((matchup) => !isGroupRoundLabel(matchup.roundLabel))
      .map((matchup) => matchup.roundLabel),
  )
  return filterLaterOpponentsByDiscipline(opponents, disciplineCode).filter(
    (opponent) => !promotedRounds.has(opponent.roundLabel),
  )
}

/** Sort knockout-path opponents by probability within a round (highest first). */
export function sortLaterOpponentsWithinRound(
  opponents: DrawScoutLaterOpponent[],
): DrawScoutLaterOpponent[] {
  return [...opponents].sort((a, b) => {
    const probDiff = b.probability - a.probability
    if (probDiff !== 0) return probDiff
    return laterOpponentDisplayName(a).localeCompare(laterOpponentDisplayName(b))
  })
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
    return b.probability - a.probability
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
    opponents: sortLaterOpponentsWithinRound(byRound.get(roundLabel)!),
  }))
}

export function laterOpponentToMatchup(opponent: DrawScoutLaterOpponent): DrawMatchup {
  return {
    id: laterOpponentKey(opponent),
    roundLabel: opponent.roundLabel,
    yourSide: [],
    opponentSide: opponent.opponentSide,
  }
}

export function getLaterOpponentIntelCounts(
  opponent: DrawScoutLaterOpponent,
  displayNotes: OpponentNote[],
  displayMatches: NormalizedMatch[],
  viewerName: string,
): MatchupIntelCounts {
  return getMatchupIntelCounts(
    laterOpponentToMatchup(opponent),
    displayNotes,
    displayMatches,
    viewerName,
  )
}

export function laterOpponentHasViewerIntel(
  opponent: DrawScoutLaterOpponent,
  displayNotes: OpponentNote[],
  displayMatches: NormalizedMatch[],
  viewerName: string,
): boolean {
  const counts = getLaterOpponentIntelCounts(opponent, displayNotes, displayMatches, viewerName)
  return counts.noteCount > 0 || counts.gamesPlayed > 0
}
