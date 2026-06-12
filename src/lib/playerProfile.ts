import type { NormalizedMatch } from '../types/matchHistory'
import { competitiveMatches, isCompetitiveMatch } from './matchExclusions'
import { quarterKey } from './timePeriods'
import {
  getMatchGames,
  isCloseMatch,
  isGameWon,
  type MatchGameScore,
} from './matchScores'
import {
  getMatchExpectedWinProbability,
  getOpponentTeamRating,
  getOurTeamRating,
} from './ratings'

/** Minimum competitive matches for a full player profile. */
export const MIN_COMPETITIVE_MATCHES = 30

/** Minimum rated matches (both teams) for rating-based axes. */
export const MIN_RATED_MATCHES = 20

/** Finisher if game-3 win% minus game-1 win% is at least this (percentage points). */
export const FINISHER_GAME_GAP_PP = 8

/** Crusher if underdog win% is at least this. */
export const CRUSHER_UNDERDOG_WIN_PERCENT = 30

/** Minimum underdog matches to score the upset axis. */
export const MIN_UNDERDOG_MATCHES = 5

/** Clutch if close-match win% is at least this. */
export const CLUTCH_CLOSE_WIN_PERCENT = 55

/** Minimum close matches to score the clutch axis. */
export const MIN_CLOSE_MATCHES = 8

/** Reliable if favourite win% is at least this. */
export const RELIABLE_FAVOURITE_WIN_PERCENT = 68

/** Stable players convert favourites and rarely win as underdog. */
export const STABLE_FAVOURITE_WIN_PERCENT = 65
export const STABLE_MAX_UNDERDOG_WIN_PERCENT = 22

/** Wildcard: leaky as favourite. */
export const WILDCARD_LEAKY_FAVOURITE_WIN_PERCENT = 58

/** Wildcard: upsets mixed with favourite losses (unpredictable). */
export const WILDCARD_CHAOTIC_UNDERDOG_WIN_PERCENT = 28
export const WILDCARD_CHAOTIC_MAX_FAVOURITE_WIN_PERCENT = 65

/** Quarterly win-rate std dev above this suggests a Wildcard (percentage points). */
export const WILDCARD_WIN_RATE_VOLATILITY_PP = 22

/** Minimum quarters with enough matches to measure volatility. */
export const MIN_VOLATILITY_QUARTERS = 3

/** Rating gap (opponent minus us) treated as underdog territory. */
export const UNDERDOG_RATING_GAP = 25

/** Expected win below this counts as underdog. */
export const UNDERDOG_EXPECTED_WIN = 0.4

/** Expected win at or above this counts as favourite. */
export const FAVOURITE_EXPECTED_WIN = 0.55

/** Heavy favourite threshold for composed-style wins. */
export const COMPOSED_FAVOURITE_EXPECTED_WIN = 0.65

export type AxisKey = 'F' | 'U' | 'C' | 'S'

export type AxisPole = 'high' | 'low'

export type AxisConfidence = 'high' | 'medium' | 'low'

/** Four-letter code: F/G · C/H · L/O · R/W */
export type PlayerCode =
  | 'FCLR'
  | 'FCLW'
  | 'FCOR'
  | 'FCOW'
  | 'FHLR'
  | 'FHLW'
  | 'FHOR'
  | 'FHOW'
  | 'GCLR'
  | 'GCLW'
  | 'GCOR'
  | 'GCOW'
  | 'GHLR'
  | 'GHLW'
  | 'GHOR'
  | 'GHOW'

export type AxisScore = {
  key: AxisKey
  score: number
  pole: AxisPole
  highLabel: string
  lowLabel: string
  confidence: AxisConfidence
  sampleCount: number
  detail: string
}

export type GameWinRates = {
  game1: { wins: number; played: number; winPercent: number | null }
  game2: { wins: number; played: number; winPercent: number | null }
  game3: { wins: number; played: number; winPercent: number | null }
}

export type StreakStats = {
  longestWinStreak: number
  longestLossStreak: number
  currentStreak: number
  currentStreakType: 'win' | 'loss' | 'none'
}

export type PlayerProfile = {
  sufficientData: boolean
  competitiveMatchCount: number
  ratedMatchCount: number
  code: PlayerCode | null
  axes: AxisScore[]
  gameWinRates: GameWinRates
  streaks: StreakStats
  /** Stat line for the hero celebration (e.g. close-match win %). */
  celebrationStat: string | null
  underdogWinPercent: number | null
  favouriteWinPercent: number | null
  closeMatchWinPercent: number | null
}

export type ProfileComparison = {
  shifted: boolean
  shiftedAxes: AxisKey[]
  allTimeName: string | null
  recentName: string | null
  message: string | null
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10
}

function winPercent(wins: number, played: number): number | null {
  if (played === 0) return null
  return roundPercent((wins / played) * 100)
}

function confidenceFromCount(
  count: number,
  highMin: number,
  mediumMin: number,
): AxisConfidence {
  if (count >= highMin) return 'high'
  if (count >= mediumMin) return 'medium'
  return 'low'
}

export function computeGameWinRates(matches: NormalizedMatch[]): GameWinRates {
  const buckets = {
    1: { wins: 0, played: 0 },
    2: { wins: 0, played: 0 },
    3: { wins: 0, played: 0 },
  }

  for (const match of competitiveMatches(matches)) {
    for (const game of getMatchGames(match)) {
      const bucket = buckets[game.game as 1 | 2 | 3]
      bucket.played += 1
      if (isGameWon(game)) bucket.wins += 1
    }
  }

  return {
    game1: {
      ...buckets[1],
      winPercent: winPercent(buckets[1].wins, buckets[1].played),
    },
    game2: {
      ...buckets[2],
      winPercent: winPercent(buckets[2].wins, buckets[2].played),
    },
    game3: {
      ...buckets[3],
      winPercent: winPercent(buckets[3].wins, buckets[3].played),
    },
  }
}

function isRatedMatch(match: NormalizedMatch): boolean {
  return (
    getOurTeamRating(match) != null &&
    getOpponentTeamRating(match.raw, match.discipline) != null
  )
}

function isUnderdogMatch(match: NormalizedMatch): boolean {
  const our = getOurTeamRating(match)
  const opp = getOpponentTeamRating(match.raw, match.discipline)
  if (our != null && opp != null && opp - our >= UNDERDOG_RATING_GAP) {
    return true
  }
  const expected = getMatchExpectedWinProbability(match)
  return expected != null && expected < UNDERDOG_EXPECTED_WIN
}

function isFavouriteMatch(match: NormalizedMatch): boolean {
  const expected = getMatchExpectedWinProbability(match)
  return expected != null && expected >= FAVOURITE_EXPECTED_WIN
}

function isComposedStyleWin(match: NormalizedMatch): boolean {
  if (!isCompetitiveMatch(match) || match.outcome !== 'win') return false
  const expected = getMatchExpectedWinProbability(match)
  if (expected == null || expected < COMPOSED_FAVOURITE_EXPECTED_WIN) return false
  const games = getMatchGames(match)
  if (games.length !== 2) return false
  return games.every((g) => isGameWon(g))
}

export function computeStreakStats(matches: NormalizedMatch[]): StreakStats {
  const sorted = [...competitiveMatches(matches)].sort((a, b) =>
    a.date.localeCompare(b.date),
  )

  let longestWin = 0
  let longestLoss = 0
  let currentWin = 0
  let currentLoss = 0

  for (const match of sorted) {
    if (match.outcome === 'win') {
      currentWin += 1
      currentLoss = 0
      longestWin = Math.max(longestWin, currentWin)
    } else if (match.outcome === 'loss') {
      currentLoss += 1
      currentWin = 0
      longestLoss = Math.max(longestLoss, currentLoss)
    } else {
      currentWin = 0
      currentLoss = 0
    }
  }

  const last = sorted[sorted.length - 1]
  if (last?.outcome === 'win') {
    return {
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      currentStreak: currentWin,
      currentStreakType: 'win',
    }
  }
  if (last?.outcome === 'loss') {
    return {
      longestWinStreak: longestWin,
      longestLossStreak: longestLoss,
      currentStreak: currentLoss,
      currentStreakType: 'loss',
    }
  }

  return {
    longestWinStreak: longestWin,
    longestLossStreak: longestLoss,
    currentStreak: 0,
    currentStreakType: 'none',
  }
}

function scoreFinisherAxis(
  gameWinRates: GameWinRates,
): Pick<AxisScore, 'score' | 'pole' | 'confidence' | 'sampleCount' | 'detail'> {
  const g1 = gameWinRates.game1
  const g3 = gameWinRates.game3
  const sampleCount = Math.min(g1.played, g3.played)
  const confidence = confidenceFromCount(sampleCount, 40, 15)

  if (g1.winPercent == null || g3.winPercent == null) {
    return {
      score: 50,
      pole: 'low',
      confidence: 'low',
      sampleCount,
      detail: 'Not enough game-by-game data yet',
    }
  }

  const gap = g3.winPercent - g1.winPercent
  const pole: AxisPole = gap >= FINISHER_GAME_GAP_PP ? 'high' : 'low'
  const score = Math.max(0, Math.min(100, 50 + gap * 2.5))

  return {
    score: roundPercent(score),
    pole,
    confidence,
    sampleCount,
    detail:
      pole === 'high'
        ? `You win ${g3.winPercent}% of game 3s vs ${g1.winPercent}% of game 1s`
        : `You win ${g1.winPercent}% of game 1s vs ${g3.winPercent}% of game 3s`,
  }
}

function scoreUpsetAxis(matches: NormalizedMatch[]): {
  axis: Pick<AxisScore, 'score' | 'pole' | 'confidence' | 'sampleCount' | 'detail'>
  underdogWinPercent: number | null
} {
  const rated = competitiveMatches(matches).filter(isRatedMatch)
  const underdog = rated.filter(isUnderdogMatch)
  const underdogWins = underdog.filter((m) => m.outcome === 'win').length
  const underdogWinPercent = winPercent(underdogWins, underdog.length)
  const confidence = confidenceFromCount(
    underdog.length,
    MIN_UNDERDOG_MATCHES * 4,
    MIN_UNDERDOG_MATCHES,
  )

  if (underdogWinPercent == null) {
    return {
      axis: {
        score: 50,
        pole: 'low',
        confidence: 'low',
        sampleCount: 0,
        detail: 'No rated underdog matches yet',
      },
      underdogWinPercent: null,
    }
  }

  const pole: AxisPole =
    underdog.length >= MIN_UNDERDOG_MATCHES &&
    underdogWinPercent >= CRUSHER_UNDERDOG_WIN_PERCENT
      ? 'high'
      : 'low'
  const score = Math.max(
    0,
    Math.min(100, (underdogWinPercent / CRUSHER_UNDERDOG_WIN_PERCENT) * 50),
  )

  return {
    underdogWinPercent,
    axis: {
      score: roundPercent(score),
      pole,
      confidence,
      sampleCount: underdog.length,
      detail:
        pole === 'high'
          ? `You win ${underdogWinPercent}% of matches as the underdog`
          : `You win ${underdogWinPercent}% of matches as the underdog — room to land more upsets`,
    },
  }
}

function scoreClutchAxis(matches: NormalizedMatch[]): {
  axis: Pick<AxisScore, 'score' | 'pole' | 'confidence' | 'sampleCount' | 'detail'>
  closeMatchWinPercent: number | null
} {
  const competitive = competitiveMatches(matches)
  const close = competitive.filter(isCloseMatch)
  const closeWins = close.filter((m) => m.outcome === 'win').length
  const closeMatchWinPercent = winPercent(closeWins, close.length)
  const confidence = confidenceFromCount(
    close.length,
    MIN_CLOSE_MATCHES * 3,
    MIN_CLOSE_MATCHES,
  )

  if (closeMatchWinPercent == null) {
    return {
      closeMatchWinPercent: null,
      axis: {
        score: 50,
        pole: 'low',
        confidence: 'low',
        sampleCount: 0,
        detail: 'No close matches in the data yet',
      },
    }
  }

  const pole: AxisPole =
    close.length >= MIN_CLOSE_MATCHES &&
    closeMatchWinPercent >= CLUTCH_CLOSE_WIN_PERCENT
      ? 'high'
      : 'low'
  const score = Math.max(
    0,
    Math.min(100, (closeMatchWinPercent / CLUTCH_CLOSE_WIN_PERCENT) * 50),
  )

  return {
    closeMatchWinPercent,
    axis: {
      score: roundPercent(score),
      pole,
      confidence,
      sampleCount: close.length,
      detail:
        pole === 'high'
          ? `You win ${closeMatchWinPercent}% of tight, three-game matches`
          : `You win ${closeMatchWinPercent}% of tight matches — composed wins may be your strength`,
    },
  }
}

function computeQuarterlyWinRateVolatility(matches: NormalizedMatch[]): number | null {
  const competitive = competitiveMatches(matches)
  const buckets = new Map<string, { wins: number; losses: number }>()

  for (const match of competitive) {
    if (match.outcome !== 'win' && match.outcome !== 'loss') continue
    const key = quarterKey(match.date)
    if (!key) continue
    const bucket = buckets.get(key) ?? { wins: 0, losses: 0 }
    if (match.outcome === 'win') bucket.wins += 1
    else bucket.losses += 1
    buckets.set(key, bucket)
  }

  const quarterPercents = [...buckets.values()]
    .map(({ wins, losses }) => {
      const decided = wins + losses
      if (decided < 3) return null
      return (wins / decided) * 100
    })
    .filter((p): p is number => p != null)

  if (quarterPercents.length < MIN_VOLATILITY_QUARTERS) return null

  const mean =
    quarterPercents.reduce((sum, p) => sum + p, 0) / quarterPercents.length
  const variance =
    quarterPercents.reduce((sum, p) => sum + (p - mean) ** 2, 0) /
    quarterPercents.length
  return roundPercent(Math.sqrt(variance))
}

function scoreReliableAxis(
  matches: NormalizedMatch[],
  underdogWinPercent: number | null,
): {
  axis: Pick<AxisScore, 'score' | 'pole' | 'confidence' | 'sampleCount' | 'detail'>
  favouriteWinPercent: number | null
} {
  const rated = competitiveMatches(matches).filter(isRatedMatch)
  const favourite = rated.filter(isFavouriteMatch)
  const favouriteWins = favourite.filter((m) => m.outcome === 'win').length
  const favouriteWinPercent = winPercent(favouriteWins, favourite.length)
  const volatility = computeQuarterlyWinRateVolatility(matches)
  const confidence = confidenceFromCount(favourite.length, 40, 15)

  if (favouriteWinPercent == null) {
    return {
      favouriteWinPercent: null,
      axis: {
        score: 50,
        pole: 'low',
        confidence: 'low',
        sampleCount: 0,
        detail: 'No rated favourite matches yet',
      },
    }
  }

  const stableByFavourite = favouriteWinPercent >= RELIABLE_FAVOURITE_WIN_PERCENT
  const stablePattern =
    favouriteWinPercent >= STABLE_FAVOURITE_WIN_PERCENT &&
    underdogWinPercent != null &&
    underdogWinPercent <= STABLE_MAX_UNDERDOG_WIN_PERCENT

  const leakyFavourite = favouriteWinPercent < WILDCARD_LEAKY_FAVOURITE_WIN_PERCENT
  const chaoticPattern =
    underdogWinPercent != null &&
    underdogWinPercent >= WILDCARD_CHAOTIC_UNDERDOG_WIN_PERCENT &&
    favouriteWinPercent < WILDCARD_CHAOTIC_MAX_FAVOURITE_WIN_PERCENT
  const volatileResults =
    volatility != null && volatility >= WILDCARD_WIN_RATE_VOLATILITY_PP

  let pole: AxisPole
  if (stableByFavourite || stablePattern) {
    pole = 'high'
  } else if (leakyFavourite || chaoticPattern || volatileResults) {
    pole = 'low'
  } else {
    pole = favouriteWinPercent >= 62 ? 'high' : 'low'
  }

  let score = favouriteWinPercent
  if (stablePattern) score = Math.min(100, score + 12)
  if (leakyFavourite) score = Math.max(0, score - 25)
  if (chaoticPattern) score = Math.max(0, score - 20)
  if (volatileResults) score = Math.max(0, score - 15)
  score = Math.max(0, Math.min(100, score))

  let detail: string
  if (pole === 'high' && stablePattern && underdogWinPercent != null) {
    detail = `You win ${favouriteWinPercent}% as favourite and only ${underdogWinPercent}% as underdog — a steady, predictable profile`
  } else if (pole === 'high') {
    detail = `You win ${favouriteWinPercent}% of matches when you're the favourite`
  } else if (chaoticPattern && underdogWinPercent != null) {
    detail = `You win ${underdogWinPercent}% as underdog but only ${favouriteWinPercent}% as favourite — results can swing either way`
  } else if (volatileResults) {
    detail = `Your win rate varies by quarter (±${volatility}pp) — more favourite conversion would steady things`
  } else {
    detail = `You win ${favouriteWinPercent}% as favourite — tightening this stabilises results`
  }

  return {
    favouriteWinPercent,
    axis: {
      score: roundPercent(score),
      pole,
      confidence,
      sampleCount: favourite.length,
      detail,
    },
  }
}

export function buildPlayerCode(axes: AxisScore[]): PlayerCode {
  const byKey = Object.fromEntries(axes.map((a) => [a.key, a.pole])) as Record<
    AxisKey,
    AxisPole
  >

  const f = byKey.F === 'high' ? 'F' : 'G'
  const u = byKey.U === 'high' ? 'C' : 'H'
  const c = byKey.C === 'high' ? 'L' : 'O'
  const s = byKey.S === 'high' ? 'R' : 'W'

  return `${f}${u}${c}${s}` as PlayerCode
}

function pickCelebrationStat(
  profile: Omit<PlayerProfile, 'celebrationStat' | 'sufficientData' | 'code'>,
): string | null {
  const clutch = profile.axes.find((a) => a.key === 'C')
  if (profile.closeMatchWinPercent != null && clutch?.pole === 'high') {
    return `You win ${profile.closeMatchWinPercent}% of close, three-game matches`
  }

  const upset = profile.axes.find((a) => a.key === 'U')
  if (profile.underdogWinPercent != null && upset?.pole === 'high') {
    return `You win ${profile.underdogWinPercent}% of matches as the underdog`
  }

  if (profile.streaks.longestWinStreak >= 5) {
    return `Your longest winning streak is ${profile.streaks.longestWinStreak} matches`
  }

  const reliable = profile.axes.find((a) => a.key === 'S')
  if (profile.favouriteWinPercent != null && reliable?.pole === 'high') {
    if (
      profile.underdogWinPercent != null &&
      profile.underdogWinPercent <= STABLE_MAX_UNDERDOG_WIN_PERCENT
    ) {
      return `You win ${profile.favouriteWinPercent}% as favourite and rarely flip the script as underdog`
    }
    return `You win ${profile.favouriteWinPercent}% of matches when you're the favourite`
  }

  const finisher = profile.axes.find((a) => a.key === 'F')
  if (finisher?.pole === 'high' && profile.gameWinRates.game3.winPercent != null) {
    return `You win ${profile.gameWinRates.game3.winPercent}% of third games`
  }

  return null
}

export function computePlayerProfile(matches: NormalizedMatch[]): PlayerProfile {
  const competitive = competitiveMatches(matches)
  const rated = competitive.filter(isRatedMatch)
  const gameWinRates = computeGameWinRates(matches)
  const streaks = computeStreakStats(matches)

  const finisher = scoreFinisherAxis(gameWinRates)
  const upset = scoreUpsetAxis(matches)
  const clutch = scoreClutchAxis(matches)
  const reliable = scoreReliableAxis(matches, upset.underdogWinPercent)

  const axes: AxisScore[] = [
    {
      key: 'F',
      highLabel: 'Finisher',
      lowLabel: 'Grinder',
      ...finisher,
    },
    {
      key: 'U',
      highLabel: 'Crusher',
      lowLabel: 'Challenger',
      ...upset.axis,
    },
    {
      key: 'C',
      highLabel: 'Clutch',
      lowLabel: 'Composed',
      ...clutch.axis,
    },
    {
      key: 'S',
      highLabel: 'Reliable',
      lowLabel: 'Wildcard',
      ...reliable.axis,
    },
  ]

  const sufficientData =
    competitive.length >= MIN_COMPETITIVE_MATCHES &&
    rated.length >= MIN_RATED_MATCHES

  const base = {
    competitiveMatchCount: competitive.length,
    ratedMatchCount: rated.length,
    axes,
    gameWinRates,
    streaks,
    underdogWinPercent: upset.underdogWinPercent,
    favouriteWinPercent: reliable.favouriteWinPercent,
    closeMatchWinPercent: clutch.closeMatchWinPercent,
  }

  const celebrationStat = pickCelebrationStat(base)

  return {
    sufficientData,
    code: sufficientData ? buildPlayerCode(axes) : null,
    celebrationStat,
    ...base,
  }
}

export function compareProfiles(
  allTime: PlayerProfile,
  recent: PlayerProfile,
  getArchetypeName: (code: PlayerCode) => string,
): ProfileComparison {
  if (!allTime.sufficientData || !recent.sufficientData) {
    return {
      shifted: false,
      shiftedAxes: [],
      allTimeName: null,
      recentName: null,
      message: null,
    }
  }

  if (allTime.code === recent.code) {
    return {
      shifted: false,
      shiftedAxes: [],
      allTimeName: getArchetypeName(allTime.code!),
      recentName: getArchetypeName(recent.code!),
      message: null,
    }
  }

  const shiftedAxes = allTime.axes
    .filter((axis, i) => axis.pole !== recent.axes[i]?.pole)
    .map((a) => a.key)

  return {
    shifted: shiftedAxes.length > 0,
    shiftedAxes,
    allTimeName: getArchetypeName(allTime.code!),
    recentName: getArchetypeName(recent.code!),
    message: `All-time you're ${getArchetypeName(allTime.code!)} — in the last 24 months you're reading more like ${getArchetypeName(recent.code!)}.`,
  }
}

/** Exported for tests — composed-style win detection. */
export function isComposedDominantWin(match: NormalizedMatch): boolean {
  return isComposedStyleWin(match)
}

/** Exported for tests — game won helper. */
export function gameWasWon(game: MatchGameScore): boolean {
  return isGameWon(game)
}
