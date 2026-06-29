import {
  DISCIPLINE_FAMILY_LABELS,
  getDisciplineFamilyStyle,
  type SelectableDisciplineFamily,
} from '../../lib/disciplineStyle'

type Props = {
  family: SelectableDisciplineFamily
  className?: string
}

export function DisciplineFamilyChip({ family, className = '' }: Props) {
  const style = getDisciplineFamilyStyle(family)
  const label = DISCIPLINE_FAMILY_LABELS[family]

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold leading-none tracking-wide ${style.chipClass} ${className}`}
      title={label}
    >
      {label}
    </span>
  )
}
