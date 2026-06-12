import type { ReactNode } from 'react'

type Props = {
  title?: ReactNode
  description?: ReactNode
  filters: ReactNode
  titleActions?: ReactNode
  className?: string
  bordered?: boolean
}

/** Title and description on top; filters full-width on the row below (stable expand/collapse). */
export function SectionHeaderWithFilters({
  title,
  description,
  filters,
  titleActions,
  className = '',
  bordered = false,
}: Props) {
  return (
    <div
      className={`space-y-3 ${bordered ? 'border-b border-ink-100 pb-3' : ''} ${className}`.trim()}
    >
      {(title != null || description != null || titleActions != null) && (
        <div className="space-y-1">
          {title != null || titleActions != null ? (
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                {title}
                {description}
              </div>
              {titleActions ? (
                <div className="shrink-0 pt-0.5">{titleActions}</div>
              ) : null}
            </div>
          ) : (
            description
          )}
        </div>
      )}
      <div className="w-full min-w-0">{filters}</div>
    </div>
  )
}
