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
          className="inline-flex h-[1.125rem] w-[1.125rem] items-center justify-center border border-ink-800 bg-white text-[11px] font-medium leading-none text-ink-900"
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
      className="flex w-full flex-col gap-1 px-3 py-2.5 text-left transition hover:bg-brand-50"
    >
      <span className="text-sm font-medium text-brand-700 underline underline-offset-2">
        {player.name}
      </span>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-600">
        <GradeBoxes grades={player.grades} />
        <span aria-hidden className="text-ink-300">
          ·
        </span>
        <span className="tabular-nums">BE {player.beNumber}</span>
        <span aria-hidden className="text-ink-300">
          ·
        </span>
        <span>{player.county || '—'}</span>
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

  const players = useMemo(
    () => [...fromHistory, ...fromRegister],
    [fromHistory, fromRegister],
  )

  const trimmedQuery = query.trim()

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
          Search for any player by name, county, or BE number — whether you have played them or not.
        </p>
        <div>
          <label htmlFor="opponent-picker-search" className="sr-only">
            Search for any player
          </label>
          <input
            id="opponent-picker-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for any player…"
            autoFocus
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {opponents.length === 0 && trimmedQuery.length < 2 ? (
          <p className="text-sm text-ink-600">
            Type at least 2 letters to search the player register.
          </p>
        ) : players.length === 0 ? (
          <p className="text-sm text-ink-600">
            No players match your search. Try another spelling or BE number.
          </p>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {trimmedQuery.length < 2 && (
              <p className="text-xs text-ink-500">
                Your most recent opponents are shown below. Search above to find anyone else.
              </p>
            )}
            <ul className="overflow-hidden rounded-lg border border-ink-100">
              {players.map((player) => (
                <li key={player.id} className="border-b border-ink-100 last:border-b-0">
                  <PlayerResultButton player={player} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  )
}
