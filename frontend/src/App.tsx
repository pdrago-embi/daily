import { useState } from 'react'
import { useTrendQuery, useSashaTrendQuery, useEmbiTrendQuery } from './hooks'
import { TrendChart } from './components/TrendChart'
import { KpiSummaryCards } from './components/KpiSummaryCards'
import { ErrorBox, Loading, ToggleGroup } from './ui'

type ChartTab = 'general' | 'sasha' | 'embi'

export default function App() {
  const [chartTab, setChartTab] = useState<ChartTab>('general')

  const trendQuery = useTrendQuery(chartTab === 'general')
  const sashaTrendQuery = useSashaTrendQuery(chartTab === 'sasha')
  const embiTrendQuery = useEmbiTrendQuery(chartTab === 'embi')

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

        {chartTab === 'general' && (
          <>
            {trendQuery.isPending && <Loading message="Cargando gráfico..." />}
            {trendQuery.isError && (
              <ErrorBox
                message={
                  trendQuery.error instanceof Error
                    ? trendQuery.error.message
                    : 'Error al cargar tendencia'
                }
              />
            )}
            {trendQuery.data && (
              <>
                <TrendChart data={trendQuery.data} />
                <div className="mt-8">
                  <KpiSummaryCards scope="general" />
                </div>
              </>
            )}
          </>
        )}

        {chartTab === 'sasha' && (
          <>
            {sashaTrendQuery.isPending && <Loading message="Cargando Stats Sasha..." />}
            {sashaTrendQuery.isError && (
              <ErrorBox
                message={
                  sashaTrendQuery.error instanceof Error
                    ? sashaTrendQuery.error.message
                    : 'Error al cargar Stats Sasha'
                }
              />
            )}
            {sashaTrendQuery.data &&
              (sashaTrendQuery.data.length === 0 ? (
                <p className="py-16 text-center text-slate-500">
                  No hay publishers con nombre que empiece por &quot;SB&quot; en
                  el descubrimiento de la API, o no hay datos en el rango.
                </p>
              ) : (
                <>
                  <TrendChart data={sashaTrendQuery.data} />
                  <div className="mt-8">
                    <KpiSummaryCards scope="sasha" />
                  </div>
                </>
              ))}
          </>
        )}

        {chartTab === 'embi' && (
          <>
            {embiTrendQuery.isPending && <Loading message="Cargando Stats Embi..." />}
            {embiTrendQuery.isError && (
              <ErrorBox
                message={
                  embiTrendQuery.error instanceof Error
                    ? embiTrendQuery.error.message
                    : 'Error al cargar Stats Embi'
                }
              />
            )}
            {embiTrendQuery.data &&
              (embiTrendQuery.data.length === 0 ? (
                <p className="py-16 text-center text-slate-500">
                  No hay publishers con nombre que empiece por &quot;EM&quot; en
                  el descubrimiento de la API, o no hay datos en el rango.
                </p>
              ) : (
                <>
                  <TrendChart data={embiTrendQuery.data} />
                  <div className="mt-8">
                    <KpiSummaryCards scope="embi" />
                  </div>
                </>
              ))}
          </>
        )}
      </section>
    </div>
  )
}