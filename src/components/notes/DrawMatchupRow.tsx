import type { ReactNode } from 'react'
import type { MatchupIntelTeaser } from '../../lib/drawScout'
import { formatMatchResultOutcome } from '../../lib/drawScout'
import type { DrawMatchResult, DrawMatchup, DrawPlayer } from '../../lib/drawTypes'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { DrawPairNames } from './DrawPairNames'

export const DRAW_MATCHUP_GRID =
  'grid grid-cols-[5rem_1fr_1fr] items-start gap-x-3 gap-y-1.5'

/**
 * Condensed two-side layout: fixed-width columns for your side + opponents,
 * leftover space on the right so teams stay close and align across cards
 * (with or without a chevron column).
 */
const DRAW_SIDES_GRID =
  'grid grid-cols-[9.75rem_9.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 sm:grid-cols-[11rem_11rem_minmax(0,1fr)]'

function formatOpponentLine(players: DrawPlayer[]): string {
  return players
    .map((player) => {
      const seed = player.seedLabel ? `${player.seedLabel} ` : ''
      return `${seed}${player.name}`
    })
    .join(' & ')
}

function PlayerNames({
  players,
  compact = false,
}: {
  players: DrawPlayer[]
  compact?: boolean
}) {
  // Compact played cards: one line when it fits; wrap only between partners.
  if (compact) {
    return (
      <p className="text-xs leading-snug text-ink-800">
        {players.map((player, index) => (
          <span key={player.name}>
            <span className="whitespace-nowrap">
              {player.seedLabel && (
                <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
              )}
              {player.name}
            </span>
            {index < players.length - 1 ? <span className="text-ink-400"> & </span> : null}
          </span>
        ))}
      </p>
    )
  }

  return (
    <div className="space-y-0.5">
      {players.map((player, index) => (
        <div
          key={player.name}
          className="text-xs leading-snug text-ink-900 sm:text-[13px]"
        >
          {player.seedLabel && (
            <span className="mr-1 font-semibold text-ink-500">{player.seedLabel}</span>
          )}
          {player.name}
          {player.rating != null ? (
            <span className="tabular-nums text-ink-500"> ({player.rating})</span>
          ) : null}
          {index < players.length - 1 && <span className="text-ink-400"> &</span>}
        </div>
      ))}
    </div>
  )
}

function ChevronIcon({ open, compact = false }: { open: boolean; compact?: boolean }) {
  return (
    <svg
      className={`shrink-0 text-ink-500 transition ${compact ? 'h-4 w-4' : 'h-5 w-5'} ${
        open ? 'rotate-180' : ''
      }`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.94a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function NotesBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-notes-amber/35 bg-notes-amber-soft px-1.5 py-0.5 text-[11px] font-semibold leading-none text-notes-amber-ink">
      {label}
    </span>
  )
}

function GamesBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-ink-200 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-ink-600">
      {label}
    </span>
  )
}

function ResultInline({ result }: { result: DrawMatchResult }) {
  const isWin = result.outcome === 'win'
  return (
    <p className="text-[11px] leading-tight">
      <span className={`font-bold uppercase tracking-wide ${isWin ? 'text-emerald-700' : 'text-ink-500'}`}>
        {formatMatchResultOutcome(result.outcome)}
      </span>
      <span className="mx-1 text-ink-300" aria-hidden>
        ·
      </span>
      <span className="font-semibold tabular-nums text-ink-800">{result.scoreSummary}</span>
    </p>
  )
}

/**
 * Compact played-row intel: same amber/ink pill chrome as upcoming cards,
 * with shorter labels so completed rows stay dense.
 */
function PlayedIntelMicro({ teaser }: { teaser: MatchupIntelTeaser }) {
  const gamesCount = teaser.gamesLabel?.match(/\d+/)?.[0] ?? null
  if (teaser.notesCta == null && gamesCount == null) return null

  return (
    <span className="inline-flex shrink-0 flex-nowrap items-center gap-1">
      {teaser.notesCta != null ? <NotesBadge label="Notes" /> : null}
      {gamesCount != null ? <GamesBadge label={`×${gamesCount}`} /> : null}
    </span>
  )
}

/**
 * Upcoming teasers under opponent-only cards (notes + games in one row).
 */
function UpcomingIntelTeaserLine({ teaser }: { teaser: MatchupIntelTeaser }) {
  return (
    <div className="mt-1.5 flex flex-nowrap items-center gap-1.5">
      {teaser.notesCta != null ? <NotesBadge label={teaser.notesCta} /> : null}
      {teaser.gamesLabel != null ? <GamesBadge label={teaser.gamesLabel} /> : null}
    </div>
  )
}

/**
 * Played result row: opponent only (no repeated your-side), single-line names,
 * result + micro intel on one strip — much lower visual weight than upcoming cards.
 */
function PlayedMatchupBody({
  matchup,
  teaser,
}: {
  matchup: DrawMatchup
  teaser?: MatchupIntelTeaser | null
}) {
  const result = matchup.result!
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <ResultInline result={result} />
        {teaser != null ? <PlayedIntelMicro teaser={teaser} /> : null}
      </div>
      <p className="mt-0.5 truncate text-xs leading-snug text-ink-700">
        {formatOpponentLine(matchup.opponentSide)}
      </p>
    </div>
  )
}

/**
 * Unplayed / definite up-next: opponents only — your side lives under the
 * discipline title for doubles/mixed, so repeating it here is redundant.
 */
function UpcomingOpponentBody({
  matchup,
  teaser,
  showEmptyHint = false,
}: {
  matchup: DrawMatchup
  teaser?: MatchupIntelTeaser | null
  showEmptyHint?: boolean
}) {
  return (
    <div className="min-w-0">
      <DrawPairNames players={matchup.opponentSide} />
      {teaser != null ? (
        <UpcomingIntelTeaserLine teaser={teaser} />
      ) : showEmptyHint ? (
        <p className="mt-1.5 text-xs text-ink-400">No notes or games yet</p>
      ) : null}
    </div>
  )
}

type ExpandableProps = {
  open: boolean
  onToggle: () => void
  /** Always-visible collapsed teaser (notes pill and/or games label). */
  teaser: MatchupIntelTeaser
}

type Props = {
  matchup: DrawMatchup
  /** When set, uses the three-column draw-email layout with a round label column. */
  label?: string
  /** Expanded content under the matchup (notes / history). */
  notes?: ReactNode
  /** When set, the whole matchup row toggles expand/collapse. */
  expandable?: ExpandableProps
  /** Discipline for the header-only left edge accent. */
  disciplineCode?: string
  /**
   * Compact played-result layout: opponent-only, result strip, micro intel.
   * Defaults to true when `matchup.result` is set.
   */
  compactResult?: boolean
  /**
   * High-weight status under opponent names (e.g. still in another discipline).
   * Only shown on unplayed / definite upcoming cards — never on compact played rows.
   */
  statusBanner?: ReactNode
}

/**
 * Draw matchup row. Draw companion cards (no `label`): played and unplayed both show
 * opponents only. With `label`, keeps the three-column draw-email layout.
 */
export function DrawMatchupRow({
  label,
  matchup,
  notes,
  expandable,
  disciplineCode,
  compactResult,
  statusBanner,
}: Props) {
  const played = matchup.result != null
  const useCompact = compactResult ?? played
  const result = matchup.result
  const useCondensedSides = label == null
  const usePlayedCompact = useCompact && played && useCondensedSides
  const useUpcomingOpponentOnly = useCondensedSides && !played
  const visibleStatusBanner = !played ? statusBanner : null

  const sides =
    label != null ? (
      <>
        <p className="text-xs font-medium text-ink-500">{label}</p>
        <PlayerNames players={matchup.yourSide} compact={useCompact} />
        <PlayerNames players={matchup.opponentSide} compact={useCompact} />
      </>
    ) : (
      <>
        <PlayerNames players={matchup.yourSide} compact={useCompact} />
        <PlayerNames players={matchup.opponentSide} compact={useCompact} />
        <div aria-hidden className="min-w-0" />
      </>
    )

  const gridClass = label != null ? DRAW_MATCHUP_GRID : DRAW_SIDES_GRID
  const notesSpan = 'col-span-3'
  const disciplineStyle = getDisciplineStyle(disciplineCode ?? '')
  const paddingClass = usePlayedCompact ? 'px-3 py-1.5' : useCompact ? 'px-3 py-1.5' : 'px-3 py-3'
  const chevronWidth = usePlayedCompact || useCompact ? 'w-8' : 'w-11'

  // Played rows: flatter chrome so completed games sit below the next-round focus.
  const cardShell = usePlayedCompact
    ? 'overflow-hidden rounded-lg border border-ink-100/90 bg-white'
    : 'overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm'

  if (expandable != null) {
    return (
      <div className={cardShell}>
        <button
          type="button"
          onClick={expandable.onToggle}
          aria-expanded={expandable.open}
          className={`flex w-full items-stretch gap-2 rounded-r border-l-4 text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200 ${disciplineStyle.borderClass}`}
        >
          <div className={`min-w-0 flex-1 ${paddingClass}`}>
            {usePlayedCompact ? (
              <PlayedMatchupBody matchup={matchup} teaser={expandable.teaser} />
            ) : useUpcomingOpponentOnly ? (
              <>
                <UpcomingOpponentBody matchup={matchup} teaser={expandable.teaser} />
                {visibleStatusBanner}
              </>
            ) : (
              <>
                <div className={gridClass}>{sides}</div>
                {useCondensedSides ? (
                  result != null ? (
                    <div className={`mt-1 ${DRAW_SIDES_GRID}`}>
                      <ResultInline result={result} />
                      <div className="flex min-w-0 flex-wrap items-center gap-1">
                        {expandable.teaser.notesCta != null ? (
                          <NotesBadge label={expandable.teaser.notesCta} />
                        ) : null}
                        {expandable.teaser.gamesLabel != null ? (
                          <GamesBadge label={expandable.teaser.gamesLabel} />
                        ) : null}
                      </div>
                      <div aria-hidden className="min-w-0" />
                    </div>
                  ) : (
                    <>
                      <UpcomingIntelTeaserLine teaser={expandable.teaser} />
                      {visibleStatusBanner}
                    </>
                  )
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                    {result != null && <ResultInline result={result} />}
                    {expandable.teaser.notesCta != null && (
                      <NotesBadge label={expandable.teaser.notesCta} />
                    )}
                    {expandable.teaser.gamesLabel != null && (
                      <GamesBadge label={expandable.teaser.gamesLabel} />
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <span
            className={`flex ${chevronWidth} shrink-0 items-center justify-center border-l border-ink-100 ${
              usePlayedCompact ? 'bg-transparent' : 'bg-ink-50/70'
            }`}
            aria-hidden
          >
            <ChevronIcon open={expandable.open} compact={usePlayedCompact || useCompact} />
          </span>
        </button>
        {expandable.open && notes != null && (
          <div className="space-y-2 border-t border-ink-100 bg-ink-50/40 px-3 py-3">{notes}</div>
        )}
      </div>
    )
  }

  // Static card: no chevron panel (nothing to open).
  return (
    <div className={cardShell}>
      <div className={`rounded-r border-l-4 ${paddingClass} ${disciplineStyle.borderClass}`}>
        {usePlayedCompact ? (
          <PlayedMatchupBody matchup={matchup} />
        ) : useUpcomingOpponentOnly ? (
          <>
            <UpcomingOpponentBody matchup={matchup} showEmptyHint />
            {visibleStatusBanner}
            {notes != null && <div className="mt-2 space-y-2">{notes}</div>}
          </>
        ) : (
          <>
            <div className={gridClass}>{sides}</div>
            {result != null ? (
              <div className={`mt-1 ${DRAW_SIDES_GRID}`}>
                <ResultInline result={result} />
                <div aria-hidden />
                <div aria-hidden />
              </div>
            ) : (
              !played && (
                <div className={`mt-1 ${DRAW_SIDES_GRID}`}>
                  <p className="text-xs text-ink-400">No notes or games yet</p>
                  <div aria-hidden />
                  <div aria-hidden />
                </div>
              )
            )}
            {visibleStatusBanner}
            {notes != null && <div className={`${notesSpan} mt-2 space-y-2`}>{notes}</div>}
          </>
        )}
      </div>
    </div>
  )
}
