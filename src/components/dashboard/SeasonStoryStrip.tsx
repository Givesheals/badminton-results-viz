import { useState } from 'react'
import type { SeasonWeekendStory } from '../../lib/seasonJourney'
import { formatDisplayDate } from '../../lib/formatDate'

type Props = {
  weekends: SeasonWeekendStory[]
}

export function SeasonStoryStrip({ weekends }: Props) {
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  if (weekends.length === 0) {
    return (
      <p className="text-sm text-ink-600">
        Your season timeline will fill in as you compete at more events.
      </p>
    )
  }

  const selected =
    weekends.find((w) => `${w.competitionName}|${w.date}` === selectedKey) ?? null

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-600">
        Season weekends
      </p>
      <div
        className="relative h-14 rounded-xl border border-ink-100 bg-gradient-to-r from-ink-50 to-white px-2"
        role="list"
      >
        <div className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 bg-ink-200" />
        {weekends.map((weekend) => {
          const key = `${weekend.competitionName}|${weekend.date}`
          const size = Math.min(16, 8 + Math.sqrt(weekend.matchCount) * 2)
          const isSelected = selectedKey === key
          return (
            <button
              key={key}
              type="button"
              role="listitem"
              title={weekend.competitionName}
              className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-500 shadow transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 ${
                isSelected ? 'ring-2 ring-brand-400' : ''
              }`}
              style={{
                left: `${weekend.position * 100}%`,
                width: size,
                height: size,
              }}
              onClick={() => setSelectedKey(isSelected ? null : key)}
            />
          )
        })}
      </div>

      {selected && (
        <div className="rounded-lg border border-ink-100 bg-white px-4 py-3 text-sm shadow-sm">
          <p className="font-semibold text-ink-900">{selected.competitionName}</p>
          <p className="mt-1 text-ink-600">{formatDisplayDate(selected.date)}</p>
          <p className="mt-2 text-ink-800">
            {selected.wins}W · {selected.losses}L
            {selected.bestStageLabel ? ` · Best: ${selected.bestStageLabel}` : ''}
          </p>
        </div>
      )}
    </div>
  )
}
