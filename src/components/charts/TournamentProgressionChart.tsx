import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useProgressionChartLabels } from '../../hooks/useProgressionChartLabels'
import {
  PROGRESSION_STAGE_COLORS,
  type ProgressionStage,
} from '../../lib/tournamentProgression'

type Row = {
  stage: ProgressionStage
  label: string
  shortLabel: string
  count: number
  percent: number
}

type Props = {
  data: Row[]
  tournamentCount: number
}

export function TournamentProgressionChart({ data, tournamentCount }: Props) {
  const labelMode = useProgressionChartLabels()
  const axisKey = labelMode === 'full' ? 'label' : 'shortLabel'
  const yAxisWidth = labelMode === 'full' ? 96 : 40

  if (tournamentCount === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        No tournaments with bracket progression in this selection.
      </p>
    )
  }

  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        Round data could not be classified for the tournaments in this selection.
      </p>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(220, data.length * 44)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ left: 4, right: 28, top: 4, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <YAxis
          type="category"
          dataKey={axisKey}
          width={yAxisWidth}
          tick={{ fontSize: 12, fill: 'var(--color-ink-700)' }}
        />
        <Tooltip
          formatter={(_value, _name, item) => {
            const row = item.payload as Row
            return [`${row.count} (${row.percent}%)`, row.label]
          }}
        />
        <Bar dataKey="percent" radius={[0, 4, 4, 0]}>
          {data.map((entry) => (
            <Cell key={entry.stage} fill={PROGRESSION_STAGE_COLORS[entry.stage]} />
          ))}
          <LabelList
            dataKey="percent"
            position="insideRight"
            offset={8}
            formatter={(value) =>
              typeof value === 'number' && value >= 12 ? `${value}%` : ''
            }
            style={{ fontSize: 11, fontWeight: 500 }}
            fill="var(--color-ink-50)"
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
