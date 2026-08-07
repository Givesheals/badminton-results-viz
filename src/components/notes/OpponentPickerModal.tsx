import { useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import {
  searchNotePlayers,
  type NotePlayerResult,
  type PlayerGrade,
} from '../../lib/notePlayerSearch'

type Props = {
  open: boolean
  onClose: () => void
  opponents: string[]
  onSelect: (opponentName: string) => void
}

function GradeBoxes({ grades }: { grades: [PlayerGrade, PlayerGrade, PlayerGrade] }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Grades ${grades.join(', ')}`}>
      {grades.map((grade, index) => (
        <span
          key={`${grade}-${index}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded-sm border border-ink-300 bg-white text-[10px] font-semibold leading-none text-ink-800"
        >
          {grade}
        </span>
      ))}
    </span>
  )
}

function PlayerResultButton({
  player,
  onSelect,
}: {
  player: NotePlayerResult
  onSelect: (name: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player.name)}
      className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition hover:bg-brand-50"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-brand-700 underline-offset-2 hover:underline">
          {player.name}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-600">
          <span>{player.county || '—'}</span>
          <GradeBoxes grades={player.grades} />
          <span className="tabular-nums">BE {player.beNumber}</span>
        </span>
      </span>
    </button>
  )
}

export function OpponentPickerModal({ open, onClose, opponents, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const { fromHistory, fromRegister } = useMemo(
    () => searchNotePlayers(query, opponents),
    [opponents, query],
  )

  const trimmedQuery = query.trim()
  const totalResults = fromHistory.length + fromRegister.length
  const showFreeText =
    trimmedQuery.length >= 2 &&
    !fromHistory.some((player) => player.name.toLowerCase() === trimmedQuery.toLowerCase()) &&
    !fromRegister.some((player) => player.name.toLowerCase() === trimmedQuery.toLowerCase())

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
          Search any player by name, county, or BE number. Use county, grades, and BE number to pick
          the right person when names look similar.
        </p>
        <div>
          <label htmlFor="opponent-picker-search" className="sr-only">
            Search players
          </label>
          <input
            id="opponent-picker-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players…"
            autoFocus
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {opponents.length === 0 && trimmedQuery.length < 2 ? (
          <p className="text-sm text-ink-600">
            Type at least 2 letters to search the player register, or import match results to see
            people you have already played.
          </p>
        ) : totalResults === 0 && !showFreeText ? (
          <p className="text-sm text-ink-600">No players match your search.</p>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {fromHistory.length > 0 && (
              <section>
                <h3 className="mb-1 px-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  People you have played
                </h3>
                <ul className="overflow-hidden rounded-lg border border-ink-100">
                  {fromHistory.map((player) => (
                    <li key={player.id} className="border-b border-ink-100 last:border-b-0">
                      <PlayerResultButton player={player} onSelect={handleSelect} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {fromRegister.length > 0 && (
              <section>
                <h3 className="mb-1 px-0.5 text-xs font-semibold uppercase tracking-wide text-ink-500">
                  All players
                </h3>
                <ul className="overflow-hidden rounded-lg border border-ink-100">
                  {fromRegister.map((player) => (
                    <li key={player.id} className="border-b border-ink-100 last:border-b-0">
                      <PlayerResultButton player={player} onSelect={handleSelect} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {showFreeText && (
              <button
                type="button"
                onClick={() => handleSelect(trimmedQuery)}
                className="w-full rounded-lg border border-dashed border-ink-200 px-3 py-2.5 text-left text-sm text-ink-700 transition hover:border-brand-300 hover:bg-brand-50"
              >
                Use “{trimmedQuery}” as typed
                <span className="mt-0.5 block text-xs font-normal text-ink-500">
                  Not in the register — note will be saved under this name
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
