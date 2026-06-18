import type { CountyProgramSeason, CountySeasonData } from '../../lib/countySeason'
import { formatDisplayDate } from '../../lib/formatDate'
import { TournamentCategoryChip } from '../tournament/TournamentCategoryChip'

type Props = {
  countySeason: CountySeasonData
}

function ProgramBlock({ program }: { program: CountyProgramSeason }) {
  const decided = program.wins + program.losses
  const winRate = decided > 0 ? Math.round((program.wins / decided) * 100) : null

  return (
    <article className="rounded-xl border border-ink-100 bg-ink-50/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h5 className="text-sm font-semibold text-ink-900">{program.programLabel}</h5>
        <TournamentCategoryChip label="County" />
      </div>

      <p className="mt-3 text-sm text-ink-800">
        Representing <span className="font-semibold text-ink-900">{program.countyName}</span>
        {' · '}most appearances for{' '}
        <span className="font-semibold text-ink-900">{program.primaryTeam}</span>
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-ink-100 bg-white px-3 py-2.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">Your record</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-ink-900">
            {program.wins}W · {program.losses}L
          </p>
          {winRate != null ? (
            <p className="mt-0.5 text-xs text-gain-700">{winRate}% win rate</p>
          ) : null}
        </div>

        <div className="rounded-lg border border-ink-100 bg-white px-3 py-2.5 sm:col-span-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Team in the league
          </p>
          <p className="mt-1 text-sm font-medium text-ink-900">{program.leagueSummary}</p>
          <p className="mt-0.5 text-xs text-ink-600">
            {program.fixtures} {program.fixtures === 1 ? 'fixture' : 'fixtures'} on your sheet this
            season
          </p>
        </div>
      </div>

      {program.partners.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Who you played with
          </p>
          <ul className="mt-2 space-y-1.5">
            {program.partners.map((partner) => (
              <li key={partner.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-ink-900">{partner.name}</span>
                <span className="text-ink-600">
                  {partner.matchCount} {partner.matchCount === 1 ? 'match' : 'matches'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {program.highlights.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-ink-500">
            Standout moments
          </p>
          {program.highlights.map((highlight) => (
            <div
              key={`${highlight.date}-${highlight.headline}`}
              className="rounded-lg border border-brand-200/70 bg-white px-3 py-2.5"
            >
              <p className="text-sm font-semibold text-brand-800">{highlight.headline}</p>
              <p className="mt-1 text-sm text-ink-700">{highlight.detail}</p>
              <p className="mt-1 text-xs text-ink-500">{formatDisplayDate(highlight.date)}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export function SeasonCountyCard({ countySeason }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2.5 text-sm text-amber-950">
        <p className="font-medium">Illustrative county details</p>
        <p className="mt-1 text-amber-900/90">{countySeason.disclaimer}</p>
      </div>

      {countySeason.programs.map((program) => (
        <ProgramBlock key={program.program} program={program} />
      ))}
    </div>
  )
}
