type Props = {
  label: string | null | undefined
  className?: string
}

type AgeFamily = 'junior' | 'senior' | 'masters'

const FAMILY_CLASS: Record<AgeFamily, string> = {
  junior: 'bg-age-junior-wash text-age-junior-ink ring-age-junior-ink',
  senior: 'bg-age-senior-wash text-age-senior-ink ring-age-senior-ink',
  masters: 'bg-age-masters-wash text-age-masters-ink ring-age-masters-ink',
}

/** U-bands share Junior; O-bands share Masters. Senior is its own family. */
export function competitionAgeFamily(label: string): AgeFamily | null {
  const upper = label.trim().toUpperCase()
  if (upper === 'JUNIOR' || /^U\d+$/.test(upper)) return 'junior'
  if (upper === 'SENIOR') return 'senior'
  if (upper === 'MASTER' || upper === 'MASTERS' || /^O\d+$/.test(upper)) return 'masters'
  return null
}

function competitionAgeChipLabel(label: string): string {
  return label.trim().toLowerCase() === 'masters' ? 'Master' : label
}

/** Compact age tag for Junior / Senior / Masters or a more specific band (U19, O40). */
export function CompetitionAgeChip({ label, className = '' }: Props) {
  if (!label) return null

  const family = competitionAgeFamily(label)
  const subAge = /^[UO]\d+$/i.test(label.trim())
  const tone = family
    ? `${FAMILY_CLASS[family]} ring-1 ring-inset`
    : 'bg-ink-100 text-ink-800'
  const padding = subAge ? 'px-[5px]' : 'px-1.5'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded py-1 text-[10px] font-semibold leading-none ${padding} ${tone} ${className}`}
    >
      {competitionAgeChipLabel(label)}
    </span>
  )
}
