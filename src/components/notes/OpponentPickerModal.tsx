import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
  opponents: string[]
  onSelect: (opponentName: string) => void
}

export function OpponentPickerModal({ open, onClose, opponents, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (q === '') return opponents
    return opponents.filter((name) => name.toLowerCase().includes(q))
  }, [opponents, query])

  function handleClose() {
    setQuery('')
    onClose()
  }

  function handleSelect(name: string) {
    setQuery('')
    onSelect(name)
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Who is this note about?"
      footer={
        <button
          type="button"
          onClick={handleClose}
          className="rounded-lg border border-ink-100 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
        >
          Cancel
        </button>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-ink-600">
          Search opponents from your match history. Notes are about a single player.
        </p>
        <div>
          <label htmlFor="opponent-picker-search" className="sr-only">
            Search opponents
          </label>
          <input
            id="opponent-picker-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search opponents…"
            autoFocus
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {opponents.length === 0 ? (
          <p className="text-sm text-ink-600">
            No opponents in your imported data yet. Import match results first, or add notes from
            the Events tab after playing a match.
          </p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-ink-600">No opponents match your search.</p>
        ) : (
          <ul className="max-h-64 overflow-y-auto rounded-lg border border-ink-100">
            {filtered.map((name) => (
              <li key={name} className="border-b border-ink-100 last:border-b-0">
                <button
                  type="button"
                  onClick={() => handleSelect(name)}
                  className="flex w-full px-3 py-2.5 text-left text-sm font-medium text-ink-900 transition hover:bg-brand-50 hover:text-brand-800"
                >
                  {name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
