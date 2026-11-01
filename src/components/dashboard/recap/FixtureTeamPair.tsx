import type { CountyFixtureSides } from '../../../lib/countyFixture'

type Props = {
  fixture: CountyFixtureSides
}

const CHIP_TITLE = {
  shires: 'Shires league',
  'senior-county': 'Senior county',
  'masters-county': 'Masters county',
} as const

/** Production recap badges: both counties are this green, on a small pill. */
const FIXTURE_CHIP_CLASS =
  'inline-flex shrink-0 items-center rounded-full bg-[#07aa5c] px-2 py-0.5 text-[11px] font-semibold leading-none text-white'

function FixtureChip({ name, title }: { name: string; title: string }) {
  return (
    <span className={FIXTURE_CHIP_CLASS} title={title}>
      {name}
    </span>
  )
}

export function FixtureTeamPair({ fixture }: Props) {
  const title = CHIP_TITLE[fixture.program]
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <FixtureChip name={fixture.home} title={title} />
      <span aria-hidden className="text-[11px] font-medium text-ink-800">
        v
      </span>
      <FixtureChip name={fixture.away} title={title} />
    </span>
  )
}
