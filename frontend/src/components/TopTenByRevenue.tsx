import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchTopTen } from '../api/metrics'
import { ErrorBox, Loading, ToggleGroup } from '../ui'
import { formatCurrency, formatNumber } from '../utils/formatters'
import type { TopTenPeriod, TopTenMetric } from '../api/metrics'

interface TopTenByRevenueProps {
  scope?: string
}

function TopTenList({ items, metric }: { items: { name: string; value: number }[]; metric: TopTenMetric }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">No hay datos.</p>
  }
  return (
    <ul className="space-y-1">
      {items.map((item, i) => (
        <li key={item.name} className="flex items-center justify-between py-1 text-sm">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-slate-500 text-xs w-4 text-right shrink-0">{i + 1}</span>
            <span className="text-slate-200 truncate" title={item.name}>{item.name}</span>
          </div>
          <span className="text-slate-300 ml-4 shrink-0">
            {metric === 'revenue'
              ? formatCurrency(item.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : formatNumber(item.value)
            }
          </span>
        </li>
      ))}
    </ul>
  )
}

function TopTenSection({ title, items, metric }: { title: string; items: { name: string; value: number }[]; metric: TopTenMetric }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 text-base font-semibold text-slate-100">{title}</h3>
      <TopTenList items={items} metric={metric} />
    </div>
  )
}

export function TopTenByRevenue({ scope = 'general' }: TopTenByRevenueProps) {
  const [period, setPeriod] = useState<TopTenPeriod>('7days')
  const [metric, setMetric] = useState<TopTenMetric>('revenue')

  const query = useQuery({
    queryKey: ['top-ten', period, metric, scope],
    queryFn: () => fetchTopTen(period, metric, scope),
  })

  return (
    <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold text-slate-100">Top 10 {scope !== 'general' ? `· ${query.data?.scopeLabel ?? ''}` : ''}</h2>
        <div className="flex flex-wrap gap-3">
          <ToggleGroup
            options={[
              { value: 'revenue', label: 'Revenue' },
              { value: 'impressions', label: 'Impressions' },
              { value: 'ad_requests', label: 'Ad Requests' },
            ]}
            value={metric}
            onChange={(v) => setMetric(v as TopTenMetric)}
            label="Métrica"
          />
          <ToggleGroup
            options={[
              { value: 'yesterday', label: 'Ayer' },
              { value: '7days', label: '7 días' },
              { value: '30days', label: '30 días' },
            ]}
            value={period}
            onChange={(v) => setPeriod(v as TopTenPeriod)}
            label="Período"
          />
        </div>
      </div>

      {query.isPending && <Loading message="Cargando Top 10..." />}
      {query.isError && (
        <ErrorBox message={query.error instanceof Error ? query.error.message : 'Error al cargar datos'} />
      )}
      {query.data && (
        <p className="mb-4 text-center text-sm text-slate-500">
          {query.data.periodLabel} · {query.data.dateRange}
        </p>
      )}
      {query.data && (
        <div className="grid gap-6 md:grid-cols-3">
          <TopTenSection title="Publishers" items={query.data.topPublishers} metric={metric} />
          <TopTenSection title="Ad Units" items={query.data.topAdUnits} metric={metric} />
          <TopTenSection title="Networks" items={query.data.topNetworks} metric={metric} />
        </div>
      )}
    </section>
  )
}
