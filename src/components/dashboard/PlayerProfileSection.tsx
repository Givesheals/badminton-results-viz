import { useMemo, useState, type ReactNode } from 'react'
import {
  compareProfiles,
  getArchetype,
  getImprovementTips,
} from '../../lib/playerArchetypes'
import { filterMatches } from '../../lib/filterMatches'
import {
  computePlayerProfile,
  MIN_COMPETITIVE_MATCHES,
  MIN_RATED_MATCHES,
  type AxisScore,
  type PlayerCode,
} from '../../lib/playerProfile'
import type { NormalizedMatch } from '../../types/matchHistory'

type Props = {
  allMatches: NormalizedMatch[]
}

type ProfileView = 'all' | '24m'

function TraitBar({ axis }: { axis: AxisScore }) {
  const onHighSide = axis.pole === 'high'
  const activeLabel = onHighSide ? axis.highLabel : axis.lowLabel
  const nearCenter = axis.score >= 46 && axis.score <= 54

  return (
    <article className="overflow-hidden rounded-xl card-frame bg-white shadow-sm">
      <div className="space-y-2 px-3 pt-3 pb-2.5">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <span
            className={
              !onHighSide && !nearCenter
                ? 'font-semibold text-court-800'
                : nearCenter
                  ? 'font-medium text-ink-800'
                  : 'text-ink-500'
            }
          >
            {axis.lowLabel}
          </span>
          <span
            className={`text-right ${
              onHighSide && !nearCenter
                ? 'font-semibold text-court-800'
                : nearCenter
                  ? 'font-medium text-ink-800'
                  : 'text-ink-500'
            }`}
          >
            {axis.highLabel}
          </span>
        </div>

        <div
          className="relative px-0.5"
          role="img"
          aria-label={`${axis.lowLabel} to ${axis.highLabel}: you lean ${activeLabel}${nearCenter ? ' (near centre)' : ''}`}
        >
          <div className="relative h-3 rounded-full bg-ink-100 ring-1 ring-ink-100">
            <div
              className={`absolute inset-y-0 rounded-full transition-colors ${
                onHighSide
                  ? 'left-1/2 right-0 rounded-r-full bg-court-200/70'
                  : 'left-0 right-1/2 rounded-l-full bg-court-200/70'
              } ${nearCenter ? 'opacity-40' : 'opacity-100'}`}
              aria-hidden
            />

            <div
              className="absolute top-0 bottom-0 -translate-x-1/2 border-l-2 border-dashed border-ink-300/90"
              style={{ left: '50%' }}
              aria-hidden
            />

            <span
              className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-court-600 shadow-md ring-2 ring-court-200"
              style={{ left: `${axis.score}%` }}
              aria-hidden
            />
          </div>

          <p className="mt-1.5 text-center text-[11px] font-medium text-court-800">
            {nearCenter ? 'Balanced between both' : `You lean ${activeLabel}`}
          </p>
        </div>
      </div>

      <div className="border-t border-ink-100 bg-ink-50/70 px-3 py-2">
        <p className="text-xs leading-relaxed text-ink-600">{axis.detail}</p>
        {axis.confidence === 'low' && (
          <p className="mt-1 text-xs italic text-ink-500">
            Emerging pattern — more matches will sharpen this
          </p>
        )}
      </div>
    </article>
  )
}

function InsightCard({ title, detail }: { title: string; detail?: string }) {
  return (
    <div className="rounded-xl card-frame bg-white/90 px-3 py-2.5 shadow-sm">
      <p className="text-sm font-medium text-ink-900">{title}</p>
      {detail && <p className="mt-0.5 text-xs text-ink-600">{detail}</p>}
    </div>
  )
}

export function PlayerProfileSection({ allMatches }: Props) {
  const [view, setView] = useState<ProfileView>('all')

  const allTimeMatches = allMatches
  const recentMatches = useMemo(
    () => filterMatches(allMatches, { ...defaultFilters, time: '24m' }),
    [allMatches],
  )

  const allTimeProfile = useMemo(
    () => computePlayerProfile(allTimeMatches),
    [allTimeMatches],
  )
  const recentProfile = useMemo(
    () => computePlayerProfile(recentMatches),
    [recentMatches],
  )

  const profile = view === 'all' ? allTimeProfile : recentProfile
  const comparison = useMemo(
    () => compareProfiles(allTimeProfile, recentProfile),
    [allTimeProfile, recentProfile],
  )

  const archetype =
    profile.code != null ? getArchetype(profile.code as PlayerCode) : null
  const tips = useMemo(() => getImprovementTips(profile), [profile])

  const viewLabel = view === 'all' ? 'All time' : 'Last 24 months'

  return (
    <section className="overflow-hidden rounded-2xl card-frame bg-ink-50/80 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink-100 bg-white px-4 py-3 sm:px-5">
        <div>
          <h3 className="font-medium text-ink-900">Your player type</h3>
          <p className="text-xs text-ink-600">
            {profile.competitiveMatchCount} competitive matches
            {profile.ratedMatchCount > 0 &&
              ` · ${profile.ratedMatchCount} rated`}
          </p>
        </div>
        <div
          className="inline-flex rounded-lg border border-ink-100 bg-ink-50 p-0.5"
          role="group"
          aria-label="Profile time range"
        >
          {(['all', '24m'] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              className={`rounded-md px-3 py-1 text-sm transition-colors ${
                view === key
                  ? 'bg-white font-medium text-ink-900 shadow-sm'
                  : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {key === 'all' ? 'All time' : 'Last 24 months'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {!profile.sufficientData ? (
          <InsufficientDataState profile={profile} viewLabel={viewLabel} />
        ) : archetype ? (
          <>
            {comparison.shifted && comparison.message && view === 'all' && (
              <div className="rounded-xl border border-court-200 bg-court-50/80 px-3 py-2.5 text-sm text-ink-800">
                {comparison.message}
              </div>
            )}

            <div className="rounded-2xl border border-court-200 bg-gradient-to-br from-court-50 to-white px-4 py-4 shadow-sm">
              <p className="text-xs font-medium uppercase tracking-wide text-court-700">
                {viewLabel}
              </p>
              <h4 className="mt-1 text-2xl font-semibold text-ink-900">
                {archetype.name}
              </h4>
              <p className="mt-1 text-sm text-ink-700">{archetype.tagline}</p>
              <p className="mt-3 text-sm font-medium text-ink-900">
                {profile.celebrationStat ?? archetype.celebration}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {profile.axes.map((axis) => (
                  <span
                    key={axis.key}
                    className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-ink-800 ring-1 ring-ink-100"
                  >
                    {axis.pole === 'high' ? axis.highLabel : axis.lowLabel}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="mb-1">
                <h4 className="text-sm font-medium text-ink-900">Your four traits</h4>
                <p className="mt-0.5 text-xs text-ink-600">
                  Each line is a spectrum between two styles — the dot shows where you sit;
                  centre is balanced.
                </p>
              </div>
              <div className="space-y-3">
                {profile.axes.map((axis) => (
                  <TraitBar key={axis.key} axis={axis} />
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-ink-900">What this means</h4>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-700">
                {archetype.contextBullets.map((bullet) => (
                  <li key={bullet} className="flex gap-2">
                    <span className="text-court-500" aria-hidden>
                      ·
                    </span>
                    <span>{formatContextBullet(bullet)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-medium text-ink-900">Ways to improve</h4>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {tips.map((tip) => (
                  <InsightCard key={tip} title={tip} />
                ))}
              </div>
            </div>

            {profile.streaks.longestWinStreak >= 3 && (
              <p className="text-xs text-ink-600">
                Longest winning streak: {profile.streaks.longestWinStreak} matches
                {profile.streaks.currentStreakType === 'win' &&
                  profile.streaks.currentStreak > 0 &&
                  ` · Current: ${profile.streaks.currentStreak} wins`}
              </p>
            )}
          </>
        ) : null}
      </div>
    </section>
  )
}

const defaultFilters = {
  competition: '',
  discipline: '',
  partner: '',
  time: 'all' as const,
  competitionAge: '',
}

function formatContextBullet(text: string): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-medium text-ink-900">
        {part}
      </strong>
    ) : (
      part
    ),
  )
}

function InsufficientDataState({
  profile,
  viewLabel,
}: {
  profile: ReturnType<typeof computePlayerProfile>
  viewLabel: string
}) {
  const needCompetitive = Math.max(0, MIN_COMPETITIVE_MATCHES - profile.competitiveMatchCount)
  const needRated = Math.max(0, MIN_RATED_MATCHES - profile.ratedMatchCount)

  return (
    <div className="rounded-xl card-frame bg-white/90 px-4 py-4 text-sm text-ink-700">
      <p className="font-medium text-ink-900">Not enough data yet ({viewLabel})</p>
      <p className="mt-1">
        We need a fuller picture before naming your player type — usually players with
        more tournament history get the most from this.
      </p>
      <ul className="mt-3 space-y-1 text-xs text-ink-600">
        {needCompetitive > 0 && (
          <li>
            {needCompetitive} more competitive match
            {needCompetitive === 1 ? '' : 'es'} needed ({profile.competitiveMatchCount}/
            {MIN_COMPETITIVE_MATCHES})
          </li>
        )}
        {needRated > 0 && (
          <li>
            {needRated} more rated match{needRated === 1 ? '' : 'es'} needed (
            {profile.ratedMatchCount}/{MIN_RATED_MATCHES})
          </li>
        )}
      </ul>
    </div>
  )
}
