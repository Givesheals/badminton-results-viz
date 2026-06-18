import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatDisplayDate } from '../../lib/formatDate'
import {
  formatSeasonRatingDeltaInParens,
  ratingAxisDomainAndTicks,
  seasonRatingDeltaTone,
  seasonRatingDeltas,
  type SeasonRatingPoint,
  type SeasonRatingSeries,
} from '../../lib/seasonRatings'

type Props = {
  series: SeasonRatingSeries[]
  seasonStartMs: number
  seasonEndMs: number
  shareMode?: boolean
}

type ChartPoint = SeasonRatingPoint & { timestamp: number }

export function SeasonRatingChart({
  series,
  seasonStartMs,
  seasonEndMs,
  shareMode = false,
}: Props) {
  const [selected, setSelected] = useState<{
    family: string
    point: ChartPoint
  } | null>(null)

  const hasAnyPoints = series.some((s) => s.points.length > 0)
  const deltas = useMemo(() => seasonRatingDeltas(series), [series])

  const { domain: yDomain, ticks: yTicks } = useMemo(() => {
    const ratings = series.flatMap((s) => s.points.map((p) => p.rating))
    return ratingAxisDomainAndTicks(ratings)
  }, [series])

  if (!hasAnyPoints) {
    return (
      <p className="flex h-52 items-center justify-center text-sm text-ink-700">
        Ratings will appear here as you play rated matches this season.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {deltas.map((row) => {
          const tone = seasonRatingDeltaTone(row.delta)
          const toneClass =
            tone === 'gain'
              ? 'text-gain-700'
              : tone === 'loss'
                ? 'text-loss-700'
                : 'text-ink-700'

          return (
            <span key={row.family} className={`inline-flex items-center gap-2 ${toneClass}`}>
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              {row.label} {formatSeasonRatingDeltaInParens(row.delta)}
            </span>
          )
        })}
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart margin={{ top: 8, right: 12, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            type="number"
            dataKey="timestamp"
            domain={[seasonStartMs, seasonEndMs]}
            allowDataOverflow
            tick={{ fontSize: 11 }}
            tickFormatter={(ms) => formatSeasonAxisTick(Number(ms))}
            tickCount={6}
          />
          <YAxis
            domain={yDomain}
            ticks={yTicks}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            width={44}
          />
          {!shareMode ? <Tooltip content={<RatingTooltip />} /> : null}
          {series.map((row) =>
            row.points.length > 0 ? (
              <Line
                key={row.family}
                data={row.points}
                type="monotone"
                dataKey="rating"
                name={row.label}
                stroke={row.color}
                strokeWidth={2}
                dot={
                  shareMode
                    ? false
                    : (props) => (
                        <SeasonRatingDot
                          {...props}
                          color={row.color}
                          onSelect={(point) => setSelected({ family: row.family, point })}
                        />
                      )
                }
                connectNulls
                isAnimationActive={false}
              />
            ) : null,
          )}
        </LineChart>
      </ResponsiveContainer>

      {!shareMode && selected && (
        <div
          className="rounded-lg border border-ink-100 bg-ink-50/80 px-3 py-2 text-sm text-ink-800"
          data-share-exclude
        >
          <p className="font-medium text-ink-900">
            {formatDisplayDate(selected.point.date)} · {selected.point.rating}
          </p>
          <p className="mt-1 text-ink-600">
            {selected.point.matchCount === 1 ? '1 match' : `${selected.point.matchCount} matches`}
            {selected.point.competitions.length > 0
              ? ` · ${selected.point.competitions.join(', ')}`
              : ''}
          </p>
          <button
            type="button"
            className="mt-2 text-xs font-medium text-brand-600 hover:text-brand-700"
            onClick={() => setSelected(null)}
          >
            Close
          </button>
        </div>
      )}
    </div>
  )
}

function SeasonRatingDot({
  cx,
  cy,
  payload,
  color,
  onSelect,
}: {
  cx?: number
  cy?: number
  payload?: ChartPoint
  color: string
  onSelect: (point: ChartPoint) => void
}) {
  if (cx == null || cy == null || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3}
      fill={color}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(payload)}
    />
  )
}

function formatSeasonAxisTick(ms: number): string {
  const date = new Date(ms)
  if (Number.isNaN(date.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return months[date.getMonth()] ?? ''
}

function RatingTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name: string; value: number; payload: ChartPoint }[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload
  if (!point) return null

  return (
    <div className="rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-ink-900">{formatDisplayDate(point.date)}</p>
      <p className="text-ink-700">
        {payload.map((row) => (
          <span key={row.name} className="block">
            {row.name}: {row.value}
          </span>
        ))}
      </p>
    </div>
  )
}
