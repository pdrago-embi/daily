import { useState, useEffect, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  ReferenceLine,
} from 'recharts'
import type { TrendPoint } from '../types'
import { formatCurrencyCompact } from '../utils/formatters'
import { ChartToggle } from '../ui'
import { getTodayDate } from '../api/metrics'

function formatAxisDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

const CHART_LINES = [
  { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
  { key: 'cost', name: 'Cost', color: '#f97316' },
  { key: 'profit', name: 'Profit', color: '#22c55e' },
] as const

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(['revenue', 'cost', 'profit'])
  )
  const [compactChart, setCompactChart] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setCompactChart(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  const chartMargin = compactChart
    ? { top: 8, right: 4, left: 0, bottom: 4 }
    : { top: 8, right: 16, left: 8, bottom: 8 }
  const yAxisWidth = compactChart ? 52 : 72

  const today = getTodayDate()
  const filteredData = data.filter(p => p.date !== today)

  const chartData = useMemo(() => {
    let prevMonth = ''
    return filteredData.map((p) => {
      const date = new Date(p.date + 'T00:00:00')
      const dayOfWeek = date.getDay()
      const currentMonth = p.date.substring(0, 7)
      const isMonthStart = prevMonth !== '' && prevMonth !== currentMonth
      prevMonth = currentMonth
      return {
        ...p,
        label: formatAxisDate(p.date),
        dayOfWeek,
        isMonthStart,
      }
    })
  }, [filteredData])

  const referenceAreas = useMemo(() => {
    const weekendAreas: { x1: string; x2: string }[] = []
    const monthStartIndices: number[] = []

    let i = 0
    while (i < chartData.length) {
      if (chartData[i].dayOfWeek === 0 || chartData[i].dayOfWeek === 6) {
        let start = i
        while (i < chartData.length && (chartData[i].dayOfWeek === 0 || chartData[i].dayOfWeek === 6)) {
          i++
        }
        weekendAreas.push({ x1: chartData[start].label, x2: chartData[i - 1].label })
      } else if (chartData[i].isMonthStart && i > 0) {
        monthStartIndices.push(i)
        i++
      } else {
        i++
      }
    }

    return { weekendAreas, monthStartIndices }
  }, [chartData])

  const toggleLine = (key: string) => {
    setVisibleLines(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap justify-center gap-2">
        {CHART_LINES.map(line => (
          <ChartToggle
            key={line.key}
            label={line.name}
            color={line.color}
            active={visibleLines.has(line.key)}
            onToggle={() => toggleLine(line.key)}
          />
        ))}
      </div>
      <div className="h-[220px] w-full sm:h-[300px] md:h-[380px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={chartMargin}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: compactChart ? 10 : 11 }}
              tickMargin={compactChart ? 6 : 8}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: compactChart ? 10 : 11 }}
              tickFormatter={(v) => formatCurrencyCompact(Number(v))}
              width={yAxisWidth}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: 8,
              }}
              labelStyle={{ color: '#e2e8f0' }}
              formatter={(value, name) => [
                formatCurrencyCompact(Number(value ?? 0)),
                String(name),
              ]}
              labelFormatter={(_, payload) => {
                const p = payload?.[0]?.payload as TrendPoint | undefined
                return p?.date ?? ''
              }}
            />
            {referenceAreas.weekendAreas.map((area, i) => (
              <ReferenceArea
                key={`weekend-${i}`}
                x1={area.x1}
                x2={area.x2}
                fill="#3b82f6"
                fillOpacity={0.15}
                strokeWidth={0}
              />
            ))}
            {referenceAreas.monthStartIndices.map((idx, i) => (
              <ReferenceLine
                key={`month-${i}`}
                x={chartData[idx].label}
                stroke="#f59e0b"
                strokeWidth={3}
              />
            ))}
            {CHART_LINES.map(line => (
              visibleLines.has(line.key) && (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={line.color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
