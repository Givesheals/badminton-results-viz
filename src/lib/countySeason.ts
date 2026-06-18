import { buildBestWinRow } from './bestWins'
import { isCompetitiveMatch } from './matchExclusions'
import type { NormalizedMatch } from '../types/matchHistory'
import {
  isCountyTournament,
  isSeniorCountyMatch,
} from './tournamentProgression'

export type CountyProgramKind = 'shires' | 'senior-county'

export type CountySeasonPartner = {
  name: string
  matchCount: number
}

export type CountySeasonHighlight = {
  kind: 'upset' | 'big-win'
  headline: string
  detail: string
  date: string
}

export type CountyProgramSeason = {
  program: CountyProgramKind
  programLabel: string
  countyName: string
  countyShortName: string
  primaryTeam: string
  wins: number
  losses: number
  fixtures: number
  leagueSummary: string
  partners: CountySeasonPartner[]
  highlights: CountySeasonHighlight[]
}

export type CountySeasonData = {
  programs: CountyProgramSeason[]
  disclaimer: string
}

const COUNTY_OPTIONS = [
  { name: 'Cambridgeshire', short: 'Cambs' },
  { name: 'Oxfordshire', short: 'Oxon' },
  { name: 'Surrey', short: 'Surrey' },
  { name: 'Hertfordshire', short: 'Herts' },
  { name: 'Essex', short: 'Essex' },
  { name: 'Kent', short: 'Kent' },
  { name: 'Berkshire', short: 'Berks' },
  { name: 'Norfolk', short: 'Norfolk' },
] as const

const COUNTY_NAME_PATTERNS: { pattern: RegExp; name: string; short: string }[] = [
  { pattern: /\bcambs?\b|\bcambridgeshire\b/i, name: 'Cambridgeshire', short: 'Cambs' },
  { pattern: /\boxon\b|\boxfordshire\b/i, name: 'Oxfordshire', short: 'Oxon' },
  { pattern: /\bsurrey\b/i, name: 'Surrey', short: 'Surrey' },
  { pattern: /\bherts?\b|\bhertfordshire\b/i, name: 'Hertfordshire', short: 'Herts' },
  { pattern: /\bessex\b/i, name: 'Essex', short: 'Essex' },
  { pattern: /\bkent\b/i, name: 'Kent', short: 'Kent' },
  { pattern: /\bberks?\b|\bberkshire\b/i, name: 'Berkshire', short: 'Berks' },
  { pattern: /\bnorfolk\b/i, name: 'Norfolk', short: 'Norfolk' },
]

const PROGRAM_LABELS: Record<CountyProgramKind, string> = {
  shires: 'Shires league',
  'senior-county': 'Senior county',
}

export const COUNTY_SEASON_DISCLAIMER =
  'County team names and league-table details are illustrative — your match sheet does not include team or standings data, so those parts are generated for context.'

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

function ordinal(position: number): string {
  const mod100 = position % 100
  if (mod100 >= 11 && mod100 <= 13) return `${position}th`
  switch (position % 10) {
    case 1:
      return `${position}st`
    case 2:
      return `${position}nd`
    case 3:
      return `${position}rd`
    default:
      return `${position}th`
  }
}

function inferCountyFromNames(competitionNames: string[]): { name: string; short: string } | null {
  for (const competitionName of competitionNames) {
    for (const entry of COUNTY_NAME_PATTERNS) {
      if (entry.pattern.test(competitionName)) {
        return { name: entry.name, short: entry.short }
      }
    }
  }
  return null
}

function mockCounty(seed: string): { name: string; short: string } {
  return COUNTY_OPTIONS[hashString(seed) % COUNTY_OPTIONS.length]!
}

function mockTeamLabel(
  countyShort: string,
  competitionName: string,
  date: string,
  seed: string,
): string {
  const teamNumber = (hashString(`${seed}:${competitionName}:${date}`) % 3) + 1
  return `${countyShort} ${teamNumber}`
}

function mockLeagueSummary(wins: number, losses: number, seed: string): string {
  const decided = wins + losses
  if (decided === 0) return 'League campaign getting started'

  const winRate = wins / decided
  const position =
    winRate >= 0.72 ? 1 : winRate >= 0.58 ? 2 : winRate >= 0.48 ? 3 : 4
  const divisions = ['Premier Division', 'Division 1', 'Division 1'] as const
  const division = divisions[hashString(seed) % divisions.length]!

  if (position <= 2) {
    return `${ordinal(position)} of 8 in ${division} — a strong team season`
  }
  return `${ordinal(position)} of 8 in ${division} — competitive and climbing`
}

export function classifyCountyProgram(match: NormalizedMatch): CountyProgramKind | null {
  if (!isCountyTournament(match) || !isCompetitiveMatch(match)) return null

  const name = match.competitionName.toLowerCase()
  if (/club champ/i.test(name)) return null

  if (
    /shire|shires|county league|spring league|autumn league|winter league|summer league/.test(
      name,
    )
  ) {
    return 'shires'
  }

  if (isSeniorCountyMatch(match)) return 'senior-county'
  if (/county champ|inter-count|county championship|senior county/.test(name)) {
    return 'senior-county'
  }

  return null
}

function fixtureKey(match: NormalizedMatch): string {
  return `${match.competitionName}|${match.date}`
}

function partnerLabel(match: NormalizedMatch): string | null {
  const partner = match.partnerName?.trim()
  if (!partner) return null
  return partner
}

function buildHighlights(matches: NormalizedMatch[]): CountySeasonHighlight[] {
  const highlights: CountySeasonHighlight[] = []

  for (const match of matches) {
    if (match.outcome !== 'win') continue
    const row = buildBestWinRow(match)
    if (!row) continue

    if (row.ratingGap >= 35) {
      highlights.push({
        kind: 'upset',
        headline: `Upset win vs a ${row.opponentTeamRating}-rated pairing`,
        detail: `You and your partner were underdogs on paper (${row.preMatchWinChancePercent}% pre-match chance) and still came through in ${match.disciplineLabel}.`,
        date: match.date,
      })
      continue
    }

    if (row.opponentTeamRating >= 590) {
      highlights.push({
        kind: 'big-win',
        headline: `Quality win against ${row.opponentTeamRating}-rated opposition`,
        detail: `A confident ${match.disciplineLabel} result at ${match.competitionName}.`,
        date: match.date,
      })
    }
  }

  return highlights
    .sort((a, b) => {
      const kindRank = (kind: CountySeasonHighlight['kind']) => (kind === 'upset' ? 0 : 1)
      const byKind = kindRank(a.kind) - kindRank(b.kind)
      if (byKind !== 0) return byKind
      return b.date.localeCompare(a.date)
    })
    .slice(0, 3)
}

function buildProgramSeason(
  program: CountyProgramKind,
  matches: NormalizedMatch[],
  seed: string,
): CountyProgramSeason {
  const competitionNames = [...new Set(matches.map((match) => match.competitionName))]
  const county = inferCountyFromNames(competitionNames) ?? mockCounty(`${seed}:${program}`)
  const wins = matches.filter((match) => match.outcome === 'win').length
  const losses = matches.filter((match) => match.outcome === 'loss').length
  const fixtures = new Set(matches.map(fixtureKey)).size

  const teamCounts = new Map<string, number>()
  for (const match of matches) {
    const team = mockTeamLabel(county.short, match.competitionName, match.date, seed)
    teamCounts.set(team, (teamCounts.get(team) ?? 0) + 1)
  }

  const primaryTeam =
    [...teamCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
    `${county.short} 1`

  const partnerCounts = new Map<string, number>()
  for (const match of matches) {
    const partner = partnerLabel(match)
    if (!partner) continue
    partnerCounts.set(partner, (partnerCounts.get(partner) ?? 0) + 1)
  }

  const partners = [...partnerCounts.entries()]
    .map(([name, matchCount]) => ({ name, matchCount }))
    .sort((a, b) => b.matchCount - a.matchCount || a.name.localeCompare(b.name))

  return {
    program,
    programLabel: PROGRAM_LABELS[program],
    countyName: county.name,
    countyShortName: county.short,
    primaryTeam,
    wins,
    losses,
    fixtures,
    leagueSummary: mockLeagueSummary(wins, losses, `${seed}:${program}`),
    partners,
    highlights: buildHighlights(matches),
  }
}

export function computeCountySeason(
  seasonMatches: NormalizedMatch[],
  seed = 'county-season',
): CountySeasonData | null {
  const byProgram = new Map<CountyProgramKind, NormalizedMatch[]>()

  for (const match of seasonMatches) {
    const program = classifyCountyProgram(match)
    if (!program) continue
    const bucket = byProgram.get(program) ?? []
    bucket.push(match)
    byProgram.set(program, bucket)
  }

  const programOrder: CountyProgramKind[] = ['shires', 'senior-county']
  const programs = programOrder
    .filter((program) => (byProgram.get(program)?.length ?? 0) > 0)
    .map((program) => buildProgramSeason(program, byProgram.get(program)!, seed))

  if (programs.length === 0) return null

  return {
    programs,
    disclaimer: COUNTY_SEASON_DISCLAIMER,
  }
}
