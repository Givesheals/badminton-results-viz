import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ResultsActivityRow } from '../../lib/resultsOverTime'

type Props = {
  data: ResultsActivityRow[]
}

export function PlayingActivityChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <p className="flex h-44 items-center justify-center text-sm text-ink-700">
        No matches in this period.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
        <YAxis allowDecimals={false} width={32} />
        <Tooltip
          formatter={(value) => [value, 'Matches']}
          labelFormatter={(label) => String(label)}
        />
        <Bar
          dataKey="matchCount"
          fill="var(--color-brand-600)"
          name="Matches"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
