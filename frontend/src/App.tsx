import { useState, useEffect } from 'react'
import { useDashboardData, useMediaBuyers } from './hooks'
import { TrendChart } from './components/TrendChart'
import { KpiSummaryCards } from './components/KpiSummaryCards'
import { TopTenByRevenue } from './components/TopTenByRevenue'
import { ErrorBox, SkeletonChart, SkeletonCards, ToggleGroup } from './ui'
import type { SummaryScope } from './types'
import { getDefaultMediaBuyer } from './utils/mediaBuyerCookie'

function DashboardSkeleton({ scope }: { scope: string }) {
  return (
    <>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">
            Evolución diaria {scope !== 'general' && <span className="text-cyan-400">· {scope}</span>}
          </h2>
        </div>
      </div>
      <SkeletonChart />
      <div className="mt-8">
        <SkeletonCards />
      </div>
    </>
  )
}

export default function App() {
  const [chartTab, setChartTab] = useState<string>('general')
  const { buyers } = useMediaBuyers()

  useEffect(() => {
    const defaultBuyerId = getDefaultMediaBuyer()
    if (defaultBuyerId) {
      const buyerExists = buyers.some(b => b.id === defaultBuyerId)
      if (buyerExists) {
        setChartTab(defaultBuyerId)
      }
    }
  }, [buyers])

  const { isPending, isError, error, data } = useDashboardData(
    chartTab as SummaryScope,
    true
  )

  const chartData = data?.trend ?? null

  const tabOptions = [
    { value: 'general', label: 'General' },
    ...buyers.map(b => ({ value: b.id, label: b.name })),
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              Evolución diaria
            </h2>
          </div>
          <ToggleGroup
            options={tabOptions}
            value={chartTab}
            onChange={(v) => setChartTab(v as string)}
            label="Vista del gráfico"
          />
        </div>

        {isPending && <DashboardSkeleton scope={chartTab} />}
        {isError && (
          <ErrorBox
            message={
              error instanceof Error
                ? error.message
                : 'Error al cargar datos'
            }
          />
        )}
        {chartData && data?.summary && (
          <>
            <TrendChart data={chartData} />
            <div className="mt-8">
              <KpiSummaryCards summary={data.summary} />
            </div>
          </>
        )}
        {!isPending && !chartData && !isError && (
          <p className="py-16 text-center text-slate-500">
            No hay datos para el período seleccionado.
          </p>
        )}
      </section>

      <TopTenByRevenue scope={chartTab} />
    </div>
  )
}
