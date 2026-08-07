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

function PlayersTable({
  players,
  onSelect,
}: {
  players: NotePlayerResult[]
  onSelect: (name: string) => void
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-ink-100 px-3 py-2.5">
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 shrink-0 text-ink-700"
          fill="currentColor"
        >
          <path d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z" />
        </svg>
        <h3 className="text-sm font-semibold text-ink-800">Players</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-ink-200 text-ink-900">
              <th scope="col" className="px-3 py-2 font-semibold">
                Name
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                County
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Grades
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                BE Number
              </th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.id}
                className="border-b border-ink-100 last:border-b-0 hover:bg-ink-50"
              >
                <td className="px-3 py-2.5 align-middle">
                  <button
                    type="button"
                    onClick={() => onSelect(player.name)}
                    className="text-left font-medium text-brand-700 underline underline-offset-2 hover:text-brand-800"
                  >
                    {player.name}
                  </button>
                </td>
                <td className="px-3 py-2.5 align-middle text-ink-800">{player.county || ''}</td>
                <td className="px-3 py-2.5 align-middle">
                  <GradeBoxes grades={player.grades} />
                </td>
                <td className="px-3 py-2.5 align-middle tabular-nums text-ink-800">
                  {player.beNumber}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
  const showFreeText =
    trimmedQuery.length >= 2 &&
    !players.some((player) => player.name.toLowerCase() === trimmedQuery.toLowerCase())

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
      size="lg"
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
          County, grades, and BE number help you pick the right person when names look similar.
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
        ) : players.length === 0 && !showFreeText ? (
          <p className="text-sm text-ink-600">No players match your search. Try another spelling or BE number.</p>
        ) : (
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {players.length > 0 && (
              <>
                {trimmedQuery.length < 2 && (
                  <p className="text-xs text-ink-500">
                    Your most recent opponents are shown below. Search above to find anyone else.
                  </p>
                )}
                <PlayersTable players={players} onSelect={handleSelect} />
              </>
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
