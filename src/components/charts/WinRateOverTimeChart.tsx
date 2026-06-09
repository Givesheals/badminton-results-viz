import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MIN_WIN_RATE_MATCHES, type ResultsWinRateRow } from '../../lib/resultsOverTime'

type ChartPoint = ResultsWinRateRow & {
  winPercentPlot: number | null
}

type Props = {
  data: ResultsWinRateRow[]
}

export function WinRateOverTimeChart({ data }: Props) {
  const chartData: ChartPoint[] = data.map((row) => ({
    ...row,
    winPercentPlot: row.belowThreshold ? null : row.winPercent,
  }))

  if (data.length === 0) {
    return (
      <p className="flex h-44 items-center justify-center text-sm text-ink-700">
        No decided matches in this period.
      </p>
    )
  }

  const hasPlottable = chartData.some((row) => row.winPercentPlot != null)

  if (!hasPlottable) {
    return (
      <p className="flex h-44 items-center justify-center text-sm text-ink-700">
        Not enough matches per period to show a reliable win rate (need at least{' '}
        {MIN_WIN_RATE_MATCHES} decided matches).
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          width={40}
        />
        <Tooltip content={<WinRateTooltip />} />
        <Line
          type="monotone"
          dataKey="winPercentPlot"
          stroke="var(--color-brand-600)"
          strokeWidth={2}
          dot={{ r: 3, fill: 'var(--color-brand-600)' }}
          connectNulls={false}
          name="Win rate"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function WinRateTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { payload: ChartPoint }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  if (!row) return null

  if (row.belowThreshold) {
    return (
      <div className="rounded-lg card-frame bg-white px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-ink-900">{label}</p>
        <p className="mt-1 text-ink-700">
          Too few matches ({row.decidedMatches}) for a reliable win rate (need{' '}
          {MIN_WIN_RATE_MATCHES}+).
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg card-frame bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-ink-900">{label}</p>
      <p className="mt-1 text-ink-700">
        {row.winPercent}% · {row.wins}W / {row.losses}L
      </p>
    </div>
  )
}
