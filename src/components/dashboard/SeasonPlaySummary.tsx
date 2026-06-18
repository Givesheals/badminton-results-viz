import type { SeasonPlaySummaryEntry } from '../../lib/seasonJourney'
import { seasonPlaySummaryEntryKey } from '../../lib/seasonJourney'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  entries: SeasonPlaySummaryEntry[]
}

function isCountyLabel(label: string): boolean {
  return label.trim().toLowerCase() === 'county'
}

function rowAriaLabel(entry: SeasonPlaySummaryEntry): string {
  const { count, tournamentCategoryLabel, competitionAgeLabel } = entry
  const eventLabel = count === 1 ? 'tournament' : 'tournaments'
  const agePrefix = competitionAgeLabel ? `${competitionAgeLabel} ` : ''

  if (isCountyLabel(tournamentCategoryLabel)) {
    const weekendLabel = count === 1 ? 'weekend' : 'weekends'
    return `${count} ${agePrefix}County ${weekendLabel}`
  }

  return `${count} ${agePrefix}${tournamentCategoryLabel} ${eventLabel}`
}

export function SeasonPlaySummary({ entries }: Props) {
  if (entries.length === 0) return null

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-ink-500">Tournaments this season</p>
      <ul className="mt-2 space-y-2" aria-label="Tournaments played this season">
        {entries.map((entry) => (
          <li
            key={seasonPlaySummaryEntryKey(entry)}
            className="flex flex-wrap items-center gap-2 text-sm text-ink-800"
            aria-label={rowAriaLabel(entry)}
          >
            <span className="min-w-[1ch] font-semibold tabular-nums">{entry.count}</span>
            {entry.competitionAgeLabel ? (
              <span className="font-medium text-ink-900">{entry.competitionAgeLabel}</span>
            ) : null}
            <TournamentCategoryChip label={entry.tournamentCategoryLabel} />
            {isCountyLabel(entry.tournamentCategoryLabel) ? (
              <span className="text-ink-600">
                {entry.count === 1 ? 'weekend' : 'weekends'}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
