import { useEffect, useState } from 'react'
import {
  DRAW_COMPANION_BUILD_STAGES,
  DRAW_COMPANION_BUILD_STAGE_META,
  type DrawCompanionBuildStage,
} from '../../lib/drawCompanionBuildStage'
import {
  cambridgeTournamentPage,
  osSeniorsFinalsMatches,
  TOURNAMENT_PAGE_CATEGORIES,
  type MockBracketMatch,
  type MockBracketPlayer,
  type TournamentPageVisibility,
} from '../../lib/tournamentPageMockData'
import { DrawCompanionContent } from './DrawCompanionContent'
import {
  DrawCompanionStageBar,
  type TournamentPageStage,
} from './DrawCompanionStageBar'

type Props = {
  visibility: TournamentPageVisibility
  playerName: string
  onSignUpPremium?: () => void
}

function ScoreCells({ player }: { player: MockBracketPlayer }) {
  return (
    <div className="flex items-center gap-1">
      {player.scores.map((score, index) => (
        <span
          key={index}
          className={`min-w-[1.25rem] text-right text-xs tabular-nums ${
            player.winner ? 'font-semibold text-ink-900' : 'text-ink-500'
          }`}
        >
          {score}
        </span>
      ))}
    </div>
  )
}

function BracketMatchCard({ match }: { match: MockBracketMatch }) {
  return (
    <div className="rounded-lg border-2 border-brand-500/80 bg-white px-2.5 py-2 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`truncate text-sm ${
              match.top.winner ? 'font-semibold text-ink-900' : 'text-ink-700'
            }`}
          >
            {match.top.name}
          </p>
          {match.top.groupLabel && (
            <p className="text-[10px] text-ink-400">{match.top.groupLabel}</p>
          )}
        </div>
        <ScoreCells player={match.top} />
      </div>
      <div className="my-1.5 border-t border-ink-100" />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`truncate text-sm ${
              match.bottom.winner ? 'font-semibold text-ink-900' : 'text-ink-700'
            }`}
          >
            {match.bottom.name}
          </p>
          {match.bottom.groupLabel && (
            <p className="text-[10px] text-ink-400">{match.bottom.groupLabel}</p>
          )}
        </div>
        <ScoreCells player={match.bottom} />
      </div>
    </div>
  )
}

function BracketColumn({
  title,
  matches,
}: {
  title: string
  matches: MockBracketMatch[]
}) {
  return (
    <div className="min-w-[11rem] flex-1 space-y-3">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-ink-600">
        {title}
      </p>
      <div className="flex flex-col justify-around gap-4">
        {matches.map((match) => (
          <BracketMatchCard key={match.id} match={match} />
        ))}
      </div>
    </div>
  )
}

function KnockoutBracket() {
  const qf = osSeniorsFinalsMatches.filter((m) => m.round === 'qf')
  const sf = osSeniorsFinalsMatches.filter((m) => m.round === 'sf')
  const final = osSeniorsFinalsMatches.filter((m) => m.round === 'f')

  return (
    <section>
      <h3 className="mb-3 text-base font-bold text-ink-900">OS Seniors</h3>
      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-[36rem] gap-4">
          <BracketColumn title="Quarter Finals" matches={qf} />
          <BracketColumn title="Semi Finals" matches={sf} />
          <BracketColumn title="Final" matches={final} />
        </div>
      </div>
    </section>
  )
}

function StagePlaceholder({ stage }: { stage: 'Entries' | 'Groups' }) {
  return (
    <section className="rounded-xl border border-dashed border-ink-200 bg-white px-4 py-8 text-center">
      <p className="text-sm font-medium text-ink-700">{stage} content</p>
      <p className="mt-1 text-xs text-ink-500">
        Mock only — this stage is not populated in the preview.
      </p>
    </section>
  )
}

export function TournamentPageMock({
  visibility,
  playerName,
  onSignUpPremium,
}: Props) {
  const t = cambridgeTournamentPage
  const [stage, setStage] = useState<TournamentPageStage>('Companion')
  const [buildStage, setBuildStage] = useState<DrawCompanionBuildStage>(2)

  useEffect(() => {
    if (visibility === 'hidden' && stage === 'Companion') {
      setStage('Finals')
    }
  }, [visibility, stage])

  const contentStage: TournamentPageStage =
    visibility === 'hidden' ? 'Finals' : stage
  const showBuildStagePicker = visibility !== 'hidden'

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <p className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs text-ink-600">
        Simulated tournament page. Draw companion appears as a stage chip for Premium
        and gift visitors — selecting it swaps the page content below (not a modal).
        Use the ticket build control above the discipline tabs to screenshot each
        engineering ticket.
      </p>

      {/* Tournament info card */}
      <article className="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-md">
        <div className="flex items-start justify-between gap-3 px-4 pb-2 pt-4 sm:px-5">
          <h2 className="text-lg font-bold text-ink-900 sm:text-xl">{t.name}</h2>
          <button
            type="button"
            className="rounded-lg p-2 text-brand-600 hover:bg-brand-50"
            aria-label="Share (mock)"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
              <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
            </svg>
          </button>
        </div>

        <div className="grid gap-4 px-4 pb-4 sm:grid-cols-2 sm:px-5">
          <div className="space-y-2 text-sm text-ink-700">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <span aria-hidden>📅</span> {t.dateLabel}
            </p>
            <div className="flex flex-wrap gap-2">
              {t.badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    badge.tone === 'green'
                      ? 'bg-court-100 text-court-700'
                      : 'bg-loss-100 text-loss-700'
                  }`}
                >
                  {badge.label}
                </span>
              ))}
            </div>
            <p>
              Total Entries: <span className="font-semibold">{t.totalEntries}</span>
            </p>
            <p>
              Avg. Grade:{' '}
              <span className="font-semibold text-brand-700">{t.avgGrade}</span>
            </p>
          </div>
          <div className="space-y-1 text-sm text-ink-700">
            <p className="font-medium text-ink-900">{t.venue}</p>
            <p>{t.address}</p>
            <p className="flex items-center gap-1.5 text-ink-500">
              <span aria-hidden>🚗</span> {t.travelMins} min
            </p>
          </div>
        </div>

        <a
          href={t.beUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 border-t border-ink-100 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
        >
          View on BE website
          <span aria-hidden>↗</span>
        </a>
      </article>

      {showBuildStagePicker && (
        <div className="rounded-lg border border-dashed border-brand-200 bg-brand-50/40 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-brand-800">Ticket build:</span>
            <div
              role="group"
              aria-label="Draw companion ticket build stage"
              className="flex flex-wrap gap-1"
            >
              {DRAW_COMPANION_BUILD_STAGES.map((ticketStage) => {
                const selected = buildStage === ticketStage
                const meta = DRAW_COMPANION_BUILD_STAGE_META[ticketStage]
                return (
                  <button
                    key={ticketStage}
                    type="button"
                    title={meta.summary}
                    onClick={() => {
                      setBuildStage(ticketStage)
                      setStage('Companion')
                    }}
                    className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      selected
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-white text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50'
                    }`}
                  >
                    {ticketStage}. {meta.shortLabel}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="mt-1.5 text-[11px] text-ink-500">
            {DRAW_COMPANION_BUILD_STAGE_META[buildStage].summary}
          </p>
        </div>
      )}

      {/* Category tabs */}
      <div className="border-b border-ink-200">
        <div className="flex gap-1 overflow-x-auto" role="tablist" aria-label="Categories">
          {TOURNAMENT_PAGE_CATEGORIES.map((cat) => {
            const selected = cat.code === 'all'
            return (
              <button
                key={cat.code}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${
                  selected
                    ? 'border-ink-900 text-ink-900'
                    : 'border-transparent text-ink-500'
                }`}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <DrawCompanionStageBar
        visibility={visibility}
        selectedStage={contentStage}
        onSelectStage={setStage}
      />

      {contentStage === 'Companion' ? (
        <section className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
          <DrawCompanionContent
            visibility={visibility}
            playerName={playerName}
            onSignUpPremium={onSignUpPremium}
            buildStage={buildStage}
          />
        </section>
      ) : contentStage === 'Finals' ? (
        <KnockoutBracket />
      ) : (
        <StagePlaceholder stage={contentStage} />
      )}
    </div>
  )
}
