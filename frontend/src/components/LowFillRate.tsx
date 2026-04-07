import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchLowFillRateAdUnits, fetchLowFillRatePublishers, type LowFillRateAdUnit, type LowFillRatePublisher, type LowFillRateAdUnitsResponse, type LowFillRatePublishersResponse } from '../api/metrics'
import { ErrorBox, Loading, SortHeader } from '../ui'
import { formatNumber } from '../utils/formatters'

interface LowFillRateAdUnitsProps {
  scope?: string
}

type TabType = 'adunits' | 'publishers'
type SortKey = 'name' | 'publisherName' | 'avgAr' | 'avgImpr' | 'fillRate'

function AdUnitsTable({ items, periodLabel }: { 
  items: LowFillRateAdUnit[]
  periodLabel: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>('fillRate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(k)
      setSortDir(['name', 'publisherName'].includes(k) ? 'asc' : 'desc')
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'publisherName': cmp = a.publisherName.localeCompare(b.publisherName); break
        case 'avgAr': cmp = a.avgAr - b.avgAr; break
        case 'avgImpr': cmp = a.avgImpr - b.avgImpr; break
        case 'fillRate': cmp = a.fillRate - b.fillRate; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

  if (items.length === 0) {
    return <div className="text-center py-8 text-slate-500"><p>No hay Ad Units con fill rate bajo.</p></div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500">
            <SortHeader label="Ad Unit" column="name" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label="Publisher" column="publisherName" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label={`AR/día\n(${periodLabel})`} column="avgAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <th className="whitespace-nowrap px-2 py-3 font-medium text-right text-slate-500">Impr/día</th>
            <SortHeader label="Fill Rate" column="fillRate" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={`${item.name}-${item.publisherName}-${i}`} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
              <td className="px-3 py-2.5 text-slate-200 font-medium">{item.name}</td>
              <td className="px-3 py-2.5 text-slate-400">{item.publisherName}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.avgAr)}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.avgImpr)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className={`font-medium ${item.fillRate <= 5 ? 'text-red-400' : item.fillRate <= 20 ? 'text-orange-400' : item.fillRate <= 40 ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {item.fillRate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PublishersTable({ items, periodLabel }: { 
  items: LowFillRatePublisher[]
  periodLabel: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>('fillRate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(k)
      setSortDir(['name'].includes(k) ? 'asc' : 'desc')
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'avgAr': cmp = a.avgAr - b.avgAr; break
        case 'avgImpr': cmp = a.avgImpr - b.avgImpr; break
        case 'fillRate': cmp = a.fillRate - b.fillRate; break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

  if (items.length === 0) {
    return <div className="text-center py-8 text-slate-500"><p>No hay Publishers con fill rate bajo.</p></div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[500px]">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500">
            <SortHeader label="Publisher" column="name" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label={`AR/día\n(${periodLabel})`} column="avgAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <th className="whitespace-nowrap px-2 py-3 font-medium text-right text-slate-500">Impr/día</th>
            <SortHeader label="Fill Rate" column="fillRate" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={`${item.name}-${i}`} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
              <td className="px-3 py-2.5 text-slate-200 font-medium">{item.name}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.avgAr)}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.avgImpr)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className={`font-medium ${item.fillRate <= 5 ? 'text-red-400' : item.fillRate <= 20 ? 'text-orange-400' : item.fillRate <= 40 ? 'text-yellow-400' : 'text-slate-300'}`}>
                  {item.fillRate.toFixed(1)}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function LowFillRate({ scope = 'general' }: LowFillRateAdUnitsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('adunits')

  const adUnitsQuery = useQuery({
    queryKey: ['low-fill-rate-ad-units', scope],
    queryFn: () => fetchLowFillRateAdUnits(scope),
    staleTime: 60_000,
  })

  const publishersQuery = useQuery({
    queryKey: ['low-fill-rate-publishers', scope],
    queryFn: () => fetchLowFillRatePublishers(scope),
    staleTime: 60_000,
  })

  const isLoading = activeTab === 'adunits' ? adUnitsQuery.isPending : publishersQuery.isPending
  const isError = activeTab === 'adunits' ? adUnitsQuery.isError : publishersQuery.isError
  const error = activeTab === 'adunits' ? adUnitsQuery.error : publishersQuery.error
  const data = activeTab === 'adunits' ? adUnitsQuery.data : publishersQuery.data

  return (
    <section className="mb-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-xl backdrop-blur md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-slate-100">
          Bajo Fill Rate
          {scope !== 'general' && <span className="text-cyan-400"> · {data?.scopeLabel ?? ''}</span>}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ad Units y Publishers con más de 5,000 AR/día y fill rate menor a 50%
        </p>
      </div>

      <div className="flex gap-4 border-b border-slate-800 mb-4">
        <button
          onClick={() => setActiveTab('adunits')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'adunits'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Ad Units
        </button>
        <button
          onClick={() => setActiveTab('publishers')}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === 'publishers'
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          Publishers
        </button>
      </div>

      {isLoading && <Loading message="Analizando datos..." />}
      {isError && (
        <ErrorBox message={error instanceof Error ? error.message : 'Error al cargar datos'} />
      )}
      {data && activeTab === 'adunits' && (
        <AdUnitsTable 
          items={(data as LowFillRateAdUnitsResponse).items} 
          periodLabel={data.periodLabel}
        />
      )}
      {data && activeTab === 'publishers' && (
        <PublishersTable 
          items={(data as LowFillRatePublishersResponse).items} 
          periodLabel={data.periodLabel}
        />
      )}
    </section>
  )
}