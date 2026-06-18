import { useEffect, useMemo, useRef, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { LegendPayload } from 'recharts'
import { formatCount } from '../../lib/formatNumbers'
import type { CategoryAgeMatchVolume } from '../../lib/matchesByCategoryAge'
import { getDistinctPieSliceColors } from '../../lib/pieChartColors'

type Props = {
  data: CategoryAgeMatchVolume[]
}

type PieLayout = {
  chartHeight: number
  cx: number
  outerRadius: number
  legendWidthPercent: number
  legendPaddingLeft: number
}

const MAX_OUTER_RADIUS = 96
const PIE_INSET = 8

function computePieLayout(containerWidth: number): PieLayout {
  const chartHeight = containerWidth < 360 ? 232 : 280
  const legendWidthPercent = containerWidth < 400 ? 50 : 48
  const pieZoneWidth = containerWidth * (1 - legendWidthPercent / 100)
  const cx = pieZoneWidth / 2
  const outerRadius = Math.min(
    MAX_OUTER_RADIUS,
    pieZoneWidth / 2 - PIE_INSET,
    chartHeight / 2 - PIE_INSET,
  )

  return {
    chartHeight,
    cx,
    outerRadius: Math.max(44, Math.floor(outerRadius)),
    legendWidthPercent,
    legendPaddingLeft: containerWidth < 400 ? 8 : 12,
  }
}

function useContainerWidth(fallback = 320) {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(fallback)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const update = () => {
      setWidth(element.getBoundingClientRect().width)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return { ref, width }
}

function VolumeTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { payload: CategoryAgeMatchVolume }[]
}) {
  if (!active || payload?.[0] == null) return null

  const row = payload[0].payload
  return (
    <div className="max-w-xs rounded-lg border border-ink-100 bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-medium text-ink-900">{row.label}</p>
      <p className="mt-0.5 tabular-nums text-ink-700">
        {formatCount(row.matches)} matches ({row.percent}%)
      </p>
      {row.isGrouped && row.includedLabels && row.includedLabels.length > 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-ink-500">
          Includes {row.includedLabels.join(', ')}
        </p>
      ) : null}
    </div>
  )
}

function ChartLegend({ payload }: { payload?: readonly LegendPayload[] }) {
  if (!payload?.length) return null

  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 pl-4 text-xs leading-snug text-ink-700">
      {payload.map((entry) => (
        <li key={String(entry.value)} className="flex items-start gap-2">
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink-200"
            style={{ backgroundColor: entry.color }}
            aria-hidden
          />
          <span>{entry.value}</span>
        </li>
      ))}
    </ul>
  )
}

export function MatchesByCategoryAgeChart({ data }: Props) {
  const hasGroupedSlices = data.some((row) => row.isGrouped)
  const sliceColors = useMemo(() => getDistinctPieSliceColors(data.length), [data.length])
  const { ref: containerRef, width: containerWidth } = useContainerWidth()
  const layout = useMemo(() => computePieLayout(containerWidth), [containerWidth])

  if (data.length === 0) {
    return (
      <p className="flex h-48 items-center justify-center text-sm text-ink-700">
        No match data for level and age in this selection.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {hasGroupedSlices ? (
        <p className="text-xs text-ink-500">
          Earlier age groups are combined to keep the chart readable.
        </p>
      ) : null}
      <div className="w-full" ref={containerRef}>
        <ResponsiveContainer width="100%" height={layout.chartHeight}>
          <PieChart margin={{ top: 8, right: 4, bottom: 8, left: 8 }}>
            <Pie
              data={data}
              dataKey="matches"
              nameKey="label"
              cx={layout.cx}
              cy="50%"
              outerRadius={layout.outerRadius}
              paddingAngle={data.length > 1 ? 1 : 0}
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, index) => (
                <Cell key={entry.label} fill={sliceColors[index]} />
              ))}
            </Pie>
            <Tooltip content={<VolumeTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              content={<ChartLegend />}
              wrapperStyle={{
                width: `${layout.legendWidthPercent}%`,
                paddingLeft: layout.legendPaddingLeft,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
