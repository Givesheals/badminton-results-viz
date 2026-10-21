export type CountyAffiliationProgram = 'shires' | 'senior-county' | 'masters-county'

type Props = {
  shortName: string
  /** Shires is green. Senior county and masters county stay the blue County chip. */
  program: CountyAffiliationProgram
  className?: string
}

const CHIP_TITLE: Record<CountyAffiliationProgram, string> = {
  shires: 'Shires league',
  'senior-county': 'Senior county',
  'masters-county': 'Masters county',
}

export function CountyAffiliationChip({ shortName, program, className = '' }: Props) {
  const chipClass =
    program === 'shires'
      ? 'bg-level-shires font-semibold text-white'
      : 'bg-level-county font-semibold text-white'

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs leading-none ${chipClass} ${className}`}
      title={CHIP_TITLE[program]}
    >
      {shortName}
    </span>
  )
}
