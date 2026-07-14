import { useCallback, useEffect, useRef, useState } from 'react'
import { DisciplineChip } from '../discipline/DisciplineChip'
import { OpponentStyleNoteSection } from '../notes/NoteTagPicker'
import { SCOUTING_STARTER_CHIPS } from '../../lib/customNoteTags'

const FAKE_OPPONENTS = ['Riley Hart', 'Morgan Blake'] as const
const SELECTED_OPPONENT = FAKE_OPPONENTS[0]

const TAG_SEQUENCE = [SCOUTING_STARTER_CHIPS[0], SCOUTING_STARTER_CHIPS[1]] as const

const TYPED_BODY = 'Flicks a lot, stand slightly back.'

const CYCLE_MS = 7500
const START_DELAY_MS = 120

const EMPTY_DEMO = {
  body: '',
  selectedCustom: [] as string[],
  emphasizeAddLabel: null as string | null,
}

type Props = {
  active?: boolean
}

export function PremiumNotesCaptureDemo({ active = true }: Props) {
  const [body, setBody] = useState(EMPTY_DEMO.body)
  const [selectedCustom, setSelectedCustom] = useState(EMPTY_DEMO.selectedCustom)
  const [emphasizeAddLabel, setEmphasizeAddLabel] = useState(EMPTY_DEMO.emphasizeAddLabel)
  const [runId, setRunId] = useState(0)
  const timersRef = useRef<number[]>([])
  const runGenerationRef = useRef(0)

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const resetDemo = useCallback(() => {
    setBody(EMPTY_DEMO.body)
    setSelectedCustom(EMPTY_DEMO.selectedCustom)
    setEmphasizeAddLabel(EMPTY_DEMO.emphasizeAddLabel)
  }, [])

  const startAnimation = useCallback(() => {
    clearTimers()
    resetDemo()
    runGenerationRef.current += 1
    const generation = runGenerationRef.current
    setRunId((id) => id + 1)

    const schedule = (delay: number, fn: () => void) => {
      timersRef.current.push(
        window.setTimeout(() => {
          if (runGenerationRef.current !== generation) return
          fn()
        }, delay),
      )
    }

    schedule(START_DELAY_MS + 350, () => setEmphasizeAddLabel(TAG_SEQUENCE[0]))
    schedule(START_DELAY_MS + 700, () => {
      setEmphasizeAddLabel(null)
      setSelectedCustom([TAG_SEQUENCE[0]])
    })

    schedule(START_DELAY_MS + 1150, () => setEmphasizeAddLabel(TAG_SEQUENCE[1]))
    schedule(START_DELAY_MS + 1500, () => {
      setEmphasizeAddLabel(null)
      setSelectedCustom([...TAG_SEQUENCE])
    })

    schedule(START_DELAY_MS + 1900, () => {
      for (let index = 0; index < TYPED_BODY.length; index += 1) {
        schedule(START_DELAY_MS + 1950 + index * 45, () => {
          setBody(TYPED_BODY.slice(0, index + 1))
        })
      }
    })
  }, [clearTimers, resetDemo])

  useEffect(() => {
    if (!active) {
      clearTimers()
      runGenerationRef.current += 1
      resetDemo()
      return
    }

    const kickoff = window.setTimeout(() => {
      requestAnimationFrame(() => startAnimation())
    }, START_DELAY_MS)

    return () => {
      window.clearTimeout(kickoff)
      clearTimers()
      runGenerationRef.current += 1
    }
  }, [active, clearTimers, resetDemo, startAnimation])

  useEffect(() => {
    if (!active) return
    const interval = window.setInterval(() => startAnimation(), CYCLE_MS)
    return () => window.clearInterval(interval)
  }, [active, startAnimation])

  return (
    <div
      className="card-frame flex h-full flex-col overflow-hidden bg-white ring-2 ring-brand-200 ring-inset"
      aria-hidden
    >
      <div className="min-h-0 flex-1 overflow-hidden px-4 py-3 sm:px-5">
        <div className="space-y-3">
          <div
            className="flex w-full gap-1 rounded-lg border border-ink-200 bg-ink-50 p-1"
            role="tablist"
            aria-hidden
          >
            {FAKE_OPPONENTS.map((name) => (
              <span
                key={name}
                className={`min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-center text-xs font-medium leading-snug ${
                  name === SELECTED_OPPONENT
                    ? 'bg-white text-ink-900 shadow-sm'
                    : 'text-ink-600'
                }`}
              >
                {name}
              </span>
            ))}
            <span className="min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-center text-xs font-medium leading-snug text-ink-600">
              The pair
            </span>
          </div>

          <OpponentStyleNoteSection
            key={runId}
            body={body}
            onBodyChange={setBody}
            selected={[]}
            onSelectedChange={() => {}}
            selectedCustom={selectedCustom}
            onSelectedCustomChange={setSelectedCustom}
            playerName={null}
            emphasizeAddLabel={emphasizeAddLabel}
          />

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-ink-500">
            <span>Applies to:</span>
            <DisciplineChip code="XD" />
            <span className="font-medium text-brand-600">Change</span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 justify-end gap-2 border-t border-ink-100 px-4 py-2.5 sm:px-5">
        <span className="rounded-lg border border-ink-100 px-3 py-1.5 text-sm text-ink-700">
          Cancel
        </span>
        <span className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white">
          Save
        </span>
      </div>
    </div>
  )
}
