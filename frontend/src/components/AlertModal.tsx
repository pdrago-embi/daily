import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDailyDropAlert } from '../api/metrics'
import { formatNumber } from '../utils/formatters'

interface AlertModalProps {
  onClose: () => void
  defaultMediaBuyer?: { id: string; name: string; prefix: string } | null
}

const COOKIE_NAME = 'daily_alert_dismissed'

export function getAlertCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(^| )${COOKIE_NAME}=([^;]+)`))
  return match ? match[2] : null
}

export function setAlertCookie() {
  if (typeof document === 'undefined') return
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  document.cookie = `${COOKIE_NAME}=1; expires=${tomorrow.toUTCString()}; path=/`
}

export function AlertModal({ onClose, defaultMediaBuyer }: AlertModalProps) {
  const [dontShowToday, setDontShowToday] = useState(false)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['alerts', 'daily-drop', defaultMediaBuyer?.id],
    queryFn: () => fetchDailyDropAlert(defaultMediaBuyer?.id),
    staleTime: 5 * 60 * 1000,
  })

  const totalAlerts = (data?.droppedAdUnits.length ?? 0) + (data?.droppedPublishers.length ?? 0) + (data?.recoveredAdUnits.length ?? 0) + (data?.recoveredPublishers.length ?? 0)

  const firstName = defaultMediaBuyer?.name.split(' ')[0]
  const modalTitle = firstName ? `Hola ${firstName}, este es tu resumen del día:` : 'Cambios diarios'

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">{modalTitle}</h2>
          <p className="text-slate-400 text-center">Cargando...</p>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
        <div className="rounded-xl border border-slate-700 bg-slate-900 p-6 max-w-md w-full">
          <h2 className="text-lg font-semibold text-amber-400 mb-4">{modalTitle}</h2>
          <p className="text-red-400 text-center">Error al cargar los datos</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const d = data

  const handleClose = () => {
    if (dontShowToday) {
      setAlertCookie()
    }
    onClose()
  }

  const showNoAlertsMessage = totalAlerts === 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div className="rounded-xl border border-slate-700 bg-slate-900 max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-amber-400">{modalTitle}</h2>
            {!firstName && (
              <p className="text-sm text-slate-500">
                Comparación: {d.comparisonLabel}
              </p>
            )}
            {d.isMondayComparison && (
              <p className="text-xs text-cyan-400 mt-1">
                Como es lunes, se compara el promedio del sábado y domingo con el del jueves y viernes para evitar perder datos.
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-2xl leading-none shrink-0 ml-4"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          <div className="p-4 border-b border-slate-800 bg-slate-800/30">
            <span className="text-sm font-medium text-slate-400">{d.isMondayComparison ? 'Resumen del fin de semana' : 'Resumen de ayer'}</span>
            <div className="overflow-x-auto mt-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700">
                    <th className="text-left py-1 pr-4">Fecha</th>
                    <th className="text-right py-1 px-2">Revenue</th>
                    <th className="text-right py-1 px-2">Cost</th>
                    <th className="text-right py-1 pl-2">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {d.dailyMetrics.map((metric) => (
                    <tr key={metric.date} className="border-b border-slate-800/50">
                      <td className="py-1.5 pr-4 text-slate-400">{metric.date}</td>
                      <td className="text-right py-1.5 px-2 text-emerald-400 font-medium">${formatNumber(metric.revenue)}</td>
                      <td className="text-right py-1.5 px-2 text-red-400 font-medium">${formatNumber(metric.cost)}</td>
                      <td className="text-right py-1.5 pl-2 text-violet-300 font-medium">${formatNumber(metric.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {showNoAlertsMessage ? (
            <div className="p-8 text-center">
              <p className="text-emerald-400 text-lg mb-2">✓ Sin alertas</p>
              <p className="text-slate-500 text-sm">
                No hay caídas ni recuperaciones significativas entre<br />
                <span className="text-slate-400">{d.comparisonLabel.split(' vs ')[0]}</span> y <span className="text-slate-400">{d.comparisonLabel.split(' vs ')[1]}</span>
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {(d.droppedPublishers.length > 0 || d.droppedAdUnits.length > 0) && (
                <div>
                  <h3 className="text-base font-medium text-red-400 mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                    </svg>
                    Caídas significativas
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Período Ant: {d.comparisonLabel.split(' vs ')[0]} → Período Act: {d.comparisonLabel.split(' vs ')[1]}
                  </p>
                  
                  {d.droppedPublishers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Publishers ({d.droppedPublishers.length})</h4>
                      <div className="space-y-1">
                        {d.droppedPublishers.map((item, i) => (
                          <div key={`pub-${i}`} className="flex items-center justify-between py-1.5 px-3 rounded bg-slate-800/50 text-sm">
                            <span className="text-slate-200 truncate mr-4">{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0 text-right">
                              <div className="text-slate-400 text-xs">
                                <span className="text-slate-500">Ant:</span> {formatNumber(item.previousAr)}
                              </div>
                              <div className="text-slate-400 text-xs">
                                <span className="text-slate-500">Act:</span> {formatNumber(item.currentAr)}
                              </div>
                              <span className="text-red-400 font-medium w-12 text-right">{item.dropPct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.droppedAdUnits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Ad Units ({d.droppedAdUnits.length})</h4>
                      <div className="space-y-1">
                        {d.droppedAdUnits.map((item, i) => (
                          <div key={`au-${i}`} className="py-2 px-3 rounded bg-slate-800/50 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-200 font-medium truncate mr-4">{item.name}</span>
                              <span className="text-red-400 font-medium shrink-0">{item.dropPct}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="truncate mr-4">{item.publisherName}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span>Ant: {formatNumber(item.previousAr)}</span>
                                <span>Act: {formatNumber(item.currentAr)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(d.recoveredPublishers.length > 0 || d.recoveredAdUnits.length > 0) && (
                <div>
                  <h3 className="text-base font-medium text-green-400 mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Recuperaciones significativas
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">
                    Período Ant: {d.comparisonLabel.split(' vs ')[0]} → Período Act: {d.comparisonLabel.split(' vs ')[1]}
                  </p>
                  
                  {d.recoveredPublishers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Publishers ({d.recoveredPublishers.length})</h4>
                      <div className="space-y-1">
                        {d.recoveredPublishers.map((item, i) => (
                          <div key={`rec-pub-${i}`} className="flex items-center justify-between py-1.5 px-3 rounded bg-slate-800/50 text-sm">
                            <span className="text-slate-200 truncate mr-4">{item.name}</span>
                            <div className="flex items-center gap-4 shrink-0 text-right">
                              <div className="text-slate-400 text-xs">
                                <span className="text-slate-500">Ant:</span> {formatNumber(item.previousAr)}
                              </div>
                              <div className="text-slate-400 text-xs">
                                <span className="text-slate-500">Act:</span> {formatNumber(item.currentAr)}
                              </div>
                              <span className="text-green-400 font-medium w-12 text-right">+{item.increasePct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {d.recoveredAdUnits.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Ad Units ({d.recoveredAdUnits.length})</h4>
                      <div className="space-y-1">
                        {d.recoveredAdUnits.map((item, i) => (
                          <div key={`rec-au-${i}`} className="py-2 px-3 rounded bg-slate-800/50 text-sm">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-slate-200 font-medium truncate mr-4">{item.name}</span>
                              <span className="text-green-400 font-medium shrink-0">+{item.increasePct}%</span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span className="truncate mr-4">{item.publisherName}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span>Ant: {formatNumber(item.previousAr)}</span>
                                <span>Act: {formatNumber(item.currentAr)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 shrink-0 space-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={(e) => setDontShowToday(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
            />
            No mostrar esta información hasta mañana
          </label>
          <button
            onClick={handleClose}
            className="w-full py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium transition-colors"
          >
            Entendido ({totalAlerts} alertas)
          </button>
        </div>
      </div>
    </div>
  )
}
