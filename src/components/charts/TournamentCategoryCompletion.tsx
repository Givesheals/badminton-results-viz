import { createPortal } from 'react-dom'
import {
  PROGRESSION_STAGE_LABELS,
  type CategoryCompletionAgeGroup,
  type CategoryCompletionMilestone,
  type CategoryCompletionRow,
} from '../../lib/tournamentProgression'
import { formatDisplayDate } from '../../lib/formatDate'
import { useDismissiblePopover } from '../../hooks/useDismissiblePopover'
import { usePopoverPosition } from '../../hooks/usePopoverPosition'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  ageGroups: CategoryCompletionAgeGroup[]
}

const BACKDROP_CLASS = 'fixed inset-0 z-40 bg-ink-900/30'
const PANEL_CLASS =
  'card-frame fixed z-50 rounded-2xl bg-white p-4 text-sm leading-relaxed text-ink-800 shadow-xl ring-2 ring-brand-200 outline-none'

function MilestoneBadgeIcon({ achieved }: { achieved: boolean }) {
  if (achieved) {
    return (
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gain-600 text-[11px] font-bold leading-none text-white shadow-sm ring-2 ring-gain-100">
        ✓
      </span>
    )
  }

  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-loss-50 text-[10px] font-bold leading-none text-loss-600/45 ring-1 ring-loss-100">
      ✗
    </span>
  )
}

function MilestoneCell({ milestone }: { milestone: CategoryCompletionMilestone }) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()
  const position = usePopoverPosition(open, triggerRef)
  const achievement = milestone.firstAchievement
  const isInteractive = milestone.achieved && achievement != null
  const fullStageLabel = PROGRESSION_STAGE_LABELS[milestone.stage]

  return (
    <div className="flex flex-col items-center gap-0.5">
      {isInteractive ? (
        <button
          ref={triggerRef}
          type="button"
          className="rounded-full transition hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={`First ${fullStageLabel} achievement details`}
          onClick={toggle}
        >
          <MilestoneBadgeIcon achieved />
        </button>
      ) : (
        <span aria-label={milestone.achieved ? 'Achieved' : 'Not yet achieved'}>
          <MilestoneBadgeIcon achieved={milestone.achieved} />
        </span>
      )}

      <span
        className="text-center text-[9px] font-medium uppercase tracking-wide text-ink-400"
        title={fullStageLabel}
      >
        {milestone.label}
      </span>

      {isInteractive && open
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

function CompletionRow({
  row,
  showAgeInHeader,
}: {
  row: CategoryCompletionRow
  showAgeInHeader: boolean
}) {
  const eventLabel = row.tournamentCount === 1 ? 'event' : 'events'

  return (
    <li className="rounded-xl border border-ink-100 bg-gradient-to-r from-white to-ink-50/80 px-2.5 py-2.5 shadow-sm">
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
          <MilestoneCell key={milestone.stage} milestone={milestone} />
        ))}
      </div>
    </li>
  )
}

function AgeGroupBlock({ group }: { group: CategoryCompletionAgeGroup }) {
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
          <CompletionRow key={row.label} row={row} showAgeInHeader={showAgeInHeader} />
        ))}
      </ul>
    </section>
  )
}

export function TournamentCategoryCompletion({ ageGroups }: Props) {
  if (ageGroups.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-4">
      {ageGroups.map((group) => (
        <AgeGroupBlock key={group.ageLabel ?? '__unknown__'} group={group} />
      ))}
    </div>
  )
}
