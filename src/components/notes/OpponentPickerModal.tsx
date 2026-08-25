import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../ui/Modal'
import { searchNotePlayers, type NotePlayerResult } from '../../lib/notePlayerSearch'
import { OpponentRatingChips } from './OpponentRatingChips'

type Props = {
  open: boolean
  onClose: () => void
  opponents: string[]
  onSelect: (opponentName: string) => void
  /** When true, wipe the search box (flow closed). Leave false while composing so Back can restore it. */
  clearSearch?: boolean
}

const INITIAL_RECENT_COUNT = 8

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
      <span className="text-sm font-medium text-brand-700">{player.name}</span>
      <span className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-ink-600">
        <OpponentRatingChips opponentName={player.name} size="compact" />
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

export function OpponentPickerModal({
  open,
  onClose,
  opponents,
  onSelect,
  clearSearch = true,
}: Props) {
  const [query, setQuery] = useState('')
  const [showAllRecent, setShowAllRecent] = useState(false)

  useEffect(() => {
    if (!clearSearch) return
    setQuery('')
    setShowAllRecent(false)
  }, [clearSearch])

  const { fromHistory, fromRegister } = useMemo(
    () => searchNotePlayers(query, opponents),
    [opponents, query],
  )

  const trimmedQuery = query.trim()
  const isBrowsingRecent = trimmedQuery.length < 2

  const players = useMemo(() => {
    if (!isBrowsingRecent) {
      return [...fromHistory, ...fromRegister]
    }
    if (showAllRecent) return fromHistory
    return fromHistory.slice(0, INITIAL_RECENT_COUNT)
  }, [fromHistory, fromRegister, isBrowsingRecent, showAllRecent])

  const canShowMore =
    isBrowsingRecent && !showAllRecent && fromHistory.length > INITIAL_RECENT_COUNT

  function handleClose() {
    setQuery('')
    setShowAllRecent(false)
    onClose()
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
            onChange={(event) => {
              setQuery(event.target.value)
              setShowAllRecent(false)
            }}
            placeholder="Search for any player…"
            autoFocus
            className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {opponents.length === 0 && isBrowsingRecent ? (
          <p className="text-sm text-ink-600">
            Type at least 2 letters to search the player register.
          </p>
        ) : players.length === 0 ? (
          <p className="text-sm text-ink-600">
            No players match your search. Try another spelling or BE number.
          </p>
        ) : (
          <ul className="max-h-56 overflow-y-auto rounded-lg border border-ink-100">
            {players.map((player) => (
              <li key={player.id} className="border-b border-ink-100">
                <PlayerResultButton player={player} onSelect={onSelect} />
              </li>
            ))}
            {canShowMore && (
              <li className="border-t border-ink-100">
                <button
                  type="button"
                  onClick={() => setShowAllRecent(true)}
                  className="w-full px-3 py-2.5 text-center text-sm font-medium text-brand-700 transition hover:bg-brand-50"
                >
                  Show more
                </button>
              </li>
            )}
          </ul>
        )}
      </div>
    </Modal>
  )
}
