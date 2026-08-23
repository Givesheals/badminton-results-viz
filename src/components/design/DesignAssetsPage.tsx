import { createPortal } from 'react-dom'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { NoteTagChips } from '../notes/NoteTagPicker'
import {
  FileCirclePlusIcon,
  FilePenIcon,
  OPPONENT_NOTE_ICON_BUTTON_CLASS,
} from '../notes/OpponentNoteIcons'
import { CompetitionAgeChip } from '../tournament/CompetitionAgeChip'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'
import {
  isLightGroupProgressionStage,
  PROGRESSION_PARTNER_CHIP_COLORS,
  PROGRESSION_STAGE_CHIP_ORDER,
  PROGRESSION_STAGE_COLORS,
  PROGRESSION_STAGE_LABELS,
  type ProgressionStage,
} from '../../lib/tournamentProgression'

type Props = {
  open: boolean
  onClose: () => void
}

const PARTNER_STAGES: ProgressionStage[] = PROGRESSION_STAGE_CHIP_ORDER.filter(
  (stage) => stage !== 'knockout',
)

function AssetGroup({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-ink-100 bg-white p-3">
      <h2 className="text-sm font-semibold tracking-tight text-ink-900">{title}</h2>
      <div className="mt-2 flex flex-wrap items-center gap-2">{children}</div>
    </section>
  )
}

function PartnerStageChip({ stage }: { stage: ProgressionStage }) {
  const lightGroup = isLightGroupProgressionStage(stage)

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs ${
        lightGroup ? 'font-medium text-black' : 'font-semibold text-white shadow-sm'
      }`}
      style={{
        backgroundColor:
          PROGRESSION_PARTNER_CHIP_COLORS[stage] ?? PROGRESSION_STAGE_COLORS[stage],
      }}
    >
      {PROGRESSION_STAGE_LABELS[stage]}
    </span>
  )
}

export function DesignAssetsPage({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink-50 outline-none"
    >
      <header className="sticky top-0 z-10 border-b border-ink-200 bg-white px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <h1 id={titleId} className="text-base font-semibold text-ink-900">
            Design Assets
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close design assets"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          <AssetGroup title="Tournament levels">
            <TournamentCategoryChip label="Copper" />
            <TournamentCategoryChip label="Bronze" />
            <TournamentCategoryChip label="Silver" />
            <TournamentCategoryChip label="Gold" />
            <TournamentCategoryChip label="Other" />
            <TournamentCategoryChip label="County" />
          </AssetGroup>

          <AssetGroup title="Age bands">
            <CompetitionAgeChip label="Junior" />
            <CompetitionAgeChip label="Senior" />
            <CompetitionAgeChip label="Masters" />
          </AssetGroup>

          <AssetGroup title="Disciplines">
            <DisciplineChip code="MD" />
            <DisciplineChip code="XD" />
            <DisciplineChip code="MS" />
          </AssetGroup>

          <AssetGroup title="Notes">
            <span className={OPPONENT_NOTE_ICON_BUTTON_CLASS} title="Notes">
              <FilePenIcon className="h-4 w-4" />
            </span>
            <span className={OPPONENT_NOTE_ICON_BUTTON_CLASS} title="Add notes">
              <FileCirclePlusIcon className="h-4 w-4" />
            </span>
            <NoteTagChips labels={['Smash at forehand']} />
          </AssetGroup>

          <AssetGroup title="Curiosities">
            <span className="inline-flex items-center rounded-md border border-curiosity/35 bg-curiosity-soft px-2.5 py-0.5 text-xs font-semibold text-curiosity">
              Nail Biter
            </span>
          </AssetGroup>

          <AssetGroup title="Results">
            <span className="inline-flex items-center rounded-full bg-gain-50 px-2.5 py-0.5 text-xs font-semibold text-gain-700">
              Win
            </span>
            <span className="inline-flex items-center rounded-full bg-loss-50 px-2.5 py-0.5 text-xs font-semibold text-loss-700">
              Loss
            </span>
          </AssetGroup>

          <AssetGroup title="Tournament partners">
            {PARTNER_STAGES.map((stage) => (
              <PartnerStageChip key={stage} stage={stage} />
            ))}
          </AssetGroup>
        </div>
      </div>
    </div>,
    document.body,
  )
}
