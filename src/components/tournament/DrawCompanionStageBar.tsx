import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useDismissiblePopover } from '../../hooks/useDismissiblePopover'
import type { TournamentPageVisibility } from '../../lib/tournamentPageMockData'
import {
  splitStagesToFit,
  stagesForVisitor,
  type TournamentPageStage,
} from '../../lib/stageChipOverflow'

export type { TournamentPageStage }

type Props = {
  visibility: TournamentPageVisibility
  selectedStage: TournamentPageStage
  onSelectStage: (stage: TournamentPageStage) => void
}

const CHIP_GAP_FALLBACK_PX = 8

/** Compact crown mark for the Premium / gift Companion stage chip. */
function CrownIcon({ className = 'h-3.5 w-3.5 text-amber-500' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2.5 14.5h15l-1.2-7.2a.75.75 0 00-1.22-.42L12 9.5 10.42 5.3a.75.75 0 00-1.34 0L7.5 9.5 4.42 6.88a.75.75 0 00-1.22.42L2.5 14.5zM3 16a1 1 0 001 1h12a1 1 0 001-1v-.5H3V16z" />
    </svg>
  )
}

function ChevronDown({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={`shrink-0 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function stageChipClass(selected: boolean) {
  return `inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 ${
    selected
      ? 'border border-ink-900 bg-ink-200 text-ink-900'
      : 'bg-ink-100 text-brand-700 hover:bg-ink-200'
  }`
}

function StageChipLabel({ stage }: { stage: TournamentPageStage }) {
  if (stage !== 'Companion') return stage
  return (
    <>
      Companion
      <CrownIcon />
    </>
  )
}

function OverflowMenu({ stages }: { stages: TournamentPageStage[] }) {
  const { open, toggle, close, triggerRef, panelRef, panelId } = useDismissiblePopover()

  return (
    <div className="relative shrink-0">
      <button
        ref={triggerRef}
        type="button"
        className={`${stageChipClass(false)} text-ink-700`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="More stages"
        onClick={toggle}
      >
        More
        <ChevronDown />
      </button>
      {open ? (
        <div
          ref={panelRef}
          id={panelId}
          role="menu"
          aria-label="More stages"
          tabIndex={-1}
          className="absolute right-0 z-20 mt-1 min-w-[11rem] rounded-lg border border-ink-200 bg-white py-1 shadow-md outline-none"
        >
          {stages.map((stage) => (
            <button
              key={stage}
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-1 px-3 py-2 text-left text-sm text-ink-800 hover:bg-ink-50"
              onClick={close}
            >
              <StageChipLabel stage={stage} />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Tournament page stage bar. Chips follow display priority and only as many as
 * fit are shown; the rest open from a More menu (choices are listed only).
 */
export function DrawCompanionStageBar({
  visibility,
  selectedStage,
  onSelectStage,
}: Props) {
  const showCompanion = visibility !== 'hidden'
  const stages = useMemo(() => stagesForVisitor(showCompanion), [showCompanion])
  const viewportRef = useRef<HTMLDivElement>(null)
  const measureRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState<TournamentPageStage[]>(stages)
  const [overflow, setOverflow] = useState<TournamentPageStage[]>([])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const measure = measureRef.current
    if (!viewport || !measure) return

    const update = () => {
      const chipNodes = [
        ...measure.querySelectorAll<HTMLElement>('[data-stage-measure]'),
      ]
      const overflowNode = measure.querySelector<HTMLElement>('[data-overflow-measure]')
      if (chipNodes.length !== stages.length || !overflowNode) return

      const gapValue = Number.parseFloat(getComputedStyle(measure).columnGap)
      const gap = Number.isFinite(gapValue) ? gapValue : CHIP_GAP_FALLBACK_PX
      const split = splitStagesToFit({
        stages,
        chipWidths: chipNodes.map((node) => node.getBoundingClientRect().width),
        overflowWidth: overflowNode.getBoundingClientRect().width,
        availableWidth: viewport.getBoundingClientRect().width,
        gap,
      })
      setVisible(split.visible)
      setOverflow(split.overflow)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(viewport)
    return () => observer.disconnect()
  }, [stages])

  return (
    <div className="flex items-center gap-2" role="tablist" aria-label="Stage">
      <span className="shrink-0 text-sm font-medium text-brand-700">Stage:</span>
      <div ref={viewportRef} className="relative min-w-0 flex-1">
        <div
          ref={measureRef}
          className="pointer-events-none invisible absolute top-0 left-0 flex w-max gap-2"
          aria-hidden
        >
          {stages.map((stage) => (
            <span key={stage} data-stage-measure className={stageChipClass(false)}>
              <StageChipLabel stage={stage} />
            </span>
          ))}
          <span data-overflow-measure className={stageChipClass(false)}>
            More
            <ChevronDown />
          </span>
        </div>
        <div className="flex flex-nowrap items-center gap-2">
          {visible.map((stage) => {
            const selected = selectedStage === stage
            return (
              <button
                key={stage}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onSelectStage(stage)}
                className={stageChipClass(selected)}
                aria-label={stage === 'Companion' ? 'Draw companion' : undefined}
                title={stage === 'Companion' ? 'Draw companion' : undefined}
              >
                <StageChipLabel stage={stage} />
              </button>
            )
          })}
          {overflow.length > 0 ? <OverflowMenu stages={overflow} /> : null}
        </div>
      </div>
    </div>
  )
}
