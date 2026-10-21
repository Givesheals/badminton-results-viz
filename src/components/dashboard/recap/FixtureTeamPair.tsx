import type { CountyFixtureSides } from '../../../lib/countyFixture'
import { CountyAffiliationChip } from '../../tournament/CountyAffiliationChip'

type Props = {
  fixture: CountyFixtureSides
}

export function FixtureTeamPair({ fixture }: Props) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap">
      <CountyAffiliationChip shortName={fixture.home} program={fixture.program} />
      <span aria-hidden className="text-xs font-medium text-ink-400">
        v
      </span>
      <CountyAffiliationChip shortName={fixture.away} program={fixture.program} />
    </span>
  )
}
