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

/**
 * One tie for the weekend. Shires badges are the county only (Cambs).
 * Senior and masters county include the squad number (Cambs 1).
 */
export function countyFixtureForWeekend(
  matches: NormalizedMatch[],
  representedCounty: string | null,
): CountyFixtureSides | null {
  const program = dominantProgram(matches)
  if (!program || matches.length === 0) return null

  const sample = matches[0]!
  const homeShort =
    representedCounty ??
    COUNTIES[hashString(sample.playerName || 'player') % COUNTIES.length]!.short
  const opponents = COUNTIES.filter((county) => county.short !== homeShort)
  const fixtureSeed = `${sample.competitionName}|${matches.map((match) => match.date).sort()[0]}`
  const awayShort = opponents[hashString(`${fixtureSeed}:away`) % opponents.length]!.short

  return {
    program,
    home: squadLabel(homeShort, program, `${fixtureSeed}:home`),
    away: squadLabel(awayShort, program, `${fixtureSeed}:away`),
  }
}
