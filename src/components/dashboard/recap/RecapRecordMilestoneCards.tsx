import { DashboardSectionLink } from '../../../context/DashboardNavigationContext'
import type { RecapRecordMilestone } from '../../../lib/recapRecordMilestones'
import { DisciplineChip } from '../../discipline/DisciplineChip'

type Props = {
  milestones: RecapRecordMilestone[]
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
                <DashboardSectionLink sectionId={milestone.sectionId} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
