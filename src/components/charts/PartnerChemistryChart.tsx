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
import type {
  PartnerChemistryDisplayMode,
  PartnerChemistryRow,
} from '../../lib/partnerChemistry'
import { formatPercent } from '../../lib/formatNumbers'

type ChartRow = PartnerChemistryRow & {
  barMagnitude: number
  matchesLabel: string
  barLabelPrimary: string
  barLabelSecondary: string | null
  colorValue: number | null
}

type Props = {
  data: PartnerChemistryRow[]
  displayMode: PartnerChemistryDisplayMode
}

const OVER_COLOR = 'var(--color-gain-600)'
const UNDER_COLOR = 'var(--color-loss-600)'
const NEUTRAL_COLOR = 'var(--color-ink-400)'
const ROW_HEIGHT = 44
const CHEMISTRY_AXIS_LABEL = 'Wins vs Expected'
const PARTNERSHIP_AXIS_LABEL = 'Partnership rating'

function formatOverperformance(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value.toFixed(1)}`
}

function formatRatingAdjustment(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '' : ''
  return `${sign}${value}`
}

function partnershipBarLabels(
  adjustedPartnershipRating: number,
  avgTeamRating: number,
  chemistryRatingPoints: number,
): { primary: string; secondary: string | null } {
  if (chemistryRatingPoints === 0) {
    return { primary: String(adjustedPartnershipRating), secondary: null }
  }

  return {
    primary: String(adjustedPartnershipRating),
    secondary: `(${avgTeamRating}${formatRatingAdjustment(chemistryRatingPoints)})`,
  }
}

function toChemistryChartRows(data: PartnerChemistryRow[]): ChartRow[] {
  return data
    .filter((row) => row.overperformance != null)
    .map((row) => {
      const overperformance = row.overperformance!
      return {
        ...row,
        barMagnitude: Math.abs(overperformance),
        matchesLabel: `${row.games} match${row.games === 1 ? '' : 'es'}`,
        barLabelPrimary: formatOverperformance(overperformance),
        barLabelSecondary: null,
        colorValue: overperformance,
      }
    })
    .sort((a, b) => (b.colorValue ?? 0) - (a.colorValue ?? 0))
}

function toPartnershipRatingChartRows(data: PartnerChemistryRow[]): ChartRow[] {
  return data
    .filter((row) => row.adjustedPartnershipRating != null)
    .map((row) => {
      const adjustedPartnershipRating = row.adjustedPartnershipRating!
      const avgTeamRating = row.avgTeamRating!
      const chemistryRatingPoints = row.chemistryRatingPoints ?? 0
      const labels = partnershipBarLabels(
        adjustedPartnershipRating,
        avgTeamRating,
        chemistryRatingPoints,
      )

      return {
        ...row,
        barMagnitude: adjustedPartnershipRating,
        matchesLabel: `${row.games} match${row.games === 1 ? '' : 'es'}`,
        barLabelPrimary: labels.primary,
        barLabelSecondary: labels.secondary,
        colorValue: row.overperformance,
      }
    })
    .sort((a, b) => {
      if (b.barMagnitude !== a.barMagnitude) return b.barMagnitude - a.barMagnitude
      return b.games - a.games
    })
}

function toChartRows(
  data: PartnerChemistryRow[],
  displayMode: PartnerChemistryDisplayMode,
): ChartRow[] {
  return displayMode === 'partnershipRating'
    ? toPartnershipRatingChartRows(data)
    : toChemistryChartRows(data)
}

function chemistryDomain(rows: ChartRow[]): [number, number] {
  const max = Math.max(8, ...rows.map((row) => row.barMagnitude))
  const bound = Math.ceil(max / 4) * 4
  return [0, bound]
}

function partnershipRatingDomain(rows: ChartRow[]): [number, number] {
  const values = rows.map((row) => row.barMagnitude)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 50)
  const padding = Math.max(12, Math.ceil(span * 0.1))
  const floor = Math.floor((min - padding) / 25) * 25
  const bound = Math.ceil((max + padding) / 25) * 25
  return [floor, bound]
}

function barColor(colorValue: number | null): string {
  if (colorValue == null) return NEUTRAL_COLOR
  if (colorValue > 0) return OVER_COLOR
  if (colorValue < 0) return UNDER_COLOR
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
  const labelX = Number(x) + Number(width) + 6
  const labelY = Number(y) + Number(height) / 2

  if (row.barLabelSecondary == null) {
    return (
      <text
        x={labelX}
        y={labelY}
        dy="0.35em"
        textAnchor="start"
        fill="var(--color-ink-700)"
        fontSize={12}
        fontWeight={600}
      >
        {row.barLabelPrimary}
      </text>
    )
  }

  return (
    <text x={labelX} y={labelY} dy="0.35em" textAnchor="start" fontSize={12}>
      <tspan fill="var(--color-ink-700)" fontWeight={600}>
        {row.barLabelPrimary}
      </tspan>
      <tspan fill="var(--color-ink-500)" fontWeight={400} fontSize={11}>
        {' '}
        {row.barLabelSecondary}
      </tspan>
    </text>
  )
}

function ChartTooltip({
  active,
  payload,
  displayMode,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  displayMode: PartnerChemistryDisplayMode
}) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload

  if (displayMode === 'partnershipRating') {
    return (
      <div className="rounded-lg card-frame bg-white px-3 py-2 text-sm shadow-md">
        <p className="font-medium text-ink-900">{row.partnerName}</p>
        <p className="text-ink-700">
          {row.games} match{row.games === 1 ? '' : 'es'} · {row.competitions} competition
          {row.competitions === 1 ? '' : 's'}
        </p>
        {row.avgPlayerRating != null &&
        row.avgPartnerRating != null &&
        row.avgTeamRating != null &&
        row.chemistryRatingPoints != null &&
        row.overperformance != null ? (
          <p className="mt-1 text-ink-700">
            You {row.avgPlayerRating} · Partner {row.avgPartnerRating} · Chemistry{' '}
            {formatOverperformance(row.overperformance)} (
            {formatRatingAdjustment(row.chemistryRatingPoints)} pts) · Partnership{' '}
            {row.adjustedPartnershipRating}
          </p>
        ) : null}
      </div>
    )
  }

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
      {row.expectedWinPercent != null && row.colorValue != null ? (
        <>
          <p className="text-ink-700">Expected {formatPercent(row.expectedWinPercent)}</p>
          <p
            className={
              row.colorValue >= 0 ? 'font-medium text-gain-700' : 'font-medium text-loss-700'
            }
          >
            {formatOverperformance(row.colorValue)} {CHEMISTRY_AXIS_LABEL}
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

export function PartnerChemistryChart({ data, displayMode }: Props) {
  const chartData = toChartRows(data, displayMode)
  const unratedCount = data.length - chartData.length
  const axisLabel =
    displayMode === 'partnershipRating' ? PARTNERSHIP_AXIS_LABEL : CHEMISTRY_AXIS_LABEL
  const axisDomain: [number, number] =
    displayMode === 'partnershipRating'
      ? partnershipRatingDomain(chartData)
      : chemistryDomain(chartData)
  const chartMarginRight = displayMode === 'partnershipRating' ? 96 : 52

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
          margin={{ left: 8, right: chartMarginRight, top: 4, bottom: 20 }}
          barCategoryGap="18%"
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis
            type="number"
            domain={axisDomain}
            allowDecimals={false}
            tick={{ fontSize: 11 }}
            label={{
              value: axisLabel,
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
          <Tooltip content={<ChartTooltip displayMode={displayMode} />} />
          <Bar dataKey="barMagnitude" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((row) => (
              <Cell key={row.partnerName} fill={barColor(row.colorValue)} />
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
