import type { CountyProgramKind } from '../../lib/countySeason'

type Props = {
  shortName: string
  /** Senior county stays the blue County chip; shires / junior county is green. */
  program: CountyProgramKind
  className?: string
}

export function CountyAffiliationChip({ shortName, program, className = '' }: Props) {
  const chipClass =
    program === 'shires'
      ? 'bg-level-shires font-semibold text-white'
      : 'bg-level-county font-semibold text-white'

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs leading-none ${chipClass} ${className}`}
      title={program === 'shires' ? 'Shires league' : 'County'}
    >
      {shortName}
    </span>
  )
}
