import { useId, useState } from 'react'
import type { DisciplineFamily } from '../../lib/disciplineStyle'
import type { PartnerAchievementRow } from '../../lib/partnerAchievements'
import type { NormalizedMatch } from '../../types/matchHistory'
import { PartnerHighlightCard } from './PartnerHighlightCard'
import { PartnerTournamentHistoryPanel } from './PartnerTournamentHistoryPanel'

type Props = {
  row: PartnerAchievementRow
  family: DisciplineFamily
  familyMatches: NormalizedMatch[]
  disciplineCode: string
  shareMode?: boolean
  showStageChips?: boolean
  showHistoryAccordion?: boolean
  showMatches?: boolean
}

export function PartnerHighlightAccordionItem({
  row,
  family,
  familyMatches,
  disciplineCode,
  shareMode = false,
  showStageChips = true,
  showHistoryAccordion = true,
  showMatches = true,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const expandable = showHistoryAccordion && !shareMode
  const isOpen = expandable && expanded

  return (
    <li className="overflow-hidden rounded-xl card-frame bg-white shadow-sm">
      <PartnerHighlightCard
        row={row}
        expanded={isOpen}
        onToggle={expandable ? () => setExpanded((value) => !value) : undefined}
        panelId={panelId}
        showStageChips={showStageChips}
        expandable={expandable}
      />
      {isOpen ? (
        <div id={panelId} className="border-t border-ink-100" data-share-exclude>
          <PartnerTournamentHistoryPanel
            matches={familyMatches}
            partnerName={row.partnerName}
            family={family}
            disciplineCode={disciplineCode}
            showMatches={showMatches}
          />
        </div>
      ) : null}
    </li>
  )
}
