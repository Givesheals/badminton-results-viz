import type { ReactNode } from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  filters: ReactNode
  className?: string
  bordered?: boolean
}

/** Title and description on top; filters full-width on the row below (stable expand/collapse). */
export function SectionHeaderWithFilters({
  title,
  description,
  filters,
  className = '',
  bordered = false,
}: Props) {
  return (
    <div
      className={`space-y-3 ${bordered ? 'border-b border-ink-100 pb-3' : ''} ${className}`.trim()}
    >
      {(title != null || description != null) && (
        <div className="space-y-1">
          {title}
          {description}
        </div>
      )}
      <div className="w-full min-w-0">{filters}</div>
    </div>
  )
}
