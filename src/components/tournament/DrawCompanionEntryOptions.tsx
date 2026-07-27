import type { TournamentPageVisibility } from '../../lib/tournamentPageMockData'

type EntryProps = {
  visibility: TournamentPageVisibility
  noteCount: number
  onOpen: () => void
}

function OptionLabel({ children }: { children: string }) {
  return (
    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
      {children}
    </p>
  )
}

function HiddenPlaceholder() {
  return (
    <div className="rounded-xl border border-dashed border-ink-200 bg-ink-50/60 px-4 py-3 text-sm text-ink-500">
      Entry hidden — page unchanged for this visitor
    </div>
  )
}

/** Compact crown mark for Premium / gift entry points. */
function CrownIcon({ className = 'h-4 w-4 text-amber-500' }: { className?: string }) {
  return (
    <svg
      className={`shrink-0 ${className}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M2.5 14.5h15l-1.2-7.2a.75.75 0 00-1.22-.42L12 9.5 10.42 5.3a.75.75 0 00-1.34 0L7.5 9.5 4.42 6.88a.75.75 0 00-1.22.42L2.5 14.5zM3 16a1 1 0 001 1h12a1 1 0 001-1v-.5H3V16z" />
    </svg>
  )
}

function PremiumCrown({ label = 'Premium' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1" title={label} aria-label={label}>
      <CrownIcon />
    </span>
  )
}

/** Option A — full-width strip between tournament card and category tabs. */
export function DrawCompanionEntryOptionA({ visibility, noteCount, onOpen }: EntryProps) {
  return (
    <div className="rounded-xl border border-dashed border-brand-300/70 bg-brand-50/30 p-3">
      <OptionLabel>Option A — companion strip (recommended)</OptionLabel>
      {visibility === 'hidden' ? (
        <HiddenPlaceholder />
      ) : visibility === 'gift' ? (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full flex-col gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-ink-900">Draw companion</p>
              <PremiumCrown label="Premium feature — one-off gift" />
            </div>
            <p className="mt-1 text-sm text-ink-600">
              Free for this tournament only! Who might you meet next, and have you
              played them before? Open it to find out, or scout a friend’s draw.
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
            Take a look →
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="flex w-full flex-col gap-2 rounded-xl border border-brand-200 bg-white px-4 py-3 text-left shadow-sm transition hover:border-brand-400 hover:bg-brand-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-ink-900">Draw companion</p>
              <PremiumCrown />
            </div>
            <p className="mt-1 text-sm text-ink-600">
              {noteCount > 0
                ? `${noteCount} opponent${noteCount === 1 ? '' : 's'} with scouting notes · Open to prep your matches`
                : 'Prep for your matches — opponents, past games, and your notes'}
            </p>
          </div>
          <span className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white">
            Open companion →
          </span>
        </button>
      )}
    </div>
  )
}

/** Option B — compact pill on the stage bar (mobile-friendly). */
export function DrawCompanionEntryOptionB({ visibility, onOpen }: EntryProps) {
  return (
    <div className="rounded-xl border border-dashed border-brand-300/70 bg-brand-50/30 p-3">
      <OptionLabel>Option B — stage bar pill</OptionLabel>
      {visibility === 'hidden' ? (
        <HiddenPlaceholder />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-brand-700">Stage:</span>
          {(['Entries', 'Groups', 'Finals'] as const).map((stage) => {
            const selected = stage === 'Finals'
            return (
              <span
                key={stage}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                  selected
                    ? 'border border-ink-900 bg-ink-200 text-ink-900'
                    : 'bg-ink-100 text-brand-700'
                }`}
              >
                {stage}
              </span>
            )
          })}
          {/* Same chip shell as Entries/Groups — crown is the only differentiator */}
          <button
            type="button"
            onClick={onOpen}
            className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-ink-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            aria-label="Open draw companion"
            title="Draw companion"
          >
            Companion
            <CrownIcon className="h-3.5 w-3.5 text-amber-500" />
          </button>
        </div>
      )}
    </div>
  )
}

/** Option C — action row inside the tournament info card footer. */
export function DrawCompanionEntryOptionC({ visibility, noteCount, onOpen }: EntryProps) {
  return (
    <div className="rounded-xl border border-dashed border-brand-300/70 bg-brand-50/30 p-3">
      <OptionLabel>Option C — tournament card action</OptionLabel>
      {visibility === 'hidden' ? (
        <HiddenPlaceholder />
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-100 bg-white shadow-sm">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-medium text-ink-500">…tournament info card (footer)…</p>
          </div>
          <div className="divide-y divide-ink-100">
            <button
              type="button"
              onClick={onOpen}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-brand-700 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
            >
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <PremiumCrown
                  label={
                    visibility === 'gift'
                      ? 'Premium feature — one-off gift'
                      : 'Premium'
                  }
                />
                <span className="min-w-0">
                  {visibility === 'gift'
                    ? 'Draw companion — a one-off gift to explore your draw'
                    : noteCount > 0
                      ? `Draw companion — notes on ${noteCount} opponents`
                      : 'Draw companion — prep for your matches'}
                </span>
              </span>
              <span aria-hidden>→</span>
            </button>
            <a
              href="#"
              onClick={(event) => event.preventDefault()}
              className="flex items-center justify-between gap-2 px-4 py-3 text-sm font-medium text-brand-700 hover:bg-brand-50"
            >
              View on BE website
              <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
