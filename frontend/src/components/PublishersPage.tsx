import { useState, useMemo, useEffect } from 'react'
import { ErrorBox, Skeleton, SkeletonTable, SortHeader } from '../ui'
import { formatCurrency, formatNumber } from '../utils/formatters'
import type { MediaBuyer } from '../utils/mediaBuyers'
import { useMediaBuyerQuery } from '../hooks'
import { getDefaultMediaBuyer, setDefaultMediaBuyer, clearDefaultMediaBuyer } from '../utils/mediaBuyerCookie'

type SortKey = 'publisher_name' | 'adRequests' | 'impressions' | 'revenue' | 'cost' | 'profit' | 'date'
type SortDirection = 'asc' | 'desc'
type TabType = 'publisher' | 'day'

interface PublishersPageProps {
  buyer: MediaBuyer
}

export function PublishersPage({ buyer }: PublishersPageProps) {
  const query = useMediaBuyerQuery(buyer.prefix, true)
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activeTab, setActiveTab] = useState<TabType>('publisher')
  const [loadAsDefault, setLoadAsDefault] = useState(false)

  useEffect(() => {
    const defaultBuyer = getDefaultMediaBuyer()
    setLoadAsDefault(defaultBuyer === buyer.id)
  }, [buyer.id])

  const handleDefaultChange = (checked: boolean) => {
    setLoadAsDefault(checked)
    if (checked) {
      setDefaultMediaBuyer(buyer.id)
    } else {
      clearDefaultMediaBuyer()
    }
  }

  const handleSort = (column: string) => {
    const key = column as SortKey
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }

  const sortedPublishers = useMemo(() => {
    if (!query.data?.publishers) return []
    return [...query.data.publishers].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a]
      const bVal = b[sortKey as keyof typeof b]
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [query.data?.publishers, sortKey, sortDirection])

  const sortedDaily = useMemo(() => {
    if (!query.data?.daily) return []
    return [...query.data.daily].sort((a, b) => {
      const aVal = a[sortKey as keyof typeof a]
      const bVal = b[sortKey as keyof typeof b]
      if (sortKey === 'date') {
        return sortDirection === 'asc' 
          ? (aVal as string).localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal as string)
      }
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      return sortDirection === 'asc' 
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })
  }, [query.data?.daily, sortKey, sortDirection])

  if (query.isPending) {
    return (
      <div className="mx-auto max-w-6xl">
        <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
          <div className="mb-6">
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <SkeletonTable rows={10} />
        </section>
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10">
        <ErrorBox
          message={
            query.error instanceof Error
              ? query.error.message
              : `Error al cargar publishers de ${buyer.name}`
          }
        />
      </div>
    )
  }

  const d = query.data
  if (!d) return null

  const hasData = d.totals.adRequests > 0 || d.totals.revenue > 0

  const summaryRows = [
    {
      label: 'Ad requests',
      format: 'int' as const,
      current: d.totals.adRequests,
      projected: d.totals.projectedAdRequests,
    },
    {
      label: 'Impresiones',
      format: 'int' as const,
      current: d.totals.impressions,
      projected: d.totals.projectedImpressions,
    },
    {
      label: 'Revenue',
      format: 'money' as const,
      current: d.totals.revenue,
      projected: d.totals.projectedRevenue,
    },
    {
      label: 'Cost',
      format: 'money' as const,
      current: d.totals.cost,
      projected: d.totals.projectedCost,
    },
    {
      label: 'Profit',
      format: 'money' as const,
      current: d.totals.profit,
      projected: d.totals.projectedProfit,
    },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="w-full">
            <h2 className="text-xl font-semibold text-slate-100">
              {buyer.name} - Resumen del mes
            </h2>
            <p className="text-sm text-slate-500">
              {d.dateRange} • {!hasData ? 'Sin datos del mes actual' : `${d.daysElapsed} de ${d.daysInMonth} días`}
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer shrink-0 ml-auto sm:ml-0">
            <input
              type="checkbox"
              checked={loadAsDefault}
              onChange={(e) => handleDefaultChange(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            <span>Cargar como predeterminado</span>
          </label>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs text-slate-500">
                <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                  Métrica
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium sm:px-4">
                  <div>{d.currentMonthLabel}</div>
                  <div className="text-slate-600 font-normal">{d.dateRange}</div>
                </th>
                <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-violet-300 sm:px-4">
                  Proyectado<br/>
                  <span className="font-normal text-violet-400/70">{d.currentMonthLabel}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {summaryRows.map((r) => {
                const f = r.format === 'money' 
                  ? (n: number) => formatCurrency(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  : formatNumber
                return (
                  <tr
                    key={r.label}
                    className="border-b border-slate-800/80 last:border-0"
                  >
                    <td className="px-3 py-3 font-medium text-slate-200 sm:px-4">
                      {r.label}
                    </td>
                    <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                      {!hasData
                        ? 'N/A'
                        : f(r.current)}
                    </td>
                    <td
                      className={`px-3 py-3 text-right font-medium sm:px-4 ${
                        !hasData
                          ? 'text-slate-500'
                          : 'text-violet-300'
                      }`}
                    >
                      {!hasData
                        ? 'N/A'
                        : f(r.projected)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-100 mb-4">
            Reporte
          </h3>
          <div className="flex gap-4 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('publisher')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'publisher'
                  ? 'text-violet-300 border-b-2 border-violet-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Por Publisher
            </button>
            <button
              onClick={() => setActiveTab('day')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'day'
                  ? 'text-violet-300 border-b-2 border-violet-300'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Por Día
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-2">
            {d.dateRange} • {!hasData ? 'Sin datos del mes actual' : `${d.daysElapsed} de ${d.daysInMonth} días`}
          </p>
        </div>
        
        {activeTab === 'publisher' && (
          <>
            {sortedPublishers.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                No hay publishers con nombre que empiece por &quot;{buyer.prefix}&quot; en el mes actual.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <SortHeader label="Publisher" column="publisher_name" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Ad Requests" column="adRequests" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Impresiones" column="impressions" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Revenue" column="revenue" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Cost" column="cost" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Profit" column="profit" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPublishers.map((p) => (
                      <tr
                        key={p.publisher_name}
                        className="border-b border-slate-800/80 last:border-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-200 sm:px-4">
                          {p.publisher_name}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatNumber(p.adRequests)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatNumber(p.impressions)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(p.revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(p.cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(p.profit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'day' && (
          <>
            {!d.daily || d.daily.length === 0 ? (
              <p className="py-8 text-center text-slate-500">
                No hay datos diarios disponibles.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-500">
                      <SortHeader label="Fecha" column="date" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Ad Requests" column="adRequests" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Impresiones" column="impressions" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Revenue" column="revenue" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Cost" column="cost" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                      <SortHeader label="Profit" column="profit" align="right" activeColumn={sortKey} direction={sortDirection} onSort={handleSort} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortedDaily.map((day) => (
                      <tr
                        key={day.date}
                        className="border-b border-slate-800/80 last:border-0"
                      >
                        <td className="px-3 py-3 font-medium text-slate-200 sm:px-4">
                          {day.date}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatNumber(day.adRequests)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatNumber(day.impressions)}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(day.revenue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(day.cost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                          {formatCurrency(day.profit, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}