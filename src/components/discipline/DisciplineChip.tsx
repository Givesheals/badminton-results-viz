import { getDisciplineStyle } from '../../lib/disciplineStyle'

type Props = {
  code: string
  className?: string
  title?: string
}

export function DisciplineChip({ code, className = '', title }: Props) {
  const style = getDisciplineStyle(code)
  const label = title ?? style.chipLabel

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${style.chipClass} ${className}`}
      title={label}
    >
      {style.chipLabel}
    </span>
  )
}
