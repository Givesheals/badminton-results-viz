import { createPortal } from 'react-dom'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import {
  currentIsoWeek,
  formatIsoWeekNumber,
  formatIsoWeekRangeLabel,
  weeksInIsoYear,
} from '../../lib/isoWeek'

type Props = {
  open: boolean
  onClose: () => void
}

/** Earliest year offered in the ranking week picker. */
const FIRST_ISO_YEAR = 2016

export function BeRankingAutomationPage({ open, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const today = useMemo(() => currentIsoWeek(), [])
  const [year, setYear] = useState(today.isoYear)
  const [week, setWeek] = useState(today.week)

  const years = useMemo(() => {
    const latest = Math.max(today.isoYear, year)
    const list: number[] = []
    for (let value = latest; value >= FIRST_ISO_YEAR; value -= 1) list.push(value)
    return list
  }, [today.isoYear, year])

  const weekCount = weeksInIsoYear(year)
  const rangeLabel = formatIsoWeekRangeLabel(year, week)

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-50 overflow-y-auto bg-white outline-none"
    >
      <header className="border-b border-ink-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <h1 id={titleId} className="text-lg font-semibold text-ink-900 sm:text-xl">
            BE Ranking Automation
          </h1>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close BE Ranking Automation"
          >
            ✕
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="max-w-xl space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <WeekSelect
              id="be-ranking-year"
              label="Year"
              value={String(year)}
              options={years.map((value) => ({
                value: String(value),
                label: String(value),
              }))}
              onChange={(next) => {
                const nextYear = Number(next)
                setYear(nextYear)
                setWeek((current) => Math.min(current, weeksInIsoYear(nextYear)))
              }}
            />
            <WeekSelect
              id="be-ranking-week"
              label="Week"
              value={formatIsoWeekNumber(week)}
              options={Array.from({ length: weekCount }, (_, index) => {
                const label = formatIsoWeekNumber(index + 1)
                return { value: label, label }
              })}
              onChange={(next) => setWeek(Number(next))}
            />
          </div>

          <p className="text-base text-ink-800">{rangeLabel}</p>

          <button
            type="button"
            className="border-0 bg-[#543391] px-[22px] py-4 text-base font-normal leading-6 text-white hover:bg-[#462d7c] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#543391] focus-visible:ring-offset-2"
          >
            Export to Excel
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function WeekSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-1 block text-xs font-medium text-ink-700">{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="w-full appearance-none rounded-lg border border-ink-200 bg-white py-2.5 pr-10 pl-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown />
      </div>
    </label>
  )
}

function ChevronDown() {
  return (
    <svg
      className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-brand-500"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}
