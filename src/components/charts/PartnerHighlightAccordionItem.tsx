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
}

export function PartnerHighlightAccordionItem({
  row,
  family,
  familyMatches,
  disciplineCode,
  shareMode = false,
}: Props) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  const isOpen = shareMode ? false : expanded

  return (
    <li className="overflow-hidden rounded-xl card-frame bg-white shadow-sm">
      <PartnerHighlightCard
        row={row}
        expanded={isOpen}
        onToggle={() => setExpanded((value) => !value)}
        panelId={panelId}
      />
      {isOpen ? (
        <div id={panelId} className="border-t border-ink-100" data-share-exclude>
          <PartnerTournamentHistoryPanel
            matches={familyMatches}
            partnerName={row.partnerName}
            family={family}
            disciplineCode={disciplineCode}
          />
        </div>
      ) : null}
    </li>
  )
}
