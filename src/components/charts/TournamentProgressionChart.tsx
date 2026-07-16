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
import type { LabelProps } from 'recharts'
import { useProgressionChartLabels } from '../../hooks/useProgressionChartLabels'
import {
  isLightGroupProgressionStage,
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

/** Scale the X-axis to the data so low distributions don't sit in a 0–100% gutter. */
function percentDomain(rows: Row[]): [number, number] {
  const maxPercent = Math.max(0, ...rows.map((row) => row.percent))
  if (maxPercent >= 92 || maxPercent === 0) return [0, 100]

  const padded = maxPercent * 1.05
  const step = padded <= 25 ? 5 : padded <= 60 ? 10 : 5
  return [0, Math.min(100, Math.ceil(padded / step) * step)]
}

function BarPercentLabel(props: LabelProps & { rows: Row[] }) {
  const { x, y, width, height, value, index, rows } = props
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    typeof value !== 'number' ||
    value <= 0
  ) {
    return null
  }

  const label = `${value}%`
  const minWidth = 7 * label.length + 10
  if (Number(width) < minWidth) return null

  const stage = index != null ? rows[index]?.stage : undefined
  const lightGroup = stage != null && isLightGroupProgressionStage(stage)

  return (
    <text
      x={Number(x) + Number(width) - 8}
      y={Number(y) + Number(height) / 2}
      dy="0.35em"
      textAnchor="end"
      fill={lightGroup ? '#000000' : 'var(--color-ink-50)'}
      fontSize={11}
      fontWeight={500}
    >
      {label}
    </text>
  )
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
          domain={percentDomain(data)}
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
            content={(labelProps) => <BarPercentLabel {...labelProps} rows={data} />}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
