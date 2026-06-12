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
import type { PartnerChemistryRow } from '../../lib/partnerChemistry'
import { formatPercent } from '../../lib/formatNumbers'

type ChartRow = PartnerChemistryRow & {
  overperformanceValue: number
  barMagnitude: number
  matchesLabel: string
}

type Props = {
  data: PartnerChemistryRow[]
}

const OVER_COLOR = 'var(--color-gain-600)'
const UNDER_COLOR = 'var(--color-loss-600)'
const NEUTRAL_COLOR = 'var(--color-ink-400)'
const ROW_HEIGHT = 44
const AXIS_LABEL = 'Wins vs Expected'

function formatOverperformance(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(1)}`
}

function toChartRows(data: PartnerChemistryRow[]): ChartRow[] {
  return data
    .filter((row) => row.overperformance != null)
    .map((row) => {
      const overperformanceValue = row.overperformance!
      return {
        ...row,
        overperformanceValue,
        barMagnitude: Math.abs(overperformanceValue),
        matchesLabel: `${row.games} match${row.games === 1 ? '' : 'es'}`,
      }
    })
    .sort((a, b) => b.overperformanceValue - a.overperformanceValue)
}

function positiveDomain(rows: ChartRow[]): [number, number] {
  const max = Math.max(8, ...rows.map((row) => row.barMagnitude))
  const bound = Math.ceil(max / 4) * 4
  return [0, bound]
}

function barColor(value: number): string {
  if (value > 0) return OVER_COLOR
  if (value < 0) return UNDER_COLOR
  return NEUTRAL_COLOR
}

function BarValueLabel(props: LabelProps & { rows: ChartRow[] }) {
  const { x, y, width, height, index, rows } = props
  if (
    x == null ||
    y == null ||
    width == null ||
    height == null ||
    index == null ||
    rows[index] == null
  ) {
    return null
  }

  const row = rows[index]
  const label = formatOverperformance(row.overperformanceValue)

  return (
    <text
      x={Number(x) + Number(width) + 6}
      y={Number(y) + Number(height) / 2}
      dy="0.35em"
      textAnchor="start"
      fill="var(--color-ink-700)"
      fontSize={12}
      fontWeight={600}
    >
      {label}
    </text>
  )
}

function ChemistryTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  return (
    <div className="rounded-lg card-frame bg-white px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-ink-900">{row.partnerName}</p>
      <p className="text-ink-700">
        {row.games} match{row.games === 1 ? '' : 'es'} · {row.competitions} competition
        {row.competitions === 1 ? '' : 's'}
      </p>
      <p className="mt-1 text-ink-900">
        Actual {formatPercent(row.actualWinPercent)} ({row.wins}W–{row.losses}L)
      </p>
      {row.expectedWinPercent != null ? (
        <>
          <p className="text-ink-700">Expected {formatPercent(row.expectedWinPercent)}</p>
          <p
            className={
              row.overperformanceValue >= 0
                ? 'font-medium text-gain-700'
                : 'font-medium text-loss-700'
            }
          >
            {formatOverperformance(row.overperformanceValue)} {AXIS_LABEL}
          </p>
        </>
      ) : null}
    </div>
  )
}

function PartnerTick({
  x,
  y,
  payload,
  rows,
}: {
  x?: string | number
  y?: string | number
  payload?: { value?: string }
  rows: ChartRow[]
}) {
  const row = rows.find((r) => r.partnerName === payload?.value)
  if (!row || x == null || y == null) return null

  return (
    <g transform={`translate(${Number(x)},${Number(y)})`}>
      <text
        x={-8}
        y={0}
        dy="0.1em"
        textAnchor="end"
        fill="var(--color-ink-900)"
        fontSize={12}
      >
        {row.partnerName}
      </text>
      <text
        x={-8}
        y={0}
        dy="1.25em"
        textAnchor="end"
        fill="var(--color-ink-500)"
        fontSize={10}
      >
        {row.matchesLabel}
      </text>
    </g>
  )
}

export function PartnerChemistryChart({ data }: Props) {
  const chartData = toChartRows(data)
  const unratedCount = data.length - chartData.length

  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        No partners meet the minimum threshold in this selection.
      </p>
    )
  }

  if (chartData.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        No rated doubles matches to compare against expectation.
      </p>
    )
  }

  const chartHeight = Math.max(200, chartData.length * ROW_HEIGHT + 48)

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ left: 8, right: 52, top: 4, bottom: 20 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={positiveDomain(chartData)}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            label={{
              value: AXIS_LABEL,
              position: 'insideBottom',
              offset: -2,
              fontSize: 11,
              fill: 'var(--color-ink-500)',
            }}
          />
          <YAxis
            type="category"
            dataKey="partnerName"
            width={136}
            tick={(props) => <PartnerTick {...props} rows={chartData} />}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<ChemistryTooltip />} />
          <Bar dataKey="barMagnitude" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((row) => (
              <Cell key={row.partnerName} fill={barColor(row.overperformanceValue)} />
            ))}
            <LabelList content={(props) => <BarValueLabel {...props} rows={chartData} />} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      {unratedCount > 0 && (
        <p className="text-xs text-ink-500">
          {unratedCount} partner{unratedCount === 1 ? '' : 's'} hidden — not enough rating
          data to estimate expected win rate.
        </p>
      )}
    </div>
  )
}
