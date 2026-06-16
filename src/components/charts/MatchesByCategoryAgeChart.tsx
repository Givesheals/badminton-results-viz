import { animated, type Interpolation, type SpringValue } from '@react-spring/web'
import { ResponsivePie } from '@nivo/pie'
import type { ComputedDatum, PieTooltipProps } from '@nivo/pie'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatCount } from '../../lib/formatNumbers'
import type { CategoryAgeMatchVolume } from '../../lib/matchesByCategoryAge'
import { getDistinctPieSliceColors } from '../../lib/pieChartColors'

type Props = {
  data: CategoryAgeMatchVolume[]
}

type PieDatum = CategoryAgeMatchVolume & {
  color: string
  id: string
  value: number
}

/** Slices smaller than this (in degrees) omit callout labels; use tooltip instead. */
const ARC_LINK_SKIP_ANGLE = 14
const CALLOUT_BREAKPOINT = 520

function longestLabelLength(data: CategoryAgeMatchVolume[]): number {
  return data.reduce((max, row) => Math.max(max, row.label.length), 0)
}

function computeChartHeight(
  sliceCount: number,
  compact: boolean,
  useCalloutLabels: boolean,
): number {
  if (!useCalloutLabels) {
    return compact ? 248 : 272
  }

  const base = compact ? 400 : 440
  const extraLabels = Math.max(0, Math.ceil(sliceCount / 2) - 3) * 32
  return base + extraLabels
}

function computeMargin(
  compact: boolean,
  useCalloutLabels: boolean,
  longestLabel: number,
) {
  if (!useCalloutLabels) {
    return { top: 12, right: 12, bottom: 12, left: 12 }
  }

  const side = Math.max(compact ? 108 : 120, Math.ceil(longestLabel * 6.8) + 28)
  return {
    top: 40,
    right: side,
    bottom: 40,
    left: side,
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

function VolumeTooltip({ datum }: PieTooltipProps<PieDatum>) {
  const row = datum.data
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

type ArcLinkLabelWithPercentProps = {
  datum: ComputedDatum<PieDatum>
  label: string
  style: {
    path: Interpolation<string>
    thickness: number
    textPosition: Interpolation<string>
    textAnchor: Interpolation<'start' | 'end'>
    linkColor: SpringValue<string>
    opacity: SpringValue<number>
    textColor: SpringValue<string>
  }
}

function ArcLinkLabelWithPercent({
  datum,
  label,
  style,
  compact,
}: ArcLinkLabelWithPercentProps & { compact: boolean }) {
  const fontSize = compact ? 10 : 11
  const lineGap = compact ? 1.05 : 1.1

  return (
    <animated.g opacity={style.opacity}>
      <animated.path
        d={style.path}
        fill="none"
        stroke={style.linkColor}
        strokeWidth={style.thickness}
      />
      <animated.text
        transform={style.textPosition}
        textAnchor={style.textAnchor}
        dominantBaseline="central"
        fill="#374151"
        fontSize={fontSize}
      >
        <tspan dy="-0.55em">{label}</tspan>
        <tspan dy={`${lineGap}em`} fill="#6b7280">
          {datum.data.percent}%
        </tspan>
      </animated.text>
    </animated.g>
  )
}

function PieLegend({
  data,
  sliceColors,
}: {
  data: CategoryAgeMatchVolume[]
  sliceColors: string[]
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
      {data.map((row, index) => (
        <li key={row.label} className="flex min-w-0 items-start gap-2 text-xs leading-snug">
          <span
            className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-ink-200"
            style={{ backgroundColor: sliceColors[index] }}
            aria-hidden
          />
          <span className="min-w-0">
            <span className="block text-ink-700">{row.label}</span>
            <span className="block tabular-nums text-ink-500">{row.percent}%</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

export function MatchesByCategoryAgeChart({ data }: Props) {
  const hasGroupedSlices = data.some((row) => row.isGrouped)
  const sliceColors = useMemo(() => getDistinctPieSliceColors(data.length), [data.length])
  const { ref: containerRef, width: containerWidth } = useContainerWidth()
  const compact = containerWidth < 420
  const useCalloutLabels = containerWidth >= CALLOUT_BREAKPOINT
  const longestLabel = useMemo(() => longestLabelLength(data), [data])
  const chartHeight = useMemo(
    () => computeChartHeight(data.length, compact, useCalloutLabels),
    [compact, data.length, useCalloutLabels],
  )
  const margin = useMemo(
    () => computeMargin(compact, useCalloutLabels, longestLabel),
    [compact, longestLabel, useCalloutLabels],
  )

  const chartData = useMemo<PieDatum[]>(
    () =>
      data.map((row, index) => ({
        ...row,
        id: row.label,
        value: row.matches,
        color: sliceColors[index] ?? '#64748b',
      })),
    [data, sliceColors],
  )

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
      <div className="space-y-4" ref={containerRef}>
        <div className="w-full" style={{ height: chartHeight }}>
          <ResponsivePie<PieDatum>
            data={chartData}
            id="id"
            value="value"
            margin={margin}
            sortByValue={false}
            fit={useCalloutLabels}
            innerRadius={0}
            padAngle={data.length > 1 ? 0.5 : 0}
            cornerRadius={0}
            activeOuterRadiusOffset={0}
            colors={(datum) => datum.data.color}
            borderWidth={2}
            borderColor="#ffffff"
            enableArcLabels={false}
            enableArcLinkLabels={useCalloutLabels}
            arcLinkLabel={(datum) => datum.data.label}
            arcLinkLabelsSkipAngle={ARC_LINK_SKIP_ANGLE}
            arcLinkLabelsDiagonalLength={compact ? 12 : 16}
            arcLinkLabelsStraightLength={compact ? 14 : 20}
            arcLinkLabelsThickness={1}
            arcLinkLabelsColor="#d1d5db"
            arcLinkLabelsTextColor="#374151"
            arcLinkLabelComponent={(props) => (
              <ArcLinkLabelWithPercent {...props} compact={compact} />
            )}
            animate={false}
            isInteractive
            tooltip={VolumeTooltip}
          />
        </div>
        {!useCalloutLabels ? (
          <PieLegend data={data} sliceColors={sliceColors} />
        ) : (
          <p className="text-center text-xs text-ink-500">
            Hover a slice for smaller categories not labelled on the chart.
          </p>
        )}
      </div>
    </div>
  )
}
