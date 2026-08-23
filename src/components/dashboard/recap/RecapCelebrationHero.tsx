import { CategoryMilestoneClaimLink } from './CategoryMilestoneClaimLink'
import type {
  CelebrationHeroKind,
  MilestoneCelebration,
  PodiumCelebration,
  RecapCelebrations,
  SeniorCountyDebutCelebration,
} from '../../../lib/tournamentRecap'
import { featuredCelebrationHeroKind } from '../../../lib/tournamentRecap'
import {
  fullTournamentRecapBuildFeatures,
  type TournamentRecapBuildFeatures,
} from '../../../lib/tournamentRecapBuildStage'
import type { ConfettiIntensity } from '../../../lib/confettiBurst'
import { getDisciplineStyle } from '../../../lib/disciplineStyle'
import { formatCategoryAgeLabel } from '../../../lib/tournamentProgression'
import { DisciplineChip } from '../../discipline/DisciplineChip'
import { CompetitionAgeChip } from '../../tournament/CompetitionAgeChip'
import { TournamentCategoryChip } from '../../tournament/TournamentCategoryChip'
import { FlipRevealCard } from '../../ui/FlipRevealCard'

type Props = {
  celebrations: RecapCelebrations
  features?: TournamentRecapBuildFeatures
  /** Skip the mystery flip (ticket screenshots / reduced-motion demos). */
  startRevealed?: boolean
  /**
   * Show every celebration as its full card (no featured/compact demotion).
   * Used by the fictional kitchen-sink recap.
   */
  expandAllCelebrations?: boolean
  /**
   * Show every celebration as its compact strip, except Winner (always large).
   * Used by the condensed-cards fictional recap.
   */
  compactAllCelebrations?: boolean
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

function podiumFlavorText(podium: PodiumCelebration): string {
  if (podium.subtitle) return podium.subtitle
  const level = formatCategoryAgeLabel(
    podium.tournamentCategoryLabel,
    podium.competitionAgeLabel,
  )
  if (podium.kind === 'winner') return `Your first ${level} title`
  if (podium.kind === 'runner-up') return `Your first ${level} runner-up finish`
  return `Your first ${level} third place`
}

function CelebrationIdentityChips({
  discipline,
  tournamentCategoryLabel,
  competitionAgeLabel,
  className = '',
}: {
  discipline: string
  tournamentCategoryLabel: string
  competitionAgeLabel: string | null
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <DisciplineChip code={discipline} />
      <CompetitionAgeChip label={competitionAgeLabel} />
      <TournamentCategoryChip label={tournamentCategoryLabel} />
    </div>
  )
}

function CompactCelebrationRow({
  icon,
  title,
  detail,
  discipline,
  tournamentCategoryLabel,
  competitionAgeLabel,
  articleClass,
  intensity,
  revealLabel,
  sealedHint,
  startRevealed,
}: {
  icon: string
  title: string
  detail?: string
  discipline?: string
  tournamentCategoryLabel: string
  competitionAgeLabel?: string | null
  articleClass: string
  intensity: ConfettiIntensity
  revealLabel: string
  sealedHint: string
  startRevealed?: boolean
}) {
  return (
    <FlipRevealCard
      size="compact"
      intensity={intensity}
      revealLabel={revealLabel}
      sealedHint={sealedHint}
      startRevealed={startRevealed}
    >
      <article className={`rounded-lg px-3 py-2.5 ${articleClass}`}>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
            {icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-ink-900">
                {title}
              </p>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {discipline && <DisciplineChip code={discipline} />}
                <CompetitionAgeChip label={competitionAgeLabel} />
                <TournamentCategoryChip label={tournamentCategoryLabel} />
              </div>
            </div>
            {detail && (
              <p className="mt-0.5 text-xs leading-snug text-ink-500">{detail}</p>
            )}
          </div>
        </div>
      </article>
    </FlipRevealCard>
  )
}

function WinnerCard({
  podium,
  startRevealed,
}: {
  podium: PodiumCelebration
  startRevealed?: boolean
}) {
  const style = getDisciplineStyle(podium.discipline)

  return (
    <FlipRevealCard
      intensity="spectacular"
      revealLabel={`Reveal: Winner in ${podium.disciplineLabel}`}
      sealedHint="A big result is sealed inside"
      startRevealed={startRevealed}
    >
      <article
        className={`relative overflow-hidden rounded-2xl border-2 border-shuttle-400/60 border-l-4 bg-gradient-to-br from-shuttle-400/30 via-brand-50 to-court-50 px-4 py-6 shadow-md ${style.borderClass}`}
      >
        <Confetti density="full" />
        <div className="relative z-[1] mx-auto flex max-w-[85%] flex-col items-center text-center">
          <span className="text-5xl leading-none" aria-hidden>
            🏆
          </span>
          <p className="mt-2 text-3xl font-black tracking-tight text-brand-700 sm:text-4xl">
            Winner!
          </p>
          <p className="mt-1 text-sm font-medium text-ink-700">{podium.disciplineLabel}</p>
          <CelebrationIdentityChips
            className="mt-3 justify-center"
            discipline={podium.discipline}
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
          />
          {podium.subtitle && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
              {podium.subtitle}
            </p>
          )}
          <CategoryMilestoneClaimLink
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
            stage="winner"
          />
        </div>
      </article>
    </FlipRevealCard>
  )
}

function RunnerUpCard({
  podium,
  compact,
  startRevealed,
}: {
  podium: PodiumCelebration
  compact?: boolean
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="🥈"
        title="Runner-up"
        detail={podiumFlavorText(podium)}
        discipline={podium.discipline}
        tournamentCategoryLabel={podium.tournamentCategoryLabel}
        competitionAgeLabel={podium.competitionAgeLabel}
        articleClass="border-2 border-level-silver/70 bg-gradient-to-r from-level-silver/25 to-white"
        intensity="light"
        revealLabel={`Reveal: Runner-up in ${podium.disciplineLabel}`}
        sealedHint="A podium finish is waiting"
        startRevealed={startRevealed}
      />
    )
  }

  return (
    <FlipRevealCard
      intensity="high"
      revealLabel={`Reveal: Runner-up in ${podium.disciplineLabel}`}
      sealedHint="A podium finish is waiting"
      startRevealed={startRevealed}
    >
      <article className="relative overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-slate-100 via-white to-brand-50/40 px-4 py-4 shadow-sm">
        <Confetti density="light" />
        <div className="relative z-[1] mx-auto flex max-w-[85%] flex-col items-center text-center">
          <span className="text-3xl leading-none" aria-hidden>
            🥈
          </span>
          <p className="mt-1 text-xl font-bold tracking-tight text-ink-800 sm:text-2xl">
            Runner-up
          </p>
          <p className="mt-0.5 text-sm text-ink-600">{podium.disciplineLabel}</p>
          <CelebrationIdentityChips
            className="mt-2 justify-center"
            discipline={podium.discipline}
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
          />
          {podium.subtitle && (
            <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
          )}
          <CategoryMilestoneClaimLink
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
            stage="runner-up"
          />
        </div>
      </article>
    </FlipRevealCard>
  )
}

function ThirdPlaceCard({
  podium,
  compact,
  startRevealed,
}: {
  podium: PodiumCelebration
  compact?: boolean
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="🥉"
        title="Third place"
        detail={podiumFlavorText(podium)}
        discipline={podium.discipline}
        tournamentCategoryLabel={podium.tournamentCategoryLabel}
        competitionAgeLabel={podium.competitionAgeLabel}
        articleClass="border border-[color:var(--color-level-bronze)]/50 bg-gradient-to-r from-[color:var(--color-level-bronze)]/15 to-white"
        intensity="minimal"
        revealLabel={`Reveal: Third place in ${podium.disciplineLabel}`}
        sealedHint="A bronze result is sealed"
        startRevealed={startRevealed}
      />
    )
  }

  return (
    <FlipRevealCard
      intensity="medium"
      revealLabel={`Reveal: Third place in ${podium.disciplineLabel}`}
      sealedHint="A bronze result is sealed"
      startRevealed={startRevealed}
    >
      <article className="relative overflow-hidden rounded-xl border border-[color:var(--color-level-bronze)]/70 bg-gradient-to-br from-[color:var(--color-level-bronze)]/25 via-white to-brand-50/20 px-4 py-3.5 shadow-sm">
        <Confetti density="minimal" />
        <div className="relative z-[1] mx-auto flex max-w-[85%] flex-col items-center text-center">
          <span className="text-2xl leading-none" aria-hidden>
            🥉
          </span>
          <p className="mt-1 text-lg font-bold tracking-tight text-ink-800 sm:text-xl">
            Third Place
          </p>
          <p className="mt-0.5 text-sm text-ink-600">{podium.disciplineLabel}</p>
          <CelebrationIdentityChips
            className="mt-2 justify-center"
            discipline={podium.discipline}
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
          />
          {podium.subtitle && (
            <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
          )}
          <CategoryMilestoneClaimLink
            tournamentCategoryLabel={podium.tournamentCategoryLabel}
            competitionAgeLabel={podium.competitionAgeLabel}
            stage="semi-final"
          />
        </div>
      </article>
    </FlipRevealCard>
  )
}

function PersonalBestCard({
  milestone,
  compact,
  startRevealed,
}: {
  milestone: MilestoneCelebration
  compact?: boolean
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="✨"
        title={`${milestone.discipline} personal best`}
        detail={milestone.detail}
        discipline={milestone.discipline}
        tournamentCategoryLabel={milestone.tournamentCategoryLabel}
        competitionAgeLabel={milestone.competitionAgeLabel}
        articleClass="border border-brand-200/70 bg-gradient-to-r from-brand-50/60 to-white"
        intensity="minimal"
        revealLabel={`Reveal: ${milestone.discipline} personal best`}
        sealedHint="A personal best is sealed"
        startRevealed={startRevealed}
      />
    )
  }

  return (
    <FlipRevealCard
      intensity="medium"
      revealLabel={`Reveal: ${milestone.discipline} personal best`}
      sealedHint="A personal best is sealed"
      startRevealed={startRevealed}
    >
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
          <CelebrationIdentityChips
            className="mt-2 justify-center"
            discipline={milestone.discipline}
            tournamentCategoryLabel={milestone.tournamentCategoryLabel}
            competitionAgeLabel={milestone.competitionAgeLabel}
          />
          <CategoryMilestoneClaimLink
            tournamentCategoryLabel={milestone.tournamentCategoryLabel}
            competitionAgeLabel={milestone.competitionAgeLabel}
            stage={milestone.stage}
          />
        </div>
      </article>
    </FlipRevealCard>
  )
}

function milestoneStyle(variant: MilestoneCelebration['variant']): {
  border: string
  icon: string
} {
  switch (variant) {
    case 'matched_best':
      return { border: 'border border-ink-200 bg-gradient-to-r from-ink-50 to-white', icon: '↔️' }
    case 'debut':
      return { border: 'border border-court-200 bg-gradient-to-r from-court-50/80 to-white', icon: '🌟' }
    case 'personal_best':
    default:
      return { border: 'border border-brand-200 bg-gradient-to-r from-brand-50 to-white', icon: '🏆' }
  }
}

function SeniorCountyDebutCard({
  debut,
  compact,
  startRevealed,
}: {
  debut: SeniorCountyDebutCelebration
  compact?: boolean
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="🎖️"
        title={debut.title}
        detail={debut.detail}
        tournamentCategoryLabel="County"
        articleClass="border border-level-county/40 bg-gradient-to-r from-level-county/10 to-white"
        intensity="light"
        revealLabel={`Reveal: ${debut.title}`}
        sealedHint="A landmark debut is waiting"
        startRevealed={startRevealed}
      />
    )
  }

  return (
    <FlipRevealCard
      intensity="high"
      revealLabel={`Reveal: ${debut.title}`}
      sealedHint="A landmark debut is waiting"
      startRevealed={startRevealed}
    >
      <article className="relative overflow-hidden rounded-2xl border-2 border-level-county/50 border-l-4 bg-gradient-to-br from-level-county/15 via-white to-brand-50/40 px-4 py-5 shadow-md">
        <Confetti density="light" />
        <div className="relative z-[1] mx-auto flex max-w-[90%] flex-col items-center text-center">
          <span className="text-4xl leading-none" aria-hidden>
            🎖️
          </span>
          <p className="mt-2 text-2xl font-black tracking-tight text-ink-900 sm:text-3xl">
            {debut.title}
          </p>
          <p className="mt-2 text-sm text-ink-700">{debut.detail}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            <TournamentCategoryChip label="County" />
            {debut.disciplines.map((d) => (
              <DisciplineChip key={d.discipline} code={d.discipline} title={d.disciplineLabel} />
            ))}
          </div>
        </div>
      </article>
    </FlipRevealCard>
  )
}

function MilestoneCard({
  milestone,
  compact,
  startRevealed,
}: {
  milestone: MilestoneCelebration
  compact?: boolean
  startRevealed?: boolean
}) {
  const style = milestoneStyle(milestone.variant)
  const intensity: ConfettiIntensity =
    milestone.variant === 'debut' ? 'light' : 'minimal'

  if (compact) {
    return (
      <CompactCelebrationRow
        icon={style.icon}
        title={milestone.title}
        detail={milestone.detail}
        discipline={milestone.discipline}
        tournamentCategoryLabel={milestone.tournamentCategoryLabel}
        competitionAgeLabel={milestone.competitionAgeLabel}
        articleClass={style.border}
        intensity="minimal"
        revealLabel={`Reveal: ${milestone.title}`}
        sealedHint="A milestone is sealed inside"
        startRevealed={startRevealed}
      />
    )
  }

  return (
    <FlipRevealCard
      intensity={intensity}
      revealLabel={`Reveal: ${milestone.title}`}
      sealedHint="A milestone is sealed inside"
      startRevealed={startRevealed}
    >
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
            <CelebrationIdentityChips
              className="mt-2"
              discipline={milestone.discipline}
              tournamentCategoryLabel={milestone.tournamentCategoryLabel}
              competitionAgeLabel={milestone.competitionAgeLabel}
            />
          </div>
        </div>
      </article>
    </FlipRevealCard>
  )
}

function isFeatured(
  kind: CelebrationHeroKind,
  featured: CelebrationHeroKind | null,
): boolean {
  return featured === kind
}

export function RecapCelebrationHero({
  celebrations,
  features = fullTournamentRecapBuildFeatures(),
  startRevealed = false,
  expandAllCelebrations = false,
  compactAllCelebrations = false,
}: Props) {
  const { winners, runnerUps, jointThirds, milestones, seniorCountyDebut } =
    celebrations

  const podiumWinners = features.showPodium ? winners : []
  const podiumRunnerUps = features.showPodium ? runnerUps : []
  const podiumThirds = features.showPodium ? jointThirds : []
  const personalBests = features.showPersonalBests
    ? milestones.filter((m) => m.variant === 'personal_best')
    : []
  const matchedBests = features.showPersonalBests
    ? milestones.filter((m) => m.variant === 'matched_best')
    : []
  const debutMilestones = features.showDebutMilestones
    ? milestones.filter((m) => m.variant === 'debut')
    : []
  const visibleSeniorCounty =
    features.showSeniorCountyDebut ? seniorCountyDebut : null

  const featured =
    expandAllCelebrations || compactAllCelebrations
      ? null
      : featuredCelebrationHeroKind({
          winners: podiumWinners,
          runnerUps: podiumRunnerUps,
          jointThirds: podiumThirds,
          milestones: [...personalBests, ...matchedBests, ...debutMilestones],
        })

  const expand = (kind: CelebrationHeroKind) => {
    if (compactAllCelebrations) return false
    return expandAllCelebrations || isFeatured(kind, featured)
  }

  const compactCounty = compactAllCelebrations ? visibleSeniorCounty : null
  const compactRunnerUps = expand('runner-up') ? [] : podiumRunnerUps
  const compactThirds = expand('joint-third') ? [] : podiumThirds
  const compactPersonalBests = expand('personal_best') ? [] : personalBests
  const compactMatchedBests = expand('matched_best') ? [] : matchedBests
  const compactDebuts = expand('debut') ? [] : debutMilestones
  const compactCount =
    compactRunnerUps.length +
    compactThirds.length +
    compactPersonalBests.length +
    compactMatchedBests.length +
    compactDebuts.length

  const hasContent =
    podiumWinners.length > 0 ||
    podiumRunnerUps.length > 0 ||
    podiumThirds.length > 0 ||
    personalBests.length > 0 ||
    matchedBests.length > 0 ||
    debutMilestones.length > 0 ||
    visibleSeniorCounty != null

  if (!hasContent) return null

  return (
    <div className="space-y-4">
      {compactCounty && (
        <SeniorCountyDebutCard
          debut={compactCounty}
          compact
          startRevealed={startRevealed}
        />
      )}
      {visibleSeniorCounty && !compactAllCelebrations && (
        <SeniorCountyDebutCard debut={visibleSeniorCounty} startRevealed={startRevealed} />
      )}
      {podiumWinners.length > 0 && (
        <div className={podiumGridClass(podiumWinners.length)}>
          {podiumWinners.map((podium) => (
            <WinnerCard
              key={podium.discipline}
              podium={podium}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {expand('runner-up') && podiumRunnerUps.length > 0 && (
        <div className={podiumGridClass(podiumRunnerUps.length)}>
          {podiumRunnerUps.map((podium) => (
            <RunnerUpCard
              key={podium.discipline}
              podium={podium}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {expand('joint-third') && podiumThirds.length > 0 && (
        <div className={podiumGridClass(podiumThirds.length)}>
          {podiumThirds.map((podium) => (
            <ThirdPlaceCard
              key={podium.discipline}
              podium={podium}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {expand('personal_best') && personalBests.length > 0 && (
        <div className={podiumGridClass(personalBests.length)}>
          {personalBests.map((milestone) => (
            <PersonalBestCard
              key={milestone.id}
              milestone={milestone}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {expand('matched_best') && matchedBests.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {matchedBests.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {expand('debut') && debutMilestones.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {debutMilestones.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}

      {compactCount > 0 && (
        <div className="grid gap-2">
          {compactRunnerUps.map((podium) => (
            <RunnerUpCard
              key={podium.discipline}
              podium={podium}
              compact
              startRevealed={startRevealed}
            />
          ))}
          {compactThirds.map((podium) => (
            <ThirdPlaceCard
              key={podium.discipline}
              podium={podium}
              compact
              startRevealed={startRevealed}
            />
          ))}
          {compactPersonalBests.map((milestone) => (
            <PersonalBestCard
              key={milestone.id}
              milestone={milestone}
              compact
              startRevealed={startRevealed}
            />
          ))}
          {compactMatchedBests.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              compact
              startRevealed={startRevealed}
            />
          ))}
          {compactDebuts.map((milestone) => (
            <MilestoneCard
              key={milestone.id}
              milestone={milestone}
              compact
              startRevealed={startRevealed}
            />
          ))}
        </div>
      )}
    </div>
  )
}
