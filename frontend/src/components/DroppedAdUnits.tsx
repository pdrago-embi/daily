import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDroppedAdUnits, fetchDroppedPublishers, type DroppedAdUnitsResponse, type DroppedPublishersResponse } from '../api/metrics'
import { ErrorBox, Loading, SortHeader } from '../ui'
import { formatNumber } from '../utils/formatters'

interface DroppedAdUnitsProps {
  scope?: string
}

type TabType = 'adunits' | 'publishers'
type SortKey = 'name' | 'publisherName' | 'pastAvgDailyAr' | 'recentAvgDailyAr' | 'dropPct' | 'lastGoodDate'

function AdUnitsTable({ items, pastPeriod, recentPeriod }: { 
  items: { name: string; publisherName: string; pastAvgDailyAr: number; recentAvgDailyAr: number; dropPct: number; lastGoodDate: string }[]
  pastPeriod: string
  recentPeriod: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>('dropPct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string) => {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(k)
      setSortDir(['name', 'publisherName', 'lastGoodDate'].includes(k) ? 'asc' : 'desc')
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'publisherName': cmp = a.publisherName.localeCompare(b.publisherName); break
        case 'pastAvgDailyAr': cmp = a.pastAvgDailyAr - b.pastAvgDailyAr; break
        case 'recentAvgDailyAr': cmp = a.recentAvgDailyAr - b.recentAvgDailyAr; break
        case 'dropPct': cmp = a.dropPct - b.dropPct; break
        case 'lastGoodDate': cmp = a.lastGoodDate.localeCompare(b.lastGoodDate); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

  if (items.length === 0) {
    return <div className="text-center py-8 text-slate-500"><p>No hay Ad Units con caídas significativas.</p></div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[700px]">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500">
            <SortHeader label="Ad Unit" column="name" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label="Publisher" column="publisherName" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label={`Último bueno\n(pasado)`} column="lastGoodDate" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label={`AR/día antes\n(${pastPeriod})`} column="pastAvgDailyAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label={`AR/día ahora\n(${recentPeriod})`} column="recentAvgDailyAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label="Caída %" column="dropPct" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={`${item.name}-${item.publisherName}-${i}`} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
              <td className="px-3 py-2.5 text-slate-200 font-medium">{item.name}</td>
              <td className="px-3 py-2.5 text-slate-400">{item.publisherName}</td>
              <td className="px-3 py-2.5 text-slate-400 text-right">{item.lastGoodDate || '—'}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.pastAvgDailyAr)}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.recentAvgDailyAr)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className={`font-medium ${item.dropPct >= 90 ? 'text-red-400' : item.dropPct >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {item.dropPct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PublishersTable({ items, pastPeriod, recentPeriod }: { 
  items: { name: string; pastAvgDailyAr: number; recentAvgDailyAr: number; dropPct: number; lastGoodDate: string }[]
  pastPeriod: string
  recentPeriod: string
}) {
  const [sortKey, setSortKey] = useState<SortKey>('dropPct')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const handleSort = (key: string) => {
    const k = key as SortKey
    if (sortKey === k) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(k)
      setSortDir(['name', 'lastGoodDate'].includes(k) ? 'asc' : 'desc')
    }
  }

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'name': cmp = a.name.localeCompare(b.name); break
        case 'pastAvgDailyAr': cmp = a.pastAvgDailyAr - b.pastAvgDailyAr; break
        case 'recentAvgDailyAr': cmp = a.recentAvgDailyAr - b.recentAvgDailyAr; break
        case 'dropPct': cmp = a.dropPct - b.dropPct; break
        case 'lastGoodDate': cmp = a.lastGoodDate.localeCompare(b.lastGoodDate); break
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [items, sortKey, sortDir])

  if (items.length === 0) {
    return <div className="text-center py-8 text-slate-500"><p>No hay Publishers con caídas significativas.</p></div>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-800 text-xs text-slate-500">
            <SortHeader label="Publisher" column="name" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
            <SortHeader label={`Último bueno\n(pasado)`} column="lastGoodDate" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label={`AR/día antes\n(${pastPeriod})`} column="pastAvgDailyAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label={`AR/día ahora\n(${recentPeriod})`} column="recentAvgDailyAr" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} className="whitespace-pre-line" />
            <SortHeader label="Caída %" column="dropPct" align="right" activeColumn={sortKey} direction={sortDir} onSort={handleSort} />
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item, i) => (
            <tr key={`${item.name}-${i}`} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
              <td className="px-3 py-2.5 text-slate-200 font-medium">{item.name}</td>
              <td className="px-3 py-2.5 text-slate-400 text-right">{item.lastGoodDate || '—'}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.pastAvgDailyAr)}</td>
              <td className="px-3 py-2.5 text-slate-300 text-right">{formatNumber(item.recentAvgDailyAr)}</td>
              <td className="px-3 py-2.5 text-right">
                <span className={`font-medium ${item.dropPct >= 90 ? 'text-red-400' : item.dropPct >= 50 ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {item.dropPct}%
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DroppedAdUnits({ scope = 'general' }: DroppedAdUnitsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('adunits')

  const adUnitsQuery = useQuery({
    queryKey: ['dropped-ad-units', scope],
    queryFn: () => fetchDroppedAdUnits(scope),
    staleTime: 60_000,
  })

  const publishersQuery = useQuery({
    queryKey: ['dropped-publishers', scope],
    queryFn: () => fetchDroppedPublishers(scope),
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
          Alarma de baja actividad
          {scope !== 'general' && <span className="text-cyan-400"> · {data?.scopeLabel ?? ''}</span>}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Publishers y Ad Units que solían generar +1,000 AR/día y ahora producen menos del 5% de lo habitual
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
          items={(data as DroppedAdUnitsResponse).dropped} 
          pastPeriod={data.pastPeriodLabel}
          recentPeriod={data.recentPeriodLabel}
        />
      )}
      {data && activeTab === 'publishers' && (
        <PublishersTable 
          items={(data as DroppedPublishersResponse).dropped} 
          pastPeriod={data.pastPeriodLabel}
          recentPeriod={data.recentPeriodLabel}
        />
      )}
    </section>
  )
}
