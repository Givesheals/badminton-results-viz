import { useMemo, useState } from 'react'
import type { BePlayerRecord } from '../../data/bePlayerDirectory'
import { searchBePlayers } from '../../data/bePlayerDirectory'

type Props = {
  defaultQuery?: string
  selected: BePlayerRecord | null
  onSelect: (player: BePlayerRecord) => void
  onClear: () => void
  error?: string | null
}

export function BePlayerSearch({ defaultQuery = '', selected, onSelect, onClear, error }: Props) {
  const [query, setQuery] = useState(defaultQuery)

  const results = useMemo(() => searchBePlayers(query), [query])

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-ink-900">
        Find player on Badminton England
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (selected) onClear()
          }}
          className="mt-1 w-full rounded-lg border border-ink-200 px-3 py-2 text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-200"
          placeholder="Search by name, club, or BE number"
          autoComplete="off"
        />
      </label>

      <p className="text-xs text-ink-500">
        Search the Badminton England register and select the correct player if there are multiple
        matches.
      </p>

      {query.trim().length >= 2 && results.length === 0 && !selected && (
        <p className="text-sm text-ink-600">No players found. Try a different spelling or BE number.</p>
      )}

      {results.length > 0 && !selected && (
        <ul
          className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-ink-100 bg-ink-50 p-1"
          role="listbox"
          aria-label="Player search results"
        >
          {results.map((player) => (
            <li key={player.beNumber}>
              <button
                type="button"
                role="option"
                onClick={() => onSelect(player)}
                className="w-full rounded-md px-3 py-2 text-left hover:bg-white"
              >
                <span className="block text-sm font-medium text-ink-900">{player.name}</span>
                <span className="block text-xs text-ink-600">
                  BE {player.beNumber} · {player.club} · {player.county}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-ink-900">{selected.name}</p>
            <p className="text-xs text-ink-600">
              BE {selected.beNumber} · {selected.club} · {selected.county}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear()
            }}
            className="shrink-0 text-xs font-medium text-brand-700 hover:text-brand-600"
          >
            Change
          </button>
        </div>
      )}

      {error && <p className="text-sm text-loss-600">{error}</p>}
    </div>
  )
}
