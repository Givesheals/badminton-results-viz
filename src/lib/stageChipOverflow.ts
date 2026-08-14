export const STAGE_DISPLAY_ORDER = [
  'Finals',
  'Qualification',
  'Consolation',
  'Companion',
  'Groups',
  'Entries',
] as const

export type TournamentPageStage = (typeof STAGE_DISPLAY_ORDER)[number]

export function stagesForVisitor(showCompanion: boolean): TournamentPageStage[] {
  return STAGE_DISPLAY_ORDER.filter((stage) => showCompanion || stage !== 'Companion')
}

export function splitStagesToFit({
  stages,
  chipWidths,
  overflowWidth,
  availableWidth,
  gap,
}: {
  stages: readonly TournamentPageStage[]
  chipWidths: readonly number[]
  overflowWidth: number
  availableWidth: number
  gap: number
}): { visible: TournamentPageStage[]; overflow: TournamentPageStage[] } {
  if (stages.length === 0) {
    return { visible: [], overflow: [] }
  }

  if (rowWidth(chipWidths, gap) <= availableWidth) {
    return { visible: [...stages], overflow: [] }
  }

  let visibleCount = 0
  for (let count = 1; count <= stages.length; count += 1) {
    const withOverflow = [...chipWidths.slice(0, count), overflowWidth]
    if (rowWidth(withOverflow, gap) <= availableWidth) {
      visibleCount = count
    } else {
      break
    }
  }

  return {
    visible: stages.slice(0, visibleCount),
    overflow: stages.slice(visibleCount),
  }
}

function rowWidth(widths: readonly number[], gap: number): number {
  if (widths.length === 0) return 0
  return widths.reduce((sum, width) => sum + width, 0) + gap * (widths.length - 1)
}
