import type {
  MilestoneCelebration,
  PodiumCelebration,
  RecapCelebrations,
  StageReachCelebration,
} from '../../../lib/tournamentRecap'
import { getDisciplineStyle } from '../../../lib/disciplineStyle'
import { DisciplineChip } from '../../discipline/DisciplineChip'
import { TournamentCategoryChip } from '../../tournament/TournamentCategoryChip'

type Props = {
  celebrations: RecapCelebrations
}

const CONFETTI_COLORS = [
  'bg-shuttle-400',
  'bg-brand-500',
  'bg-court-500',
  'bg-violet-400',
  'bg-teal-400',
  'bg-amber-400',
] as const

/** Corner and edge slots only — keeps the centre clear for trophy and titles. */
const CONFETTI_POSITIONS = {
  full: [
    { top: '5%', left: '4%' },
    { top: '8%', left: '11%' },
    { top: '6%', left: '90%' },
    { top: '10%', left: '94%' },
    { top: '18%', left: '2%' },
    { top: '22%', left: '96%' },
    { top: '78%', left: '3%' },
    { top: '82%', left: '95%' },
    { top: '90%', left: '7%' },
    { top: '92%', left: '18%' },
    { top: '88%', left: '84%' },
    { top: '94%', left: '93%' },
    { top: '12%', left: '82%' },
    { top: '14%', left: '6%' },
    { top: '70%', left: '8%' },
    { top: '74%', left: '88%' },
    { top: '8%', left: '72%' },
    { top: '86%', left: '72%' },
  ],
  light: [
    { top: '6%', left: '5%' },
    { top: '8%', left: '92%' },
    { top: '20%', left: '3%' },
    { top: '22%', left: '94%' },
    { top: '80%', left: '6%' },
    { top: '82%', left: '90%' },
    { top: '90%', left: '10%' },
    { top: '88%', left: '86%' },
  ],
  minimal: [
    { top: '8%', left: '6%' },
    { top: '10%', left: '91%' },
    { top: '86%', left: '8%' },
    { top: '88%', left: '89%' },
  ],
} as const

function Confetti({ density = 'full' }: { density?: 'full' | 'light' | 'minimal' }) {
  const positions = CONFETTI_POSITIONS[density]
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {positions.map((pos, i) => {
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length]
        const size = i % 3 === 0 ? 'h-2.5 w-2.5' : 'h-1.5 w-1.5'
        return (
          <span
            key={i}
            className={`absolute rotate-45 rounded-sm opacity-70 ${color} ${size}`}
            style={{ top: pos.top, left: pos.left }}
          />
        )
      })}
    </div>
  )
}

function podiumGridClass(count: number): string {
  return count === 1 ? 'grid gap-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'
}

function WinnerCard({ podium }: { podium: PodiumCelebration }) {
  const style = getDisciplineStyle(podium.discipline)

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border-2 border-shuttle-400/60 border-l-4 bg-gradient-to-br from-shuttle-400/30 via-brand-50 to-court-50 px-4 py-6 shadow-md ${style.borderClass}`}
    >
      <Confetti density="full" />
      <div className="relative z-10 mx-auto flex max-w-[85%] flex-col items-center text-center">
        <span className="text-5xl leading-none" aria-hidden>
          🏆
        </span>
        <p className="mt-2 text-3xl font-black tracking-tight text-brand-700 sm:text-4xl">
          Winner!
        </p>
        <p className="mt-1 text-sm font-medium text-ink-700">{podium.disciplineLabel}</p>
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <DisciplineChip code={podium.discipline} />
          <TournamentCategoryChip label={podium.tournamentCategoryLabel} />
        </div>
        {podium.subtitle && (
          <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {podium.subtitle}
          </p>
        )}
      </div>
    </article>
  )
}

function RunnerUpCard({ podium }: { podium: PodiumCelebration }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-slate-100 via-white to-brand-50/40 px-4 py-4 shadow-sm">
      <Confetti density="light" />
      <div className="relative z-10 mx-auto flex max-w-[85%] flex-col items-center text-center">
        <span className="text-3xl leading-none" aria-hidden>
          🥈
        </span>
        <p className="mt-1 text-xl font-bold tracking-tight text-ink-800 sm:text-2xl">
          Runner-up
        </p>
        <p className="mt-0.5 text-sm text-ink-600">{podium.disciplineLabel}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <DisciplineChip code={podium.discipline} />
          <TournamentCategoryChip label={podium.tournamentCategoryLabel} />
        </div>
        {podium.subtitle && (
          <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
        )}
      </div>
    </article>
  )
}

function ThirdPlaceCard({ podium }: { podium: PodiumCelebration }) {
  return (
    <article className="relative overflow-hidden rounded-xl border border-[color:var(--color-level-bronze)]/70 bg-gradient-to-br from-[color:var(--color-level-bronze)]/25 via-white to-brand-50/20 px-4 py-3.5 shadow-sm">
      <Confetti density="minimal" />
      <div className="relative z-10 mx-auto flex max-w-[85%] flex-col items-center text-center">
        <span className="text-2xl leading-none" aria-hidden>
          🥉
        </span>
        <p className="mt-1 text-lg font-bold tracking-tight text-ink-800 sm:text-xl">
          Third Place
        </p>
        <p className="mt-0.5 text-sm text-ink-600">{podium.disciplineLabel}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <DisciplineChip code={podium.discipline} />
          <TournamentCategoryChip label={podium.tournamentCategoryLabel} />
        </div>
        {podium.subtitle && (
          <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
        )}
      </div>
    </article>
  )
}

function stageReachHeadline(reach: StageReachCelebration): string {
  switch (reach.stage) {
    case 'quarter-final':
      return `First ${reach.tournamentCategoryLabel} ${reach.discipline} quarter-final`
    case 'knockout':
      return `${reach.discipline} FIRST KNOCKOUT`
    case 'group-wins':
      return `First ${reach.tournamentCategoryLabel} ${reach.discipline} group win`
  }
}

function stageReachPresentation(stage: StageReachCelebration['stage']): {
  icon: string
  articleClass: string
  confetti?: 'minimal'
} {
  switch (stage) {
    case 'quarter-final':
      return {
        icon: '🎯',
        articleClass:
          'relative overflow-hidden rounded-xl border border-court-200/80 bg-gradient-to-br from-court-50/80 via-white to-brand-50/30 px-4 py-3.5 shadow-sm',
        confetti: 'minimal',
      }
    case 'knockout':
      return {
        icon: '🚀',
        articleClass:
          'rounded-xl border border-brand-200/60 bg-gradient-to-br from-brand-50/50 via-white to-white px-4 py-3 shadow-sm',
      }
    case 'group-wins':
      return {
        icon: '✓',
        articleClass:
          'rounded-xl border border-ink-200/80 bg-gradient-to-br from-ink-50/60 via-white to-white px-4 py-3 shadow-sm',
      }
  }
}

function StageReachCard({ reach }: { reach: StageReachCelebration }) {
  const presentation = stageReachPresentation(reach.stage)

  return (
    <article className={presentation.articleClass}>
      {presentation.confetti && <Confetti density={presentation.confetti} />}
      <div
        className={`flex max-w-[85%] flex-col items-center text-center ${presentation.confetti ? 'relative z-10 mx-auto' : 'mx-auto'}`}
      >
        <span className="text-xl leading-none" aria-hidden>
          {presentation.icon}
        </span>
        <p className="mt-1 text-base font-bold tracking-tight text-ink-800 sm:text-lg">
          {stageReachHeadline(reach)}
        </p>
        <p className="mt-0.5 text-sm text-ink-600">{reach.disciplineLabel}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <DisciplineChip code={reach.discipline} />
          <TournamentCategoryChip label={reach.tournamentCategoryLabel} />
        </div>
      </div>
    </article>
  )
}

function PersonalBestCard({ milestone }: { milestone: MilestoneCelebration }) {
  return (
    <article className="rounded-xl border border-brand-200/70 bg-gradient-to-br from-brand-50/60 via-white to-white px-4 py-3 shadow-sm">
      <div className="mx-auto flex max-w-[85%] flex-col items-center text-center">
        <span className="text-xl leading-none" aria-hidden>
          ✨
        </span>
        <p className="mt-1 text-base font-bold tracking-tight text-brand-800 sm:text-lg">
          {milestone.discipline} PERSONAL BEST
        </p>
        {milestone.detail && (
          <p className="mt-1 text-sm text-ink-600">{milestone.detail}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <DisciplineChip code={milestone.discipline} />
          <TournamentCategoryChip label={milestone.tournamentCategoryLabel} />
        </div>
      </div>
    </article>
  )
}

function milestoneStyle(variant: MilestoneCelebration['variant']): {
  border: string
  icon: string
} {
  switch (variant) {
    case 'matched_best':
      return { border: 'border-ink-200 bg-gradient-to-r from-ink-50 to-white', icon: '↔️' }
    case 'debut':
      return { border: 'border-court-200 bg-gradient-to-r from-court-50/80 to-white', icon: '🌟' }
    case 'personal_best':
    default:
      return { border: 'border-brand-200 bg-gradient-to-r from-brand-50 to-white', icon: '🏆' }
  }
}

function MilestoneCard({ milestone }: { milestone: MilestoneCelebration }) {
  const style = milestoneStyle(milestone.variant)

  return (
    <article className={`rounded-xl border px-4 py-3 ${style.border}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {style.icon}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink-900">{milestone.title}</p>
          {milestone.detail && (
            <p className="mt-0.5 text-sm text-ink-600">{milestone.detail}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <DisciplineChip code={milestone.discipline} />
            <TournamentCategoryChip label={milestone.tournamentCategoryLabel} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function RecapCelebrationHero({ celebrations }: Props) {
  const { winners, runnerUps, jointThirds, stageReaches, milestones } = celebrations
  const personalBests = milestones.filter((m) => m.variant === 'personal_best')
  const otherMilestones = milestones.filter((m) => m.variant !== 'personal_best')
  const hasContent =
    winners.length > 0 ||
    runnerUps.length > 0 ||
    jointThirds.length > 0 ||
    stageReaches.length > 0 ||
    milestones.length > 0

  if (!hasContent) return null

  return (
    <div className="space-y-4">
      {winners.length > 0 && (
        <div className={podiumGridClass(winners.length)}>
          {winners.map((podium) => (
            <WinnerCard key={podium.discipline} podium={podium} />
          ))}
        </div>
      )}

      {runnerUps.length > 0 && (
        <div className={podiumGridClass(runnerUps.length)}>
          {runnerUps.map((podium) => (
            <RunnerUpCard key={podium.discipline} podium={podium} />
          ))}
        </div>
      )}

      {jointThirds.length > 0 && (
        <div className={podiumGridClass(jointThirds.length)}>
          {jointThirds.map((podium) => (
            <ThirdPlaceCard key={podium.discipline} podium={podium} />
          ))}
        </div>
      )}

      {stageReaches.length > 0 && (
        <div className={podiumGridClass(stageReaches.length)}>
          {stageReaches.map((reach) => (
            <StageReachCard
              key={`${reach.tournamentCategoryLabel}-${reach.discipline}-${reach.stage}`}
              reach={reach}
            />
          ))}
        </div>
      )}

      {personalBests.length > 0 && (
        <div className={podiumGridClass(personalBests.length)}>
          {personalBests.map((milestone) => (
            <PersonalBestCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}

      {otherMilestones.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {otherMilestones.map((milestone) => (
            <MilestoneCard key={milestone.id} milestone={milestone} />
          ))}
        </div>
      )}
    </div>
  )
}
