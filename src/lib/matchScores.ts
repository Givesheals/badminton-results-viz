import type { NormalizedMatch } from '../types/matchHistory'

export function parseScore(value: string | number | boolean | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) ? n : null
}

export type MatchGameScore = {
  game: number
  player: number
  opponent: number
  margin: number
}

export type MatchVolume = {
  gamesPlayed: number
  playerPoints: number
  opponentPoints: number
}

/** Player won this individual game (not the whole match). */
export function isGameWon(game: MatchGameScore): boolean {
  return game.player > game.opponent
}

/** Three-game match where every game was decided by at most `maxMargin` points. */
export function isTightThreeGameMatch(
  match: NormalizedMatch,
  maxMargin = 3,
): boolean {
  const games = getMatchGames(match)
  if (games.length !== 3) return false
  return games.every((g) => g.margin <= maxMargin)
}

/** Match went to a deciding third game after splitting the first two. */
export function isDecidingThirdGameMatch(match: NormalizedMatch): boolean {
  const games = getMatchGames(match)
  if (games.length !== 3) return false
  const g1 = isGameWon(games[0]!)
  const g2 = isGameWon(games[1]!)
  return g1 !== g2
}

/** Close match: tight three-gamer or a 1–1 split going to game three. */
export function isCloseMatch(match: NormalizedMatch): boolean {
  return isTightThreeGameMatch(match) || isDecidingThirdGameMatch(match)
}

/** At least one game has both player and opponent numeric scores. */
export function hasPlayedGameScores(match: NormalizedMatch): boolean {
  return getMatchGames(match).length > 0
}

export function getMatchGames(match: NormalizedMatch): MatchGameScore[] {
  const games: MatchGameScore[] = []
  for (let game = 1; game <= 3; game += 1) {
    const player = parseScore(match.raw[`Player Game ${game} Score`])
    const opponent = parseScore(match.raw[`Opponent Game ${game} Score`])
    if (player == null || opponent == null) continue
    games.push({
      game,
      player,
      opponent,
      margin: Math.abs(player - opponent),
    })
  }
  return games
}

export function getMatchVolume(match: NormalizedMatch): MatchVolume {
  let gamesPlayed = 0
  let playerPoints = 0
  let opponentPoints = 0

  for (let game = 1; game <= 3; game += 1) {
    const player = parseScore(match.raw[`Player Game ${game} Score`])
    const opponent = parseScore(match.raw[`Opponent Game ${game} Score`])
    if (player == null || opponent == null) continue

    gamesPlayed += 1
    playerPoints += player
    opponentPoints += opponent
  }

  return { gamesPlayed, playerPoints, opponentPoints }
}

export function sumMatchVolumes(matches: NormalizedMatch[]): MatchVolume {
  return matches.reduce(
    (totals, match) => {
      const volume = getMatchVolume(match)
      return {
        gamesPlayed: totals.gamesPlayed + volume.gamesPlayed,
        playerPoints: totals.playerPoints + volume.playerPoints,
        opponentPoints: totals.opponentPoints + volume.opponentPoints,
      }
    },
    { gamesPlayed: 0, playerPoints: 0, opponentPoints: 0 },
  )
}
