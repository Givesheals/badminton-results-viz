import { DISCIPLINE_LABELS } from '../types/matchHistory'
import type { TeamMember } from './matchTeams'
import {
  SENIOR_COUNTY_DEBUT_DETAIL,
  SENIOR_COUNTY_DEBUT_TITLE,
  type ProgressionStage,
} from './tournamentProgression'
import type {
  DisciplineMatchHighlight,
  DisciplineMatchRecap,
  DisciplineRecap,
  FreakFlagMatchDetail,
  PartnerChemistryHighlight,
  RecapSummaryCard,
  TournamentRecap,
} from './tournamentRecap'

/** 0-based slot in the recap carousel (the fifth tournament shown). */
export const FICTIONAL_TOURNAMENT_RECAP_INDEX = 4

export const FICTIONAL_TOURNAMENT_RECAP_KEY = 'fictional-feature-showcase'

export const FICTIONAL_TOURNAMENT_NAME = 'Feature Showcase Open'

/** 0-based slot for the condensed-card twin (the sixth tournament shown). */
export const FICTIONAL_CONDENSED_TOURNAMENT_RECAP_INDEX = 5

export const FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY =
  'fictional-condensed-cards-showcase'

export const FICTIONAL_CONDENSED_TOURNAMENT_NAME =
  'Condensed Cards Feature Showcase Open'

export function fictionalCelebrationPresentation(
  recapKey: string,
): 'expanded' | 'compact' | null {
  if (recapKey === FICTIONAL_TOURNAMENT_RECAP_KEY) return 'expanded'
  if (recapKey === FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY) return 'compact'
  return null
}

const CATEGORY = 'Gold'
const AGE = 'Senior'
const DATE_SAT = '2026-08-15'
const DATE_SUN = '2026-08-16'

const DISCIPLINES = ['MD', 'WD', 'XD'] as const

const PARTNERS: Record<(typeof DISCIPLINES)[number], string> = {
  MD: 'Jordan Hale',
  WD: 'Riley Chen',
  XD: 'Avery Shah',
}

const STAGES: Record<(typeof DISCIPLINES)[number], ProgressionStage> = {
  MD: 'winner',
  WD: 'runner-up',
  XD: 'semi-final',
}

const STAGE_LABELS: Record<(typeof DISCIPLINES)[number], string> = {
  MD: 'Winner',
  WD: 'Runner-up',
  XD: 'Semi-final',
}

function opponentsLine(members: TeamMember[]): string {
  return members.map((member) => member.name).join(' & ')
}

function chemistryCallout(partnerName: string): RecapSummaryCard {
  return {
    id: `partner-chemistry-${partnerName}`,
    icon: '🤝',
    label: `Your chemistry with ${partnerName} increased`,
    detail: '+18% at this event · overall +9%',
    sectionId: 'partner-chemistry',
  }
}

function greatRunCallout(disciplineLabel: string, stageLabel: string): RecapSummaryCard {
  return {
    id: 'great-run',
    icon: '🏃',
    label: 'Great run',
    detail: `Reached ${stageLabel} — further than you typically get in ${disciplineLabel} at ${CATEGORY}`,
  }
}

function strongestBeaten(disciplineLabel: string): DisciplineMatchHighlight {
  return {
    id: 'your-strongest-beaten',
    label: 'Your strongest beaten',
    chipIcon: '💪',
    popoverText: `Your highest-rated opponent beaten in ${disciplineLabel} at this event. Their team was rated 1840. Among all your rated wins, that's your 2nd strongest beaten victory.`,
  }
}

function bigUpset(matchKey: string): DisciplineMatchHighlight {
  return {
    id: `big-upset-${matchKey}`,
    label: 'Big upset!',
    chipIcon: '😮',
    popoverText:
      'You won this match even though your opponent was rated 85 points higher on average beforehand — about a 22% chance of winning going in.',
  }
}

function matchRow(args: {
  competitionName: string
  discipline: (typeof DISCIPLINES)[number]
  date: string
  opponents: TeamMember[]
  outcome: 'win' | 'loss'
  scoreSummary: string
  roundLabel: string
  highlights?: DisciplineMatchHighlight[]
}): DisciplineMatchRecap {
  const partnerName = PARTNERS[args.discipline]
  const disciplineLabel = DISCIPLINE_LABELS[args.discipline] ?? args.discipline
  const opponents = opponentsLine(args.opponents)
  const matchKey = `${args.competitionName}\0${args.date}\0${args.discipline}\0${opponents}`

  return {
    matchKey,
    date: args.date,
    opponents,
    opponentMembers: args.opponents,
    partnerName,
    showPartnerName: false,
    showDate: true,
    outcome: args.outcome,
    scoreSummary: args.scoreSummary,
    roundLabel: args.roundLabel,
    highlights: args.highlights ?? [],
    noteContext: {
      matchKey,
      competitionName: args.competitionName,
      tournamentCategoryLabel: CATEGORY,
      date: args.date,
      discipline: args.discipline,
      disciplineLabel,
      partnerName,
      opponentNames: args.opponents.map((member) => member.name),
      opponentsDisplay: opponents,
      roundLabel: args.roundLabel,
      outcome: args.outcome,
      scoreSummary: args.scoreSummary,
    },
  }
}

function freakMatch(
  match: DisciplineMatchRecap,
  games?: FreakFlagMatchDetail['games'],
): FreakFlagMatchDetail {
  return {
    discipline: match.noteContext.discipline,
    partnerName: match.partnerName,
    roundLabel: match.roundLabel,
    opponents: match.opponents,
    scoreSummary: match.scoreSummary,
    games,
  }
}

function podium(discipline: (typeof DISCIPLINES)[number], kind: 'winner' | 'runner-up' | 'joint-third') {
  return {
    kind,
    discipline,
    disciplineLabel: DISCIPLINE_LABELS[discipline] ?? discipline,
    tournamentCategoryLabel: CATEGORY,
    competitionAgeLabel: AGE,
  }
}

function milestone(
  discipline: (typeof DISCIPLINES)[number],
  variant: 'personal_best' | 'matched_best' | 'debut',
  stage: ProgressionStage,
  title: string,
  detail: string,
) {
  return {
    id: `${variant}-${discipline}`,
    variant,
    discipline,
    disciplineLabel: DISCIPLINE_LABELS[discipline] ?? discipline,
    tournamentCategoryLabel: CATEGORY,
    competitionAgeLabel: AGE,
    stage,
    stageLabel: STAGE_LABELS[discipline],
    title,
    detail,
  }
}

function disciplineRecap(
  discipline: (typeof DISCIPLINES)[number],
  rating: { start: number; end: number },
  matches: DisciplineMatchRecap[],
): DisciplineRecap {
  const disciplineLabel = DISCIPLINE_LABELS[discipline] ?? discipline
  const wins = matches.filter((match) => match.outcome === 'win').length
  const losses = matches.filter((match) => match.outcome === 'loss').length
  const partnerName = PARTNERS[discipline]

  return {
    discipline,
    disciplineLabel,
    partnerName,
    ratingStart: rating.start,
    ratingEnd: rating.end,
    ratingDelta: rating.end - rating.start,
    ratingVsTypical: 'above',
    bestStage: STAGES[discipline],
    bestStageLabel: STAGE_LABELS[discipline],
    progressionVsTypical: 'above',
    matchWins: wins,
    matchLosses: losses,
    eventCallouts: [greatRunCallout(disciplineLabel, STAGE_LABELS[discipline]), chemistryCallout(partnerName)],
    matches,
  }
}

function chemistryHighlight(
  discipline: (typeof DISCIPLINES)[number],
): PartnerChemistryHighlight {
  const partnerName = PARTNERS[discipline]
  return {
    partnerName,
    discipline,
    priorOverperformance: 4,
    weekendOverperformance: 18,
    overallOverperformance: 9,
    detail: `Chemistry at this event: +18% vs rating expectation. Your overall chemistry with ${partnerName} improved from +4% to +9%.`,
  }
}

/**
 * Kitchen-sink recap used as a carousel card so every top-layer recap
 * surface can be reviewed in one place. Mutually exclusive variants of the
 * same slot (podium subtitles, 100% win treatment, emoji-insight duplicates
 * of the callout cards) are omitted.
 */
export function buildFictionalTournamentRecap(
  identity: { key: string; competitionName: string } = {
    key: FICTIONAL_TOURNAMENT_RECAP_KEY,
    competitionName: FICTIONAL_TOURNAMENT_NAME,
  },
): TournamentRecap {
  const { key, competitionName } = identity
  const row = (
    args: Omit<Parameters<typeof matchRow>[0], 'competitionName'>,
  ) => matchRow({ ...args, competitionName })

  const mdGroup = row({
    discipline: 'MD',
    date: DATE_SAT,
    opponents: [
      { name: 'Chris Vale', rating: 920 },
      { name: 'Drew Kim', rating: 920 },
    ],
    outcome: 'win',
    scoreSummary: '21-19, 19-21, 21-19',
    roundLabel: 'Group',
    highlights: [strongestBeaten(DISCIPLINE_LABELS.MD)],
  })
  const mdQuarter = row({
    discipline: 'MD',
    date: DATE_SAT,
    opponents: [
      { name: 'Morgan Blake', rating: 975 },
      { name: 'Quinn Adey', rating: 968 },
    ],
    outcome: 'win',
    scoreSummary: '8-21, 21-15, 21-19',
    roundLabel: 'Quarter-final',
    highlights: [bigUpset(`${competitionName}\0${DATE_SAT}\0MD\0Morgan Blake & Quinn Adey`)],
  })
  const mdFinal = row({
    discipline: 'MD',
    date: DATE_SUN,
    opponents: [
      { name: 'Sam Ortega', rating: 890 },
      { name: 'Nico Patel', rating: 884 },
    ],
    outcome: 'loss',
    scoreSummary: '21-19, 18-21, 19-21',
    roundLabel: 'Final',
  })

  const wdGroup = row({
    discipline: 'WD',
    date: DATE_SAT,
    opponents: [
      { name: 'Eden Cole', rating: 810 },
      { name: 'Harper Ng', rating: 804 },
    ],
    outcome: 'win',
    scoreSummary: '21-18, 19-21, 21-16',
    roundLabel: 'Group',
    highlights: [strongestBeaten(DISCIPLINE_LABELS.WD)],
  })
  const wdSemi = row({
    discipline: 'WD',
    date: DATE_SUN,
    opponents: [
      { name: 'Blair Okafor', rating: 902 },
      { name: 'Shay Lindt', rating: 911 },
    ],
    outcome: 'win',
    scoreSummary: '21-23, 21-19, 21-18',
    roundLabel: 'Semi-final',
    highlights: [bigUpset(`${competitionName}\0${DATE_SUN}\0WD\0Blair Okafor & Shay Lindt`)],
  })
  const wdFinal = row({
    discipline: 'WD',
    date: DATE_SUN,
    opponents: [
      { name: 'Tessa Ward', rating: 860 },
      { name: 'June Park', rating: 855 },
    ],
    outcome: 'loss',
    scoreSummary: '19-21, 21-17, 18-21',
    roundLabel: 'Final',
  })

  const xdGroup = row({
    discipline: 'XD',
    date: DATE_SAT,
    opponents: [
      { name: 'Robin West', rating: 870 },
      { name: 'Casey Moon', rating: 862 },
    ],
    outcome: 'win',
    scoreSummary: '21-17, 18-21, 21-19',
    roundLabel: 'Group',
    highlights: [strongestBeaten(DISCIPLINE_LABELS.XD)],
  })
  const xdQuarter = row({
    discipline: 'XD',
    date: DATE_SAT,
    opponents: [
      { name: 'Alex Rivera', rating: 940 },
      { name: 'Sasha Bell', rating: 933 },
    ],
    outcome: 'win',
    scoreSummary: '21-19, 16-21, 21-18',
    roundLabel: 'Quarter-final',
    highlights: [bigUpset(`${competitionName}\0${DATE_SAT}\0XD\0Alex Rivera & Sasha Bell`)],
  })
  const xdSemi = row({
    discipline: 'XD',
    date: DATE_SUN,
    opponents: [
      { name: 'Jamie Frost', rating: 888 },
      { name: 'Noor Ali', rating: 881 },
    ],
    outcome: 'loss',
    scoreSummary: '21-19, 19-21, 18-21',
    roundLabel: 'Semi-final',
  })

  const disciplines = [
    disciplineRecap('MD', { start: 612, end: 628 }, [mdGroup, mdQuarter, mdFinal]),
    disciplineRecap('WD', { start: 598, end: 610 }, [wdGroup, wdSemi, wdFinal]),
    disciplineRecap('XD', { start: 604, end: 615 }, [xdGroup, xdQuarter, xdSemi]),
  ]

  return {
    key,
    competitionName,
    dateFrom: DATE_SAT,
    dateTo: DATE_SUN,
    tournamentCategoryLabel: CATEGORY,
    disciplines,
    eventSummaries: [
      {
        id: 'great-form',
        icon: '💪',
        label: 'Great form',
        detail: '67% match wins at this event vs 48% overall',
      },
      {
        id: 'tough-luck',
        icon: '🌧️',
        label: 'Tough luck',
        detail:
          'Competing when it hurts is how you improve. Keep training and come back stronger.',
      },
      {
        id: 'busy-weekend',
        icon: '🥵',
        label: "You've been busy!",
        detail: '9 competitive matches at this event. That\'s a lot!',
      },
    ],
    celebrations: {
      winners: [podium('MD', 'winner')],
      runnerUps: [podium('WD', 'runner-up')],
      jointThirds: [podium('XD', 'joint-third')],
      milestones: [
        milestone(
          'MD',
          'personal_best',
          'winner',
          'Personal best',
          `Your deepest ${CATEGORY} ${DISCIPLINE_LABELS.MD} run — Winner`,
        ),
        milestone(
          'WD',
          'matched_best',
          'runner-up',
          'Matched your best',
          `As deep as you've gone at ${CATEGORY} ${DISCIPLINE_LABELS.WD} before — Runner-up`,
        ),
        milestone(
          'XD',
          'debut',
          'semi-final',
          `First ${CATEGORY} tournament`,
          `Your first ${CATEGORY} tournament in mixed doubles`,
        ),
      ],
      seniorCountyDebut: {
        title: SENIOR_COUNTY_DEBUT_TITLE,
        detail: SENIOR_COUNTY_DEBUT_DETAIL,
        disciplines: DISCIPLINES.map((discipline) => ({
          discipline,
          disciplineLabel: DISCIPLINE_LABELS[discipline] ?? discipline,
        })),
      },
    },
    emojiInsights: [],
    otherEventInsights: [],
    recordMilestones: [
      {
        id: 'best_win_strength-fictional',
        kind: 'best_win_strength',
        title: 'New strongest beaten! (2nd all time)',
        detail: 'Beat Chris Vale & Drew Kim',
        discipline: 'MD',
        sectionId: 'best-wins',
      },
      {
        id: 'best_win_upset-fictional',
        kind: 'best_win_upset',
        title: 'New biggest upset! (3rd all time)',
        detail: 'Beat Morgan Blake & Quinn Adey',
        discipline: 'MD',
        sectionId: 'best-wins',
      },
      {
        id: 'nemesis_top5-fictional',
        kind: 'nemesis_top5',
        title: 'New nemesis in your top 5 (4th)',
        detail: 'Sam Ortega joined your nemesis list.',
        discipline: 'MD',
        sectionId: 'opponent-matchups',
      },
      {
        id: 'scalp_top5-fictional',
        kind: 'scalp_top5',
        title: 'New favourite opponent in your top 5 (5th)',
        detail: 'Eden Cole joined your favourite opponents list.',
        discipline: 'WD',
        sectionId: 'opponent-matchups',
      },
    ],
    freakFlags: [
      {
        id: 'nailbiter-MD-fictional',
        kind: 'nailbiter',
        label: 'Nailbiter!',
        summary:
          'This match went the full three ends — and every end was decided by two points or fewer.',
        match: freakMatch(mdGroup, [
          { player: 21, opponent: 19 },
          { player: 19, opponent: 21 },
          { player: 21, opponent: 19 },
        ]),
      },
      {
        id: 'single-digit-MD-fictional',
        kind: 'single_digit_scare',
        label: 'Single-digit scare',
        summary:
          'You lost an end into single figures — then still came back to win the match.',
        match: freakMatch(mdQuarter, [
          { player: 8, opponent: 21, highlight: 'lost_single_digit' },
          { player: 21, opponent: 15 },
          { player: 21, opponent: 19 },
        ]),
      },
      {
        id: 'money-worth-fictional',
        kind: 'money_worth',
        label: "Getting your money's worth!",
        summary: 'All of your games went to three ends.',
        matches: [mdGroup, wdSemi, xdSemi].map((match) => freakMatch(match)),
      },
      {
        id: 'shoulda-final-MD-fictional',
        kind: 'shoulda_been_final',
        label: 'Shoulda been the final',
        summary:
          'You lost to the eventual winners — and gave them the toughest match of their run.',
        match: freakMatch(mdFinal),
      },
      {
        id: 'lost-winner-WD-fictional',
        kind: 'lost_to_winner',
        label: 'Lost to the winner',
        summary: 'You lost to the eventual champions of this discipline.',
        match: freakMatch(wdFinal),
      },
    ],
    bestWin: null,
    partnerChemistryHighlights: DISCIPLINES.map(chemistryHighlight),
    totalMatches: 9,
    weekendWinPercent: 66.7,
  }
}

export function buildCondensedFictionalTournamentRecap(): TournamentRecap {
  return buildFictionalTournamentRecap({
    key: FICTIONAL_CONDENSED_TOURNAMENT_RECAP_KEY,
    competitionName: FICTIONAL_CONDENSED_TOURNAMENT_NAME,
  })
}

function insertRecapAt(
  recaps: TournamentRecap[],
  index: number,
  recap: TournamentRecap,
): TournamentRecap[] {
  if (recaps.some((existing) => existing.key === recap.key)) return recaps
  const next = [...recaps]
  next.splice(Math.min(index, next.length), 0, recap)
  return next
}

/** Insert expanded then condensed kitchen-sink recaps as the fifth and sixth cards. */
export function insertFictionalTournamentRecap(recaps: TournamentRecap[]): TournamentRecap[] {
  const withExpanded = insertRecapAt(
    recaps,
    FICTIONAL_TOURNAMENT_RECAP_INDEX,
    buildFictionalTournamentRecap(),
  )
  return insertRecapAt(
    withExpanded,
    FICTIONAL_CONDENSED_TOURNAMENT_RECAP_INDEX,
    buildCondensedFictionalTournamentRecap(),
  )
}
