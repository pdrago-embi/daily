import { useSummaryQuery } from '../hooks'
import { ErrorBox, Loading } from '../ui'
import { formatCurrency, formatNumber } from '../utils/formatters'
import type { SummaryScope } from '../types'

export function KpiSummaryCards({ scope }: { scope: SummaryScope }) {
  const query = useSummaryQuery(scope)

  if (query.isPending) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-8 text-center text-sm text-slate-500">
        <Loading message="Cargando resumen mensual..." />
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorBox
        message={
          query.error instanceof Error
            ? query.error.message
            : 'Error al cargar resumen'
        }
      />
    )
  }

  const d = query.data
  if (!d) return null

  const noCurrentData = !d.hasCurrentMonthData

  const rows: {
    label: string
    format: 'money' | 'int'
    prev: number
    current: number
    projected: number | null
    projectedAlwaysDash?: boolean
  }[] = [
    {
      label: 'Ad requests',
      format: 'int',
      prev: d.metrics.adRequests.prev,
      current: d.metrics.adRequests.current,
      projected: d.metrics.adRequests.projected,
    },
    {
      label: 'Impresiones',
      format: 'int',
      prev: d.metrics.impressions.prev,
      current: d.metrics.impressions.current,
      projected: d.metrics.impressions.projected,
    },
    {
      label: 'Revenue',
      format: 'money',
      prev: d.metrics.revenue.prev,
      current: d.metrics.revenue.current,
      projected: d.metrics.revenue.projected,
    },
    {
      label: 'Cost',
      format: 'money',
      prev: d.metrics.cost.prev,
      current: d.metrics.cost.current,
      projected: d.metrics.cost.projected,
    },
    {
      label: 'Profit',
      format: 'money',
      prev: d.metrics.profit.prev,
      current: d.metrics.profit.current,
      projected: d.metrics.profit.projected,
    },
    {
      label: 'Publishers (≥1k imp. en el mes)',
      format: 'int',
      prev: d.metrics.publisherCount.prev,
      current: d.metrics.publisherCount.current,
      projected: d.metrics.publisherCount.projected,
      projectedAlwaysDash: true,
    },
  ]

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold text-slate-100">
        Resumen mensual (KPI)
      </h3>
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 shadow-inner">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs text-slate-500">
              <th className="whitespace-nowrap px-3 py-3 font-medium sm:px-4">
                Métrica
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-right font-medium sm:px-4">
                <div>{d.prevMonthLabel}</div>
                <div className="text-slate-600 font-normal">Mes anterior</div>
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-right font-medium sm:px-4">
                <div>{d.currentMonthLabel}</div>
                <div className="text-slate-600 font-normal">
                  {noCurrentData ? 'Mes actual' : `${d.daysElapsed} días`}
                </div>
              </th>
              <th className="whitespace-nowrap px-3 py-3 text-right font-medium text-violet-300 sm:px-4">
                Proyectado<br/>
                <span className="font-normal text-violet-400/70">{d.currentMonthLabel}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
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
                    {f(r.prev)}
                  </td>
                  <td className="px-3 py-3 text-right text-slate-100 sm:px-4">
                    {noCurrentData
                      ? 'N/A'
                      : f(r.current)}
                  </td>
                  <td
                    className={`px-3 py-3 text-right font-medium sm:px-4 ${
                      r.projectedAlwaysDash || noCurrentData
                        ? 'text-slate-500'
                        : 'text-violet-300'
                    }`}
                  >
                    {noCurrentData
                      ? 'N/A'
                      : r.projectedAlwaysDash || r.projected === null
                        ? '—'
                        : f(r.projected)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
