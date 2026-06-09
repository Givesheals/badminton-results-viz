import type { RecapRecordMilestone } from '../../../lib/recapRecordMilestones'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  milestones: RecapRecordMilestone[]
}

function sectionHref(sectionId: RecapRecordMilestone['sectionId']): string {
  return `#${sectionId}`
}

function sectionLabel(sectionId: RecapRecordMilestone['sectionId']): string {
  return sectionId === 'best-wins' ? 'Best wins' : 'Nemeses & favourite opponents'
}

export function RecapRecordMilestoneCards({ milestones }: Props) {
  if (milestones.length === 0) return null

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-ink-900">All-time records</h4>
      <div className="grid gap-2 sm:grid-cols-2">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="rounded-xl border border-brand-200/80 bg-gradient-to-br from-brand-50/85 to-white px-3 py-2.5 shadow-sm"
          >
            <div className="flex items-start gap-2">
              {milestone.discipline && (
                <DisciplineChip code={milestone.discipline} className="mt-0.5" />
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-800">{milestone.title}</p>
                <p className="mt-0.5 text-xs text-ink-600">{milestone.detail}</p>
                <a
                  href={sectionHref(milestone.sectionId)}
                  className="mt-1.5 inline-block text-xs font-medium text-brand-700 underline decoration-brand-300 underline-offset-2 transition hover:text-brand-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
                >
                  View {sectionLabel(milestone.sectionId)} ↓
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
