import type { ReactNode } from 'react'
import type { MatchupIntelTeaser } from '../../lib/drawScout'
import { formatMatchResultOutcome } from '../../lib/drawScout'
import type { DrawMatchResult, DrawMatchup, DrawPlayer } from '../../lib/drawTypes'
import { getDisciplineStyle } from '../../lib/disciplineStyle'
import { DrawPairNames, DrawPlayerNameLink } from './DrawPairNames'

export const DRAW_MATCHUP_GRID =
  'grid grid-cols-[5rem_1fr_1fr] items-start gap-x-3 gap-y-1.5'

/**
 * Condensed two-side layout: fixed-width columns for your side + opponents,
 * leftover space on the right so teams stay close and align across cards
 * (with or without a chevron column).
 */
const DRAW_SIDES_GRID =
  'grid grid-cols-[9.75rem_9.75rem_minmax(0,1fr)] items-start gap-x-3 gap-y-1 sm:grid-cols-[11rem_11rem_minmax(0,1fr)]'

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
              <DrawPlayerNameLink player={player} />
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
          <DrawPlayerNameLink player={player} />
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
function PlayedIntelPills({ teaser }: { teaser: MatchupIntelTeaser }) {
  const gamesCount = teaser.gamesLabel?.match(/\d+/)?.[0] ?? null
  if (teaser.notesCta == null && gamesCount == null) return null

  return (
    <>
      {teaser.notesCta != null ? <NotesBadge label="Notes" /> : null}
      {gamesCount != null ? <GamesBadge label={`×${gamesCount}`} /> : null}
    </>
  )
}

/**
 * Played result row: opponent only (no repeated your-side), stacked names so
 * each player is a hittable profile link.
 */
function PlayedMatchupBody({ matchup }: { matchup: DrawMatchup }) {
  const result = matchup.result!
  return (
    <div className="min-w-0">
      <ResultInline result={result} />
      <div className="mt-0.5">
        <DrawPairNames
          players={matchup.opponentSide}
          className="min-w-0 text-xs leading-snug text-ink-700"
        />
      </div>
    </div>
  )
}

/**
 * Unplayed / definite up-next: opponents only — your side lives under the
 * discipline title for doubles/mixed, so repeating it here is redundant.
 */
function UpcomingOpponentBody({ matchup }: { matchup: DrawMatchup }) {
  return (
    <div className="min-w-0">
      <DrawPairNames players={matchup.opponentSide} />
    </div>
  )
}

type ExpandableProps = {
  open: boolean
  onToggle: () => void
  /** Always-visible collapsed teaser (notes pill and/or games label). */
  teaser: MatchupIntelTeaser
}

/**
 * Accordion trigger for notes / previous games — a layer below names and
 * status, not the whole card. Only rendered when there is intel to show.
 */
export function DrawIntelToggle({
  open,
  onToggle,
  teaser,
  compact = false,
}: {
  open: boolean
  onToggle: () => void
  teaser: MatchupIntelTeaser
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-label={open ? 'Hide notes and previous games' : 'Show notes and previous games'}
      className={`flex w-full items-center gap-2 border-t border-ink-100 bg-white text-left transition hover:bg-ink-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200 ${
        compact ? 'px-3 py-1.5' : 'px-3 py-2'
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-nowrap items-center gap-1.5">
        {compact ? (
          <PlayedIntelPills teaser={teaser} />
        ) : (
          <>
            {teaser.notesCta != null ? <NotesBadge label={teaser.notesCta} /> : null}
            {teaser.gamesLabel != null ? <GamesBadge label={teaser.gamesLabel} /> : null}
          </>
        )}
      </span>
      <ChevronIcon open={open} compact={compact} />
    </button>
  )
}

type Props = {
  matchup: DrawMatchup
  /** When set, uses the three-column draw-email layout with a round label column. */
  label?: string
  /** Expanded content under the matchup (notes / history). */
  notes?: ReactNode
  /** When set, a dedicated intel row toggles expand/collapse. */
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
 * opponents only. Names and status are not the accordion — intel lives in a layer below.
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
  const cardShell = usePlayedCompact
    ? 'overflow-hidden rounded-lg border border-ink-100/90 bg-white'
    : 'overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm'

  const header = usePlayedCompact ? (
    <PlayedMatchupBody matchup={matchup} />
  ) : useUpcomingOpponentOnly ? (
    <>
      <UpcomingOpponentBody matchup={matchup} />
      {visibleStatusBanner}
    </>
  ) : (
    <>
      <div className={gridClass}>{sides}</div>
      {useCondensedSides ? (
        result != null ? (
          <div className={`mt-1 ${DRAW_SIDES_GRID}`}>
            <ResultInline result={result} />
            <div aria-hidden />
            <div aria-hidden />
          </div>
        ) : null
      ) : (
        result != null && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <ResultInline result={result} />
          </div>
        )
      )}
      {visibleStatusBanner}
      {expandable == null && notes != null && (
        <div className={`${notesSpan} mt-2 space-y-2`}>{notes}</div>
      )}
    </>
  )

  return (
    <div className={cardShell}>
      <div className={`rounded-r border-l-4 ${disciplineStyle.borderClass}`}>
        <div className={paddingClass}>{header}</div>
        {expandable != null ? (
          <>
            <DrawIntelToggle
              open={expandable.open}
              onToggle={expandable.onToggle}
              teaser={expandable.teaser}
              compact={usePlayedCompact || useCompact}
            />
            {expandable.open && notes != null ? (
              <div className="space-y-2 border-t border-ink-100 bg-white px-3 py-3">{notes}</div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
