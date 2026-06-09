import type { FilterOption } from '../../types/filters'

type FilterSelectProps = {
  id: string
  label: string
  value: string
  allLabel: string
  options: FilterOption[]
  onChange: (value: string) => void
  disabled?: boolean
  labelVisibility?: 'sr-only' | 'visible'
  className?: string
}

export function FilterSelect({
  id,
  label,
  value,
  allLabel,
  options,
  onChange,
  disabled = false,
  labelVisibility = 'sr-only',
  className,
}: FilterSelectProps) {
  const labelClass =
    labelVisibility === 'visible'
      ? 'mb-1 block text-xs font-medium text-ink-700'
      : 'sr-only'

  return (
    <label className={`block ${className ?? ''}`.trim()} htmlFor={id}>
      <span className={labelClass}>{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-lg border border-ink-200 bg-white py-2.5 pr-10 pl-3 text-sm text-ink-900 shadow-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-ink-50 disabled:text-ink-700"
        >
          <option value="">{allLabel}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2" />
      </div>
    </label>
  )
}

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg
      className={`h-4 w-4 text-brand-500 ${className ?? ''}`}
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
