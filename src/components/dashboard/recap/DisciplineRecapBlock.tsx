import type { CountyFixtureSides } from '../../../lib/countyFixture'
import type { DisciplineMatchRecap, DisciplineRecap } from '../../../lib/tournamentRecap'
import { getDisciplineStyle } from '../../../lib/disciplineStyle'
import { formatRatingSpan, formatWinLossRecord } from '../../../lib/formatNumbers'
import {
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../../lib/tournamentProgression'
import { DisciplineChip } from '../../discipline/DisciplineChip'
import { DisciplineMatchRow } from './DisciplineMatchRow'
import { FixtureTeamPair } from './FixtureTeamPair'
import { RecapSummaryCard } from './RecapSummaryCard'

type Props = {
  recap: DisciplineRecap
  showDisciplineCallouts?: boolean
  showMatchHighlights?: boolean
  showNotes?: boolean
}

type FixtureMatchGroup = {
  key: string
  fixture: CountyFixtureSides | null
  matches: DisciplineMatchRecap[]
}

function fixtureGroupKey(fixture: CountyFixtureSides | null): string {
  if (!fixture) return ''
  return `${fixture.program}|${fixture.home}|${fixture.away}`
}

/** Consecutive games that share a tie. Graded tournaments stay one unlabelled list. */
function fixtureMatchGroups(matches: DisciplineMatchRecap[]): FixtureMatchGroup[] {
  const groups: FixtureMatchGroup[] = []
  for (const match of matches) {
    const key = fixtureGroupKey(match.fixture)
    const last = groups[groups.length - 1]
    if (last && fixtureGroupKey(last.fixture) === key) {
      last.matches.push(match)
    } else {
      groups.push({
        key: `${key}:${match.matchKey}`,
        fixture: match.fixture,
        matches: [match],
      })
    }
  }
  return groups
}

function formatRatingDelta(delta: number): string {
  if (delta > 0) return `+${delta}`
  if (delta < 0) return String(delta)
  return '±0'
}

function DisciplineRecapHeader({ recap }: Props) {
  const stageColor =
    recap.bestStage != null
      ? PROGRESSION_STAGE_COLORS[recap.bestStage as ProgressionStage]
      : null

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <DisciplineChip code={recap.discipline} title={recap.disciplineLabel} />
            <span className="text-sm font-medium text-ink-900">{recap.disciplineLabel}</span>
          </div>
          {recap.partnerName && (
            <p className="mt-0.5 text-xs text-ink-600">
              with{' '}
              <span className="font-medium text-badminfo-link underline decoration-badminfo-link underline-offset-2">
                {recap.partnerName}
              </span>
              {recap.partnerRatingStart != null && recap.partnerRatingEnd != null && (
                <span className="font-normal tabular-nums text-ink-500">
                  {' '}
                  (
                  {recap.partnerRatingStart === recap.partnerRatingEnd
                    ? recap.partnerRatingStart
                    : formatRatingSpan(recap.partnerRatingStart, recap.partnerRatingEnd)}
                  )
                </span>
              )}
            </p>
          )}
        </div>
        {recap.ratingDelta != null && (
          <div className="shrink-0 text-right">
            <p
              className={`text-lg font-semibold tabular-nums leading-tight ${
                recap.ratingDelta > 0
                  ? 'text-gain-700'
                  : recap.ratingDelta < 0
                    ? 'text-loss-700'
                    : 'text-ink-700'
              }`}
            >
              {formatRatingDelta(recap.ratingDelta)}
              <span className="ml-1 text-xs font-normal text-ink-500">rating</span>
            </p>
            {recap.ratingStart != null && recap.ratingEnd != null && (
              <p className="text-xs tabular-nums text-ink-500">
                {formatRatingSpan(recap.ratingStart, recap.ratingEnd)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-700">
        <span>{formatWinLossRecord(recap.matchWins, recap.matchLosses)}</span>
        {recap.bestStageLabel && stageColor && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: stageColor }}
              aria-hidden
            />
            {recap.bestStageLabel}
          </span>
        )}
      </div>
    </>
  )
}

export function DisciplineRecapBlock({
  recap,
  showDisciplineCallouts = true,
  showMatchHighlights = true,
  showNotes = true,
}: Props) {
  const style = getDisciplineStyle(recap.discipline)
  const callouts = showDisciplineCallouts ? recap.eventCallouts : []
  const groups = fixtureMatchGroups(recap.matches)
  const groupedByFixture = groups.some((group) => group.fixture != null)
  const matchListClass =
    callouts.length > 0 ? 'mt-3 border-t border-ink-100/80 pt-2' : 'mt-3 border-t border-ink-200/70 pt-2'

  return (
    <article
      className={`rounded-xl card-frame border-l-4 ${style.borderClass} ${style.rowBgClass} px-3 py-3`}
    >
      {recap.showEventName && recap.eventName ? (
        <h5 className="mb-2 text-base font-semibold leading-tight text-ink-900">
          {recap.eventName}
        </h5>
      ) : null}

      <DisciplineRecapHeader recap={recap} />

      {callouts.length > 0 && (
        <div className="mt-3 space-y-2 border-t border-ink-100/80 pt-3">
          {callouts.map((callout) => (
            <RecapSummaryCard key={callout.id} card={callout} />
          ))}
        </div>
      )}

      {recap.matches.length > 0 && groupedByFixture && (
        <div className="mt-2.5 border-t border-ink-500 pt-2">
          {groups.map((group, index) => (
            <div
              key={group.key}
              className={index > 0 ? 'mt-2 border-t border-ink-400 pt-2.5' : undefined}
            >
              {group.fixture ? (
                <div className="mb-1 flex">
                  <FixtureTeamPair fixture={group.fixture} />
                </div>
              ) : null}
              <ol>
                {group.matches.map((match) => (
                  <DisciplineMatchRow
                    key={match.matchKey}
                    match={match}
                    showMatchHighlights={showMatchHighlights}
                    showNotes={showNotes}
                    separator="soft"
                  />
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {recap.matches.length > 0 && !groupedByFixture && (
        <ol className={matchListClass}>
          {recap.matches.map((match) => (
            <DisciplineMatchRow
              key={match.matchKey}
              match={match}
              showMatchHighlights={showMatchHighlights}
              showNotes={showNotes}
            />
          ))}
        </ol>
      )}
    </article>
  )
}
