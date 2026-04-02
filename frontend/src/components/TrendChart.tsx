import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '../types'
import { formatCurrencyCompact } from '../utils/formatters'
import { useTheme } from '../hooks/useTheme'

function formatAxisDate(iso: string) {
  const [, m, d] = iso.split('-')
  return `${m}/${d}`
}

function getTodayDateString(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const CHART_LINES = [
  { key: 'revenue', name: 'Revenue', color: '#3b82f6' },
  { key: 'cost', name: 'Cost', color: '#f97316' },
  { key: 'profit', name: 'Profit', color: '#22c55e' },
] as const

function ChartToggle({ 
  label, 
  color, 
  active, 
  onToggle 
}: { 
  label: string
  color: string
  active: boolean
  onToggle: () => void
}) {
  const { theme } = useTheme()
  const textColor = theme === 'dark' ? (active ? 'text-white' : 'text-slate-500') : (active ? 'text-slate-900' : 'text-slate-500')
  
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
        transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        ${textColor}
        ${!active ? 'line-through opacity-50 hover:opacity-75' : ''}
      `}
      style={active ? { backgroundColor: color + '30', border: `1px solid ${color}` } : {}}
    >
      <span 
        className="h-3 w-3 rounded-full" 
        style={{ backgroundColor: active ? color : '#64748b' }}
      />
      {label}
    </button>
  )
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    new Set(['revenue', 'cost', 'profit'])
  )
  
  const today = getTodayDateString()
  const filteredData = data.filter(p => p.date !== today)
  
  const chartData = filteredData.map((p) => ({
    ...p,
    label: formatAxisDate(p.date),
  }))

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
      <div className="h-[380px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="label"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickMargin={8}
              interval={0}
            />
            <YAxis
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              tickFormatter={(v) => formatCurrencyCompact(Number(v))}
              width={72}
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
