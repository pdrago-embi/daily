import { useMemo, useState } from 'react'
import { useVariationsQuery } from '../hooks'
import { ErrorBox, Loading, ToggleGroup } from '../ui'
import { formatCurrency, formatPercentage, formatNumber } from '../utils/formatters'
import type { VariationRow, VariationPeriod, VariationAggregate } from '../types'

type SortCol =
  | 'name'
  | 'publisherName'
  | 'revenueCurrent'
  | 'revenuePrevious'
  | 'impressionsCurrent'
  | 'impressionsPrevious'
  | 'delta'
  | 'deltaPct'

function DeltaCell({ delta, isCurrency = true }: { delta: number; isCurrency?: boolean }) {
  const positive = delta >= 0
  return (
    <span
      className={
        positive ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'
      }
    >
      {positive ? '+' : ''}
      {isCurrency 
        ? formatCurrency(delta, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : formatNumber(delta)
      }
    </span>
  )
}

function DeltaPctCell({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null) {
    return <span className="text-slate-500">—</span>
  }
  const positive = deltaPct >= 0
  return (
    <span className={positive ? 'text-emerald-400' : 'text-rose-400'}>
      {formatPercentage(deltaPct)}
    </span>
  )
}

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

function SortHeader({
  label,
  col,
  activeCol,
  dir,
  onSort,
  title,
}: {
  label: string
  col: SortCol
  activeCol: SortCol | null
  dir: 'asc' | 'desc'
  onSort: (col: SortCol) => void
  title?: string
}) {
  const active = activeCol === col
  const arrow = !active ? '' : dir === 'asc' ? ' ↑' : ' ↓'
  return (
    <th className="max-w-[200px] px-2 py-3 font-medium align-bottom">
      <button
        type="button"
        title={title ?? label}
        onClick={() => onSort(col)}
        className="inline-flex w-full flex-col items-start gap-0.5 text-left text-slate-400 hover:text-slate-200"
      >
        <span className="text-xs leading-tight">{label}</span>
        <span className="text-slate-500">{arrow}</span>
      </button>
    </th>
  )
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
  metric: 'revenue' | 'impressions'
}) {
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  const nameLabel = title === 'Networks por publisher' ? 'Network' : 'Nombre'

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir(col === 'name' || col === 'publisherName' ? 'asc' : 'desc')
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
                col="name"
                activeCol={sortCol}
                dir={sortDir}
                onSort={handleSort}
              />
              {showPublisher && (
                <SortHeader
                  label="Publisher"
                  col="publisherName"
                  activeCol={sortCol}
                  dir={sortDir}
                  onSort={handleSort}
                />
              )}
              <SortHeader
                label={periodCurrentLabel}
                col={metric === 'revenue' ? 'revenueCurrent' : 'impressionsCurrent'}
                activeCol={sortCol}
                dir={sortDir}
                onSort={handleSort}
                title={periodCurrentLabel}
              />
              <SortHeader
                label={periodPreviousLabel}
                col={metric === 'revenue' ? 'revenuePrevious' : 'impressionsPrevious'}
                activeCol={sortCol}
                dir={sortDir}
                onSort={handleSort}
                title={periodPreviousLabel}
              />
              <SortHeader
                label={metric === 'revenue' ? 'Δ $' : 'Δ imp'}
                col="delta"
                activeCol={sortCol}
                dir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="Δ %"
                col="deltaPct"
                activeCol={sortCol}
                dir={sortDir}
                onSort={handleSort}
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
                <td className="px-2 py-3 text-slate-300">
                  {metric === 'revenue' 
                    ? formatCurrency(r.revenueCurrent, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : formatNumber(r.impressionsCurrent ?? 0)
                  }
                </td>
                <td className="px-2 py-3 text-slate-300">
                  {metric === 'revenue'
                    ? formatCurrency(r.revenuePrevious, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : formatNumber(r.impressionsPrevious ?? 0)
                  }
                </td>
                <td className="px-2 py-3">
                  <DeltaCell delta={metric === 'revenue' ? r.delta : (r.impressionsDelta ?? 0)} isCurrency={metric === 'revenue'} />
                </td>
                <td className="px-2 py-3">
                  <DeltaPctCell deltaPct={metric === 'revenue' ? r.deltaPct : r.impressionsDeltaPct ?? null} />
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

type Metric = 'revenue' | 'impressions'

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
