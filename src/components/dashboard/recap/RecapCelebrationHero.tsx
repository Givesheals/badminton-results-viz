import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
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
  /**
   * Kitchen-sink only: also show 1st, 2nd, and 3rd cards with the matched-best
   * note folded in, so both treatments can be compared.
   */
  showMatchedBestFoldIn?: boolean
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
            data-confetti-piece
            className={`absolute rotate-45 rounded-sm opacity-70 ${color} ${size}`}
            style={{ top: pos.top, left: pos.left }}
          />
        )
      })}
    </div>
  )
}

/** Hide pieces that would sit inside the matched-best note or on its border. */
function useClearConfettiAroundNote(
  rootRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root || !active) return

    const gap = 16
    const pieces = () => root.querySelectorAll<HTMLElement>('[data-confetti-piece]')

    const apply = () => {
      const note = root.querySelector<HTMLElement>('[data-finish-note]')
      if (!note) return
      const box = note.getBoundingClientRect()
      for (const piece of pieces()) {
        const rect = piece.getBoundingClientRect()
        const near =
          rect.left < box.right + gap &&
          rect.right > box.left - gap &&
          rect.top < box.bottom + gap &&
          rect.bottom > box.top - gap
        piece.style.visibility = near ? 'hidden' : ''
      }
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(root)
    const note = root.querySelector('[data-finish-note]')
    if (note) observer.observe(note)
    return () => {
      observer.disconnect()
      for (const piece of pieces()) piece.style.visibility = ''
    }
  }, [rootRef, active])
}

function ConfettiClearArticle({
  active,
  density,
  className,
  children,
}: {
  active: boolean
  density: 'full' | 'light' | 'minimal'
  className: string
  children: ReactNode
}) {
  const ref = useRef<HTMLElement>(null)
  useClearConfettiAroundNote(ref, active)
  return (
    <article ref={ref} className={className}>
      <Confetti density={density} />
      {children}
    </article>
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

type FinishNoteKind = 'matched_best' | 'personal_best'

const FINISH_NOTE_COPY: Record<FinishNoteKind, { icon: string; title: string; lead: string }> = {
  matched_best: {
    icon: '↔️',
    title: 'Matched your best',
    lead: "As deep as you've gone at",
  },
  personal_best: {
    icon: '✨',
    title: 'Personal best',
    lead: 'Your deepest run at',
  },
}

function ordinalOccurrence(n: number): string {
  const mod100 = n % 100
  const mod10 = n % 10
  const suffix =
    mod100 >= 11 && mod100 <= 13
      ? 'th'
      : mod10 === 1
        ? 'st'
        : mod10 === 2
          ? 'nd'
          : mod10 === 3
            ? 'rd'
            : 'th'
  return `${n}${suffix} occurrence`
}

function FinishNoteLine({
  kind,
  podium,
  times,
}: {
  kind: FinishNoteKind
  podium: PodiumCelebration
  times?: number
}) {
  const scope = formatCategoryAgeLabel(
    podium.tournamentCategoryLabel,
    podium.competitionAgeLabel,
  )
  const copy = FINISH_NOTE_COPY[kind]
  return (
    <>
      {copy.lead} {scope}{' '}
      <span className="whitespace-nowrap">in {podium.discipline}</span>
      {kind === 'matched_best' && times != null && (
        <>
          {' '}
          <span className="whitespace-nowrap">({ordinalOccurrence(times)})</span>
        </>
      )}
    </>
  )
}

const SPARKLE_ON_SURFACE: Record<PodiumCelebration['kind'], string> = {
  winner: '#c89612',
  'runner-up': '#e2b325',
  'joint-third': '#d4a41a',
}

function FinishNoteIcon({
  kind,
  surface,
}: {
  kind: FinishNoteKind
  surface: PodiumCelebration['kind']
}) {
  const copy = FINISH_NOTE_COPY[kind]
  if (kind !== 'personal_best') {
    return (
      <span className="shrink-0 text-base leading-none" aria-hidden>
        {copy.icon}
      </span>
    )
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
      <path
        fill={SPARKLE_ON_SURFACE[surface]}
        d="M12 1.5 14.8 9.2 22.5 12 14.8 14.8 12 22.5 9.2 14.8 1.5 12 9.2 9.2 12 1.5Z"
      />
      <path
        fill={SPARKLE_ON_SURFACE[surface]}
        d="M18.5 2.2 19.4 4.6 21.8 5.5 19.4 6.4 18.5 8.8 17.6 6.4 15.2 5.5 17.6 4.6 18.5 2.2Z"
      />
    </svg>
  )
}

function FinishNote({
  kind,
  podium,
  times,
  compact = false,
}: {
  kind: FinishNoteKind
  podium: PodiumCelebration
  times?: number
  compact?: boolean
}) {
  const copy = FINISH_NOTE_COPY[kind]
  return (
    <div
      data-finish-note
      className={
        compact
          ? 'mt-2 flex w-full items-center gap-2 rounded-lg border border-ink-200 bg-transparent px-2 py-1.5 text-left'
          : 'mx-auto mt-3 flex w-fit max-w-full items-center gap-2 rounded-lg border border-ink-200 bg-transparent px-3 py-2 text-left'
      }
    >
      <FinishNoteIcon kind={kind} surface={podium.kind} />
      <div className="min-w-0">
        <p className="text-xs font-semibold leading-tight text-ink-900">{copy.title}</p>
        <p className="mt-0.5 text-[11px] leading-tight text-ink-500">
          <FinishNoteLine kind={kind} podium={podium} times={times} />
        </p>
      </div>
    </div>
  )
}

function CompactCelebrationRow({
  icon,
  title,
  detail,
  finishNote,
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
  finishNote?: { kind: FinishNoteKind; podium: PodiumCelebration; times?: number }
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
        {finishNote && (
          <FinishNote
            compact
            kind={finishNote.kind}
            podium={finishNote.podium}
            times={finishNote.times}
          />
        )}
      </article>
    </FlipRevealCard>
  )
}

function WinnerCard({
  podium,
  matchedBest = false,
  personalBest = false,
  times,
  startRevealed,
}: {
  podium: PodiumCelebration
  matchedBest?: boolean
  personalBest?: boolean
  times?: number
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
      <ConfettiClearArticle
        active={matchedBest || personalBest}
        density="full"
        className={`relative overflow-hidden rounded-2xl border-2 border-shuttle-400/60 border-l-4 bg-gradient-to-br from-shuttle-400/30 via-brand-50 to-court-50 px-4 py-6 shadow-md ${style.borderClass}`}
      >
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
          {podium.subtitle && !personalBest && !matchedBest && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
              {podium.subtitle}
            </p>
          )}
          {personalBest && <FinishNote kind="personal_best" podium={podium} times={times} />}
          {matchedBest && <FinishNote kind="matched_best" podium={podium} times={times} />}
        </div>
      </ConfettiClearArticle>
    </FlipRevealCard>
  )
}

function RunnerUpCard({
  podium,
  compact,
  matchedBest = false,
  personalBest = false,
  times,
  startRevealed,
}: {
  podium: PodiumCelebration
  compact?: boolean
  matchedBest?: boolean
  personalBest?: boolean
  times?: number
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="🥈"
        title="Runner-up"
        detail={personalBest || matchedBest ? undefined : podiumFlavorText(podium)}
        finishNote={
          personalBest
            ? { kind: 'personal_best', podium, times }
            : matchedBest
              ? { kind: 'matched_best', podium, times }
              : undefined
        }
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
      <ConfettiClearArticle
        active={matchedBest || personalBest}
        density="light"
        className="relative overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-slate-100 via-white to-brand-50/40 px-4 py-4 shadow-sm"
      >
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
          {podium.subtitle && !personalBest && !matchedBest && (
            <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
          )}
          {personalBest && <FinishNote kind="personal_best" podium={podium} times={times} />}
          {matchedBest && <FinishNote kind="matched_best" podium={podium} times={times} />}
        </div>
      </ConfettiClearArticle>
    </FlipRevealCard>
  )
}

function ThirdPlaceCard({
  podium,
  compact,
  matchedBest = false,
  personalBest = false,
  times,
  startRevealed,
}: {
  podium: PodiumCelebration
  compact?: boolean
  matchedBest?: boolean
  personalBest?: boolean
  times?: number
  startRevealed?: boolean
}) {
  if (compact) {
    return (
      <CompactCelebrationRow
        icon="🥉"
        title="Third place"
        detail={personalBest || matchedBest ? undefined : podiumFlavorText(podium)}
        finishNote={
          personalBest
            ? { kind: 'personal_best', podium, times }
            : matchedBest
              ? { kind: 'matched_best', podium, times }
              : undefined
        }
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
      <ConfettiClearArticle
        active={matchedBest || personalBest}
        density="minimal"
        className="relative overflow-hidden rounded-xl border border-[color:var(--color-level-bronze)]/70 bg-gradient-to-br from-[color:var(--color-level-bronze)]/25 via-white to-brand-50/20 px-4 py-3.5 shadow-sm"
      >
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
          {podium.subtitle && !personalBest && !matchedBest && (
            <p className="mt-2 text-xs font-medium text-ink-500">{podium.subtitle}</p>
          )}
          {personalBest && <FinishNote kind="personal_best" podium={podium} times={times} />}
          {matchedBest && <FinishNote kind="matched_best" podium={podium} times={times} />}
        </div>
      </ConfettiClearArticle>
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

type FoldInPodium = PodiumCelebration & { times: number }

/** First-time copy stays on the card data, and is hidden once the personal-best note is shown. */
const PERSONAL_BEST_FOLD_IN_PREVIEW: FoldInPodium[] = [
  {
    kind: 'winner',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'Senior',
    subtitle: 'Your first Senior Gold title',
    times: 1,
  },
  {
    kind: 'runner-up',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'U19',
    subtitle: 'Your first U19 Gold runner-up finish',
    times: 1,
  },
  {
    kind: 'joint-third',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'O45',
    subtitle: 'Your first O45 Gold third place finish',
    times: 1,
  },
]

/** Repeat-finish copy, the case where a separate matched-best card feels repetitive. */
const MATCHED_BEST_FOLD_IN_PREVIEW: FoldInPodium[] = [
  {
    kind: 'winner',
    discipline: 'MD',
    disciplineLabel: "Men's doubles",
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'Senior',
    subtitle: 'Your 2nd Senior Gold title',
    times: 2,
  },
  {
    kind: 'runner-up',
    discipline: 'WD',
    disciplineLabel: "Women's doubles",
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'U19',
    subtitle: 'This is your second time as a U19 Gold WD runner-up',
    times: 2,
  },
  {
    kind: 'joint-third',
    discipline: 'XD',
    disciplineLabel: 'Mixed doubles',
    tournamentCategoryLabel: 'Gold',
    competitionAgeLabel: 'O45',
    subtitle: 'This is your second time coming third in XD at a O45 Gold',
    times: 2,
  },
]

function PersonalBestFoldInPreview({
  compact,
  startRevealed,
}: {
  compact: boolean
  startRevealed?: boolean
}) {
  const [winner, runnerUp, third] = PERSONAL_BEST_FOLD_IN_PREVIEW

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ink-400">When this finish is a personal best</p>
      {winner && (
        <WinnerCard
          podium={winner}
          personalBest
          times={winner.times}
          startRevealed={startRevealed}
        />
      )}
      {runnerUp && (
        <RunnerUpCard
          podium={runnerUp}
          personalBest
          times={runnerUp.times}
          compact={compact}
          startRevealed={startRevealed}
        />
      )}
      {third && (
        <ThirdPlaceCard
          podium={third}
          personalBest
          times={third.times}
          compact={compact}
          startRevealed={startRevealed}
        />
      )}
    </div>
  )
}

function MatchedBestFoldInPreview({
  compact,
  startRevealed,
}: {
  compact: boolean
  startRevealed?: boolean
}) {
  const [winner, runnerUp, third] = MATCHED_BEST_FOLD_IN_PREVIEW

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-ink-400">When this finish matches your best</p>
      {winner && (
        <WinnerCard
          podium={winner}
          matchedBest
          times={winner.times}
          startRevealed={startRevealed}
        />
      )}
      {runnerUp && (
        <RunnerUpCard
          podium={runnerUp}
          matchedBest
          times={runnerUp.times}
          compact={compact}
          startRevealed={startRevealed}
        />
      )}
      {third && (
        <ThirdPlaceCard
          podium={third}
          matchedBest
          times={third.times}
          compact={compact}
          startRevealed={startRevealed}
        />
      )}
    </div>
  )
}

export function RecapCelebrationHero({
  celebrations,
  features = fullTournamentRecapBuildFeatures(),
  startRevealed = false,
  expandAllCelebrations = false,
  compactAllCelebrations = false,
  showMatchedBestFoldIn = false,
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

      {showMatchedBestFoldIn && features.showPodium && features.showPersonalBests && (
        <PersonalBestFoldInPreview
          compact={compactAllCelebrations}
          startRevealed={startRevealed}
        />
      )}

      {showMatchedBestFoldIn && features.showPodium && features.showPersonalBests && (
        <MatchedBestFoldInPreview
          compact={compactAllCelebrations}
          startRevealed={startRevealed}
        />
      )}
    </div>
  )
}
