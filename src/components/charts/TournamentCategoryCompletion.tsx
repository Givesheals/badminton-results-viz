import { createPortal } from 'react-dom'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import {
  comboKeyFromRow,
  resolveCardDisplayState,
  resolveRoundDisplayState,
  categoryMilestoneRowId,
  type RoundDisplayState,
} from '../../lib/categoryMilestoneClaims'
import {
  PROGRESSION_STAGE_LABELS,
  type CategoryCompletionAgeGroup,
  type CategoryCompletionMilestone,
  type CategoryCompletionRow,
  type ProgressionStage,
} from '../../lib/tournamentProgression'
import { formatDisplayDate } from '../../lib/formatDate'
import { useDismissiblePopover } from '../../hooks/useDismissiblePopover'
import { usePopoverPosition } from '../../hooks/usePopoverPosition'
import { AccordionChevron } from '../ui/AccordionChevron'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

const CLAIM_ANIMATION_MS = 650

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'
const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

type ClaimsApi = {
  isRoundClaimed: (comboKey: string, stage: ProgressionStage) => boolean
  isCardClaimed: (comboKey: string) => boolean
  onClaimRound: (comboKey: string, stage: ProgressionStage) => void
  onClaimCard: (comboKey: string) => void
}

type Props = {
  ageGroups: CategoryCompletionAgeGroup[]
  claims: ClaimsApi
  claimedKeys: ReadonlySet<string>
  highlightTarget?: { comboKey: string; stage: ProgressionStage } | null
  onHighlightComplete?: () => void
}

function ClaimingRoundIcon() {
  return (
    <span
      className="relative flex h-6 w-6 items-center justify-center"
      aria-label="Claiming milestone"
    >
      <span
        className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand-400 animate-quarter-claim-ring"
        aria-hidden
      />
      <span
        className="absolute flex h-5 w-5 items-center justify-center rounded-full bg-brand-100 text-sm font-bold leading-none text-brand-700 animate-quarter-question-out"
        aria-hidden
      >
        ?
      </span>
      <span
        className="absolute text-[11px] font-bold leading-none text-brand-600 animate-quarter-tick-in"
        aria-hidden
      >
        ✓
      </span>
    </span>
  )
}

function MilestoneBadgeIcon({
  displayState,
  highlighted = false,
}: {
  displayState: RoundDisplayState
  highlighted?: boolean
}) {
  if (displayState === 'claimed') {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gain-600 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-gain-100">
        ✓
      </span>
    )
  }

  if (displayState === 'claimable') {
    return (
      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-sm font-bold leading-none text-brand-700 ring-2 ring-brand-300">
        {!highlighted && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full border-2 border-brand-400 animate-quarter-claim-ring"
            aria-hidden
          />
        )}
        <span
          className={
            highlighted ? 'animate-quarter-tick-celebrate' : 'animate-milestone-claim-wobble'
          }
          aria-hidden
        >
          ?
        </span>
      </span>
    )
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-loss-50 text-[10px] font-bold leading-none text-loss-600/45 ring-1 ring-loss-100">
      ✗
    </span>
  )
}

function MilestoneCell({
  milestone,
  comboKey,
  claims,
  highlighted = false,
}: {
  milestone: CategoryCompletionMilestone
  comboKey: string
  claims: ClaimsApi
  highlighted?: boolean
}) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)
  const achievement = milestone.firstAchievement
  const isClaimed = claims.isRoundClaimed(comboKey, milestone.stage)
  const displayState = resolveRoundDisplayState(milestone.achieved, isClaimed)
  const [claiming, setClaiming] = useState(false)
  const claimTimeoutRef = useRef<number | null>(null)
  const fullStageLabel = PROGRESSION_STAGE_LABELS[milestone.stage]

  useEffect(() => {
    return () => {
      if (claimTimeoutRef.current != null) {
        window.clearTimeout(claimTimeoutRef.current)
      }
    }
  }, [])

  const handleClaim = useCallback(() => {
    if (claiming || displayState !== 'claimable') return

    setClaiming(true)
    if (claimTimeoutRef.current != null) {
      window.clearTimeout(claimTimeoutRef.current)
    }

    claimTimeoutRef.current = window.setTimeout(() => {
      claims.onClaimRound(comboKey, milestone.stage)
      setClaiming(false)
      claimTimeoutRef.current = null
    }, CLAIM_ANIMATION_MS)
  }, [claiming, claims, comboKey, displayState, milestone.stage])

  const canOpenPopover = displayState === 'claimed' && achievement != null

  return (
    <div className="flex flex-col items-center gap-0.5">
      {claiming ? (
        <ClaimingRoundIcon />
      ) : displayState === 'claimable' ? (
        <button
          type="button"
          className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-label={`Claim ${fullStageLabel} milestone`}
          onClick={handleClaim}
        >
          <MilestoneBadgeIcon displayState={displayState} highlighted={highlighted} />
        </button>
      ) : canOpenPopover ? (
        <button
          ref={triggerRef}
          type="button"
          className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`First ${fullStageLabel} achievement details`}
          onClick={toggle}
        >
          <MilestoneBadgeIcon displayState={displayState} />
        </button>
      ) : (
        <span aria-label={displayState === 'claimed' ? 'Claimed' : 'Not yet achieved'}>
          <MilestoneBadgeIcon displayState={displayState} />
        </span>
      )}

      <span
        className="text-center text-[9px] font-medium uppercase tracking-wide text-ink-400"
        title={fullStageLabel}
      >
        {milestone.label}
      </span>

      {canOpenPopover && open
        ? createPortal(
            <>
              <div className={BACKDROP_CLASS} aria-hidden onClick={close} />
              <div
                ref={panelRef}
                id={panelId}
                role="dialog"
                aria-label={`First ${fullStageLabel} achievement`}
                tabIndex={-1}
                className={PANEL_CLASS}
                style={{
                  top: position.top,
                  left: position.left,
                  right: position.right,
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.stopPropagation()
                    close()
                  }
                }}
              >
                <p className="text-sm font-medium text-brand-700">
                  First {fullStageLabel}
                </p>
                <dl className="mt-2 space-y-2 text-sm">
                  <div>
                    <dt className="text-xs text-ink-500">Competition</dt>
                    <dd className="font-medium text-ink-900">{achievement.competitionName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">Date</dt>
                    <dd className="font-medium text-ink-900">
                      {formatDisplayDate(achievement.date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-ink-500">Partner</dt>
                    <dd className="font-medium text-ink-900">
                      {achievement.partnerName ?? 'Singles'}
                    </dd>
                  </div>
                </dl>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  )
}

function CompleteRow({
  row,
  showAgeInHeader,
  comboKey,
  claims,
  highlightStage,
}: {
  row: CategoryCompletionRow
  showAgeInHeader: boolean
  comboKey: string
  claims: ClaimsApi
  highlightStage?: ProgressionStage | null
}) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const eventLabel = row.tournamentCount === 1 ? 'event' : 'events'
  const categoryLabel = row.tournamentCategoryLabel

  useEffect(() => {
    if (highlightStage != null) {
      setExpanded(true)
    }
  }, [highlightStage])

  return (
    <li
      id={categoryMilestoneRowId(comboKey)}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-ink-100 bg-gain-50/40 shadow-sm"
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left transition hover:bg-gain-50/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200"
        aria-expanded={expanded}
        aria-controls={panelId}
        aria-label={
          expanded
            ? `Hide milestones for ${categoryLabel}`
            : `Show milestones for ${categoryLabel}`
        }
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {showAgeInHeader && row.competitionAgeLabel ? (
            <span className="truncate text-xs font-semibold text-ink-900">
              {row.competitionAgeLabel}
            </span>
          ) : null}
          <TournamentCategoryChip label={row.tournamentCategoryLabel} />
          <span className="text-[10px] font-medium uppercase tracking-wide text-gain-700">
            Complete
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[11px] tabular-nums text-ink-500">
            {row.tournamentCount} {eventLabel}
          </span>
          <AccordionChevron open={expanded} className="h-4 w-4" />
        </div>
      </button>

      {expanded ? (
        <div id={panelId} className="border-t border-ink-100 px-2.5 pb-2.5 pt-2">
          <div className="grid grid-cols-6 gap-0.5">
            {row.milestones.map((milestone) => (
              <MilestoneCell
                key={milestone.stage}
                milestone={milestone}
                comboKey={comboKey}
                claims={claims}
                highlighted={highlightStage === milestone.stage}
              />
            ))}
          </div>
        </div>
      ) : null}
    </li>
  )
}

function CompletionRow({
  row,
  showAgeInHeader,
  claims,
  claimedKeys,
  highlightStage,
}: {
  row: CategoryCompletionRow
  showAgeInHeader: boolean
  claims: ClaimsApi
  claimedKeys: ReadonlySet<string>
  highlightStage?: ProgressionStage | null
}) {
  const comboKey = comboKeyFromRow(row.tournamentCategoryLabel, row.competitionAgeLabel)
  const cardState = resolveCardDisplayState(row.milestones, comboKey, claimedKeys)
  const [claimingCard, setClaimingCard] = useState(false)
  const claimTimeoutRef = useRef<number | null>(null)
  const eventLabel = row.tournamentCount === 1 ? 'event' : 'events'

  useEffect(() => {
    return () => {
      if (claimTimeoutRef.current != null) {
        window.clearTimeout(claimTimeoutRef.current)
      }
    }
  }, [])

  const handleClaimCard = useCallback(() => {
    if (claimingCard || cardState !== 'ready_to_claim') return

    setClaimingCard(true)
    if (claimTimeoutRef.current != null) {
      window.clearTimeout(claimTimeoutRef.current)
    }

    claimTimeoutRef.current = window.setTimeout(() => {
      claims.onClaimCard(comboKey)
      setClaimingCard(false)
      claimTimeoutRef.current = null
    }, CLAIM_ANIMATION_MS)
  }, [cardState, claimingCard, claims, comboKey])

  if (cardState === 'complete') {
    return (
      <CompleteRow
        row={row}
        showAgeInHeader={showAgeInHeader}
        comboKey={comboKey}
        claims={claims}
        highlightStage={highlightStage}
      />
    )
  }

  const frameClass =
    cardState === 'ready_to_claim'
      ? 'border-brand-300 bg-gradient-to-r from-brand-50/60 to-white ring-2 ring-brand-200'
      : 'border-ink-100 bg-gradient-to-r from-white to-ink-50/80'

  return (
    <li
      id={categoryMilestoneRowId(comboKey)}
      className={`scroll-mt-24 rounded-xl border px-2.5 py-2.5 shadow-sm ${frameClass} ${
        claimingCard ? 'pointer-events-none animate-quarter-card-exit' : ''
      }`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {showAgeInHeader && row.competitionAgeLabel ? (
            <span className="truncate text-xs font-semibold text-ink-900">
              {row.competitionAgeLabel}
            </span>
          ) : null}
          <TournamentCategoryChip label={row.tournamentCategoryLabel} />
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-ink-500">
          {row.tournamentCount} {eventLabel}
        </span>
      </div>

      <div className="grid grid-cols-6 gap-0.5">
        {row.milestones.map((milestone) => (
          <MilestoneCell
            key={milestone.stage}
            milestone={milestone}
            comboKey={comboKey}
            claims={claims}
            highlighted={highlightStage === milestone.stage}
          />
        ))}
      </div>

      {cardState === 'ready_to_claim' && (
        <button
          type="button"
          onClick={handleClaimCard}
          disabled={claimingCard}
          className="mt-2.5 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 sm:w-auto"
        >
          Claim
        </button>
      )}
    </li>
  )
}

function AgeGroupBlock({
  group,
  claims,
  claimedKeys,
  highlightStage,
}: {
  group: CategoryCompletionAgeGroup
  claims: ClaimsApi
  claimedKeys: ReadonlySet<string>
  highlightStage?: ProgressionStage | null
}) {
  const showAgeInHeader = group.ageLabel == null

  return (
    <section className="border-t border-ink-100 pt-3 first:border-t-0 first:pt-0">
      {group.ageLabel ? (
        <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-ink-400">
          {group.ageLabel}
        </h4>
      ) : null}
      <ul className="space-y-1.5">
        {group.rows.map((row) => (
          <CompletionRow
            key={row.label}
            row={row}
            showAgeInHeader={showAgeInHeader}
            claims={claims}
            claimedKeys={claimedKeys}
            highlightStage={highlightStage}
          />
        ))}
      </ul>
    </section>
  )
}

export function TournamentCategoryCompletion({
  ageGroups,
  claims,
  claimedKeys,
  highlightTarget,
  onHighlightComplete,
}: Props) {
  const highlightStage =
    highlightTarget != null &&
    ageGroups.some((group) =>
      group.rows.some(
        (row) =>
          comboKeyFromRow(row.tournamentCategoryLabel, row.competitionAgeLabel) ===
            highlightTarget.comboKey,
      ),
    )
      ? highlightTarget.stage
      : null

  useEffect(() => {
    if (highlightStage == null || onHighlightComplete == null) return

    const timeout = window.setTimeout(() => {
      onHighlightComplete()
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [highlightStage, onHighlightComplete])

  if (ageGroups.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-4">
      {ageGroups.map((group) => (
        <AgeGroupBlock
          key={group.ageLabel ?? '__unknown__'}
          group={group}
          claims={claims}
          claimedKeys={claimedKeys}
          highlightStage={highlightStage}
        />
      ))}
    </div>
  )
}
