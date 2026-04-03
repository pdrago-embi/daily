import { useState } from 'react'
import { useDashboardData } from './hooks'
import { TrendChart } from './components/TrendChart'
import { KpiSummaryCards } from './components/KpiSummaryCards'
import { ErrorBox, Loading, ToggleGroup } from './ui'
import type { SummaryScope } from './types'

type ChartTab = 'general' | 'sasha' | 'embi'

export default function App() {
  const [chartTab, setChartTab] = useState<ChartTab>('general')

  const { isPending, isError, error, data } = useDashboardData(
    chartTab as SummaryScope,
    true
  )

  const chartData = data?.trend ?? null

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
            options={[
              { value: 'general', label: 'General' },
              { value: 'sasha', label: 'Sasha Balbi' },
              { value: 'embi', label: 'Embi Media' },
            ]}
            value={chartTab}
            onChange={(v) => setChartTab(v as ChartTab)}
            label="Vista del gráfico"
          />
        </div>

        {isPending && (
          <Loading message="Cargando gráfico y resumen..." />
        )}
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
    </div>
  )
}