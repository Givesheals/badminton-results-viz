import type { NormalizedMatch } from '../types/matchHistory'
import { isCompetitiveMatch } from './matchExclusions'
import { isCountyTournament, isSeniorCountyMatch } from './tournamentProgression'

/** Shires is green. Senior county and masters county share the blue County chip. */
export type CountyFixtureProgram = 'shires' | 'senior-county' | 'masters-county'

export type CountyFixtureSides = {
  program: CountyFixtureProgram
  home: string
  away: string
}

type CountyOption = {
  short: string
  pattern: RegExp
}

/**
 * Short names follow the badges on Badminfo (H'ants, N'ants, N'mld).
 * Match sheets do not include squads, so these labels are illustrative.
 */
const COUNTIES: CountyOption[] = [
  { short: 'Cambs', pattern: /\bcambs?\b|\bcambridgeshire\b/i },
  { short: "H'ants", pattern: /\bhants?\b|\bhampshire\b/i },
  { short: "N'ants", pattern: /\bnorthants?\b|\bnorthamptonshire\b/i },
  { short: "N'mld", pattern: /\bnorthumberland\b|\bn'mld\b/i },
  { short: 'Notts', pattern: /\bnotts?\b|\bnottinghamshire\b/i },
  { short: 'Leics', pattern: /\bleics?\b|\bleicestershire\b/i },
  { short: 'Lincs', pattern: /\blincs?\b|\blincolnshire\b/i },
  { short: 'Yorks', pattern: /\byorks?\b|\byorkshire\b/i },
  { short: 'IoM', pattern: /\biom\b|\bisle of man\b/i },
  { short: 'Herts', pattern: /\bherts?\b|\bhertfordshire\b/i },
  { short: 'Oxon', pattern: /\boxon\b|\boxfordshire\b/i },
  { short: 'Bucks', pattern: /\bbucks?\b|\bbuckinghamshire\b/i },
  { short: 'Berks', pattern: /\bberks?\b|\bberkshire\b/i },
  { short: 'Worcs', pattern: /\bworcs?\b|\bworcestershire\b/i },
  { short: 'Glos', pattern: /\bglos\b|\bgloucestershire\b/i },
  { short: 'Wilts', pattern: /\bwilts?\b|\bwiltshire\b/i },
  { short: 'Lancs', pattern: /\blancs?\b|\blancashire\b/i },
  { short: 'Essex', pattern: /\bessex\b/i },
  { short: 'Kent', pattern: /\bkent\b/i },
  { short: 'Surrey', pattern: /\bsurrey\b/i },
  { short: 'Norfolk', pattern: /\bnorfolk\b/i },
  { short: 'Suffolk', pattern: /\bsuffolk\b/i },
  { short: 'Sussex', pattern: /\bsussex\b/i },
  { short: 'Mids', pattern: /\bmidd?x\b|\bmiddlesex\b/i },
  { short: 'Warks', pattern: /\bwarks?\b|\bwarwickshire\b/i },
  { short: 'Derby', pattern: /\bderbys?\b|\bderbyshire\b/i },
  { short: 'Staffs', pattern: /\bstaffs?\b|\bstaffordshire\b/i },
  { short: 'Cheshire', pattern: /\bcheshire\b/i },
  { short: 'Devon', pattern: /\bdevon\b/i },
  { short: 'Cornwall', pattern: /\bcornwall\b/i },
  { short: 'Somerset', pattern: /\bsomerset\b/i },
  { short: 'Dorset', pattern: /\bdorset\b/i },
  { short: 'Cumbria', pattern: /\bcumbria\b/i },
  { short: 'Durham', pattern: /\bdurham\b/i },
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function countyInName(competitionName: string): string | null {
  for (const county of COUNTIES) {
    if (county.pattern.test(competitionName)) return county.short
  }
  return null
}

function looksLikeHomeEvent(competitionName: string): boolean {
  return /\brestricted\b|\bplayers\b/i.test(competitionName)
}

/**
 * County the player most likely represents.
 * Home events (restricted / players) win, then the county named on the most competitions.
 */
export function inferRepresentedCounty(matches: NormalizedMatch[]): string | null {
  const homeCounts = new Map<string, number>()
  const competitionCounts = new Map<string, number>()
  const seenCompetitions = new Set<string>()

  for (const match of matches) {
    const county = countyInName(match.competitionName)
    if (!county) continue
    if (looksLikeHomeEvent(match.competitionName)) {
      homeCounts.set(county, (homeCounts.get(county) ?? 0) + 1)
    }
    if (seenCompetitions.has(match.competitionName)) continue
    seenCompetitions.add(match.competitionName)
    competitionCounts.set(county, (competitionCounts.get(county) ?? 0) + 1)
  }

  const pick = (counts: Map<string, number>) =>
    [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    null

  return pick(homeCounts) ?? pick(competitionCounts)
}

export function classifyCountyFixture(match: NormalizedMatch): CountyFixtureProgram | null {
  if (!isCountyTournament(match) || !isCompetitiveMatch(match)) return null

  const name = match.competitionName.toLowerCase()
  if (/club champ/.test(name)) return null

  if (
    /shire|shires|county league|spring league|autumn league|winter league|summer league/.test(
      name,
    )
  ) {
    return 'shires'
  }

  if (match.competitionAgeGroup === 'Masters' || /masters county/.test(name)) {
    return 'masters-county'
  }

  if (
    isSeniorCountyMatch(match) ||
    /county champ|inter-count|county championship|senior county/.test(name)
  ) {
    return 'senior-county'
  }

  return null
}

function dominantProgram(matches: NormalizedMatch[]): CountyFixtureProgram | null {
  const counts = new Map<CountyFixtureProgram, number>()
  for (const match of matches) {
    const program = classifyCountyFixture(match)
    if (!program) continue
    counts.set(program, (counts.get(program) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
}

function squadLabel(short: string, program: CountyFixtureProgram, seed: string): string {
  if (program === 'shires') return short
  const squad = (hashString(seed) % 3) + 1
  return `${short} ${squad}`
}

export type AssignedCountyFixture = {
  tieIndex: number
  fixture: CountyFixtureSides
}

export type CountyFixturePlan = {
  program: CountyFixtureProgram | null
  /**
   * Set when every game belongs to one tie, so the card title can name it.
   * Several ties leave this empty and label each group of games instead.
   */
  headerFixture: CountyFixtureSides | null
  byMatch: Map<NormalizedMatch, AssignedCountyFixture>
}

/**
 * Team badges for a county day. Shires badges are the county only (Cambs).
 * Senior and masters county include the squad number (Cambs 1).
 * Names are illustrative: match sheets do not name the other county.
 *
 * A day splits into several ties only when every discipline's games divide
 * into rubbers of one or two. A single tie keeps today's one pair of badges.
 */
export function planCountyFixtures(
  matches: NormalizedMatch[],
  representedCounty: string | null,
): CountyFixturePlan {
  const empty: CountyFixturePlan = {
    program: null,
    headerFixture: null,
    byMatch: new Map(),
  }
  const program = dominantProgram(matches)
  if (!program || matches.length === 0) return empty

  const sample = matches[0]!
  const homeShort =
    representedCounty ??
    COUNTIES[hashString(sample.playerName || 'player') % COUNTIES.length]!.short
  const opponents = COUNTIES.filter((county) => county.short !== homeShort)
  const fixtureSeed = `${sample.competitionName}|${matches.map((match) => match.date).sort()[0]}`
  const tieCount = tieCountFor(matches)
  const fixtures = Array.from({ length: tieCount }, (_, index) =>
    fixtureForTie(program, homeShort, opponents, fixtureSeed, index),
  )

  const byDiscipline = new Map<string, NormalizedMatch[]>()
  for (const match of matches) {
    const list = byDiscipline.get(match.discipline) ?? []
    list.push(match)
    byDiscipline.set(match.discipline, list)
  }

  const byMatch = new Map<NormalizedMatch, AssignedCountyFixture>()
  for (const list of byDiscipline.values()) {
    // Earlier day first. Same-day order stays as it was recorded.
    list.sort((a, b) => a.date.localeCompare(b.date))
    const perTie = list.length / tieCount
    list.forEach((match, index) => {
      const tieIndex = tieCount === 1 ? 0 : Math.floor(index / perTie)
      byMatch.set(match, { tieIndex, fixture: fixtures[tieIndex]! })
    })
  }

  return {
    program,
    headerFixture: tieCount === 1 ? fixtures[0]! : null,
    byMatch,
  }
}

/**
 * How many ties this day is. One, unless each discipline splits into rubbers
 * of one or two games. Challenge events stay one group.
 */
function tieCountFor(matches: NormalizedMatch[]): number {
  const name = matches[0]?.competitionName ?? ''
  if (/challenge/i.test(name)) return 1

  const counts = new Map<string, number>()
  for (const match of matches) {
    counts.set(match.discipline, (counts.get(match.discipline) ?? 0) + 1)
  }
  const values = [...counts.values()]
  if (values.length === 0) return 1

  const suggested = Math.max(...values.map((count) => Math.ceil(count / 2)))
  if (suggested < 2) return 1

  const splitsEvenly = values.every((count) => {
    if (count % suggested !== 0) return false
    const perTie = count / suggested
    return perTie >= 1 && perTie <= 2
  })
  return splitsEvenly ? suggested : 1
}

function fixtureForTie(
  program: CountyFixtureProgram,
  homeShort: string,
  opponents: CountyOption[],
  fixtureSeed: string,
  index: number,
): CountyFixtureSides {
  const start = hashString(`${fixtureSeed}:away`) % opponents.length
  const awayShort = opponents[(start + index) % opponents.length]!.short
  const awaySeed = index === 0 ? `${fixtureSeed}:away` : `${fixtureSeed}:away:${index}`
  return {
    program,
    home: squadLabel(homeShort, program, `${fixtureSeed}:home`),
    away: squadLabel(awayShort, program, awaySeed),
  }
}
