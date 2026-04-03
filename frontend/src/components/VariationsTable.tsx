import { useMemo, useState } from 'react'
import { useVariationsQuery } from '../hooks'
import { ErrorBox, Loading, ToggleGroup, SortHeader, DeltaCell, DeltaPctCell } from '../ui'
import { formatCurrency, formatNumber } from '../utils/formatters'
import type { VariationRow, VariationPeriod, VariationAggregate } from '../types'

type SortCol =
  | 'name'
  | 'publisherName'
  | 'revenueCurrent'
  | 'revenuePrevious'
  | 'impressionsCurrent'
  | 'impressionsPrevious'
  | 'adRequestsCurrent'
  | 'adRequestsPrevious'
  | 'delta'
  | 'deltaPct'

function compareRows(
  a: VariationRow,
  b: VariationRow,
  col: SortCol,
  dir: 'asc' | 'desc'
): number {
  const m = dir === 'asc' ? 1 : -1
  const nullLast = (
    x: number | null | undefined,
    y: number | null | undefined
  ) => {
    if (x == null && y == null) return 0
    if (x == null) return 1
    if (y == null) return -1
    return (x - y) * m
  }

  switch (col) {
    case 'name':
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) * m
    case 'publisherName':
      return (
        (a.publisherName ?? '').localeCompare(b.publisherName ?? '', undefined, {
          sensitivity: 'base',
        }) * m
      )
    case 'revenueCurrent':
      return (a.revenueCurrent - b.revenueCurrent) * m
    case 'revenuePrevious':
      return (a.revenuePrevious - b.revenuePrevious) * m
    case 'delta':
      return (a.delta - b.delta) * m
    case 'deltaPct':
      return nullLast(a.deltaPct, b.deltaPct)
    default:
      return 0
  }
}

function Section({
  title,
  rows,
  showPublisher,
  periodCurrentLabel,
  periodPreviousLabel,
  metric,
}: {
  title: string
  rows: VariationRow[]
  showPublisher?: boolean
  periodCurrentLabel: string
  periodPreviousLabel: string
  metric: 'revenue' | 'impressions' | 'ad_requests'
}) {
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  const nameLabel = title === 'Networks por publisher' ? 'Network' : 'Nombre'

  const handleSort = (col: string) => {
    const sortColumn = col as SortCol
    if (sortCol === sortColumn) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(sortColumn)
      setSortDir(sortColumn === 'name' || sortColumn === 'publisherName' ? 'asc' : 'desc')
    }
  }

  const sortedRows = useMemo(() => {
    if (!sortCol) return rows
    return [...rows].sort((a, b) => compareRows(a, b, sortCol, sortDir))
  }, [rows, sortCol, sortDir])

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="mb-2 text-lg font-semibold text-slate-100">{title}</h3>
        <p className="text-sm text-slate-500">No hay datos para comparar.</p>
      </div>
    )
  }

  const getColumnForMetric = (metricType: 'current' | 'previous') => {
    if (metric === 'revenue') return metricType === 'current' ? 'revenueCurrent' : 'revenuePrevious'
    if (metric === 'impressions') return metricType === 'current' ? 'impressionsCurrent' : 'impressionsPrevious'
    return metricType === 'current' ? 'adRequestsCurrent' : 'adRequestsPrevious'
  }

  const deltaColumn = metric === 'revenue' ? 'delta' : metric === 'impressions' ? 'delta' : 'delta'
  const deltaPctColumn = 'deltaPct'
  const deltaLabel = metric === 'revenue' ? 'Δ $' : metric === 'impressions' ? 'Δ imp' : 'Δ ar'

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="border-b border-slate-800 px-4 py-3">
        <h3 className="text-lg font-semibold text-slate-100">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-sm ${showPublisher ? 'min-w-[820px]' : 'min-w-[700px]'}`}
        >
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <SortHeader
                label={nameLabel}
                column="name"
                activeColumn={sortCol}
                direction={sortDir}
                onSort={handleSort}
              />
              {showPublisher && (
                <SortHeader
                  label="Publisher"
                  column="publisherName"
                  activeColumn={sortCol}
                  direction={sortDir}
                  onSort={handleSort}
                />
              )}
              <SortHeader
                label={periodCurrentLabel}
                column={getColumnForMetric('current')}
                activeColumn={sortCol}
                direction={sortDir}
                onSort={handleSort}
                title={periodCurrentLabel}
                align="right"
              />
              <SortHeader
                label={periodPreviousLabel}
                column={getColumnForMetric('previous')}
                activeColumn={sortCol}
                direction={sortDir}
                onSort={handleSort}
                title={periodPreviousLabel}
                align="right"
              />
              <SortHeader
                label={deltaLabel}
                column={deltaColumn}
                activeColumn={sortCol}
                direction={sortDir}
                onSort={handleSort}
                align="right"
              />
              <SortHeader
                label="Δ %"
                column={deltaPctColumn}
                activeColumn={sortCol}
                direction={sortDir}
                onSort={handleSort}
                align="right"
              />
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-slate-800/80 last:border-0 hover:bg-slate-800/30"
              >
                <td className="px-2 py-3 font-medium text-slate-200">
                  {r.name}
                </td>
                {showPublisher && (
                  <td className="px-2 py-3 text-slate-300">
                    {r.publisherName ?? '—'}
                  </td>
                )}
                <td className="px-2 py-3 text-right text-slate-300">
                  {metric === 'revenue' 
                    ? formatCurrency(r.revenueCurrent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : metric === 'impressions'
                      ? formatNumber(r.impressionsCurrent ?? 0)
                      : formatNumber(r.adRequestsCurrent ?? 0)
                  }
                </td>
                <td className="px-2 py-3 text-right text-slate-300">
                  {metric === 'revenue'
                    ? formatCurrency(r.revenuePrevious, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : metric === 'impressions'
                      ? formatNumber(r.impressionsPrevious ?? 0)
                      : formatNumber(r.adRequestsPrevious ?? 0)
                  }
                </td>
                <td className="px-2 py-3 text-right">
                  <DeltaCell 
                    delta={metric === 'revenue' ? r.delta : metric === 'impressions' ? (r.impressionsDelta ?? 0) : (r.adRequestsDelta ?? 0)} 
                    format={metric === 'revenue' ? 'money' : 'int'}
                  />
                </td>
                <td className="px-2 py-3 text-right">
                  <DeltaPctCell deltaPct={metric === 'revenue' ? r.deltaPct : metric === 'impressions' ? r.impressionsDeltaPct ?? null : r.adRequestsDeltaPct ?? null} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type VariationsEntityTab = 'publishers' | 'networks'

type Metric = 'revenue' | 'impressions' | 'ad_requests'

interface VariationsTableProps {
  metric?: Metric
}

export function VariationsTable({ metric = 'revenue' }: VariationsTableProps) {
  const [period, setPeriod] = useState<VariationPeriod>('day')
  const [aggregate, setAggregate] = useState<VariationAggregate>('total')
  const [entityTab, setEntityTab] = useState<VariationsEntityTab>('publishers')

  const query = useVariationsQuery({ period, aggregate, metric })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
        <ToggleGroup
          options={[
            { value: 'day', label: 'Ayer / anteayer' },
            { value: 'week', label: 'Semana' },
            { value: 'month', label: 'Mes' },
          ]}
          value={period}
          onChange={(v) => setPeriod(v as VariationPeriod)}
          label="Período de comparación"
        />
        {(period === 'week' || period === 'month') && (
          <ToggleGroup
            options={[
              { value: 'total', label: 'Total' },
              { value: 'avg', label: 'Promedio' },
            ]}
            value={aggregate}
            onChange={(v) => setAggregate(v as VariationAggregate)}
            label="Total o promedio"
          />
        )}
        <ToggleGroup
          options={[
            { value: 'publishers', label: 'Publishers' },
            { value: 'networks', label: 'Networks' },
          ]}
          value={entityTab}
          onChange={(v) => setEntityTab(v as VariationsEntityTab)}
          label="Publishers o networks"
          variant="default"
        />
      </div>

      {query.isPending && <Loading message="Cargando tablas..." />}
      {query.isError && (
        <ErrorBox
          message={
            query.error instanceof Error
              ? query.error.message
              : 'Error al cargar variaciones'
          }
        />
      )}
      {query.data && (
        <div className="space-y-8">
          <p className="text-center text-sm text-slate-500">
            Comparación:{' '}
            <span className="text-slate-400" title={query.data.periodPreviousLabel}>
              {query.data.periodPreviousLabel}
            </span>{' '}
            →{' '}
            <span className="text-slate-400" title={query.data.periodCurrentLabel}>
              {query.data.periodCurrentLabel}
            </span>
          </p>
          {entityTab === 'publishers' && (
            <>
              <Section
                title="Publishers"
                rows={query.data.publishers}
                periodCurrentLabel={query.data.periodCurrentLabel}
                periodPreviousLabel={query.data.periodPreviousLabel}
                metric={metric}
              />
              <Section
                title="Ad units"
                rows={query.data.adUnits}
                showPublisher
                periodCurrentLabel={query.data.periodCurrentLabel}
                periodPreviousLabel={query.data.periodPreviousLabel}
                metric={metric}
              />
            </>
          )}
          {entityTab === 'networks' && (
            <>
              <Section
                title="Networks"
                rows={query.data.networks}
                periodCurrentLabel={query.data.periodCurrentLabel}
                periodPreviousLabel={query.data.periodPreviousLabel}
                metric={metric}
              />
              <Section
                title="Networks por publisher"
                rows={query.data.networksByPublisher}
                showPublisher
                periodCurrentLabel={query.data.periodCurrentLabel}
                periodPreviousLabel={query.data.periodPreviousLabel}
                metric={metric}
              />
            </>
          )}
        </div>
      )}
    </div>
  )
}