import { StrictMode, lazy, Suspense, useMemo, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { MediaBuyersProvider, useMediaBuyers } from './hooks/useMediaBuyers'
import { usePrefetchDashboardData, usePrefetchTopTenData } from './hooks'
import { getMediaBuyers } from './utils/mediaBuyers'
import './index.css'
import { Layout } from './components/Layout'
import App from './App'
import { Loading, ErrorBoundary } from './ui'

const PublishersPage = lazy(() => import('./components/PublishersPage').then(m => ({ default: m.PublishersPage })))
const RevenueVariationsPage = lazy(() => import('./components/VariationsPages').then(m => ({ default: m.RevenueVariationsPage })))
const ImpressionsVariationsPage = lazy(() => import('./components/VariationsPages').then(m => ({ default: m.ImpressionsVariationsPage })))
const AdRequestsVariationsPage = lazy(() => import('./components/VariationsPages').then(m => ({ default: m.AdRequestsVariationsPage })))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

let globalError: Error | null = null
const errorListeners: Set<(e: Error) => void> = new Set()

export function setGlobalError(e: Error) {
  globalError = e
  errorListeners.forEach(fn => fn(e))
}

function PageLoader() {
  return <Loading message="Cargando página..." />
}

function MediaBuyerRoute() {
  const { buyerId } = useParams()
  const buyers = useMemo(() => getMediaBuyers(), [])
  const buyer = buyers.find(b => b.id.toLowerCase().replace(/\s+/g, '-') === buyerId)
  
  if (!buyer) {
    return (
      <div className="mx-auto max-w-6xl p-8 text-center">
        <p className="text-slate-500">Media Buyer no encontrado</p>
      </div>
    )
  }

  const PublishersPageLoader = () => (
    <Suspense fallback={<PageLoader />}>
      <PublishersPage buyer={buyer} />
    </Suspense>
  )

  return <PublishersPageLoader />
}

function CacheInvalidator() {
  const queryClient = useQueryClient()
  const { buyers } = useMediaBuyers()

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['trend'] })
    queryClient.invalidateQueries({ queryKey: ['summary'] })
    queryClient.invalidateQueries({ queryKey: ['top-ten'] })
    queryClient.invalidateQueries({ queryKey: ['media-buyer'] })
    queryClient.invalidateQueries({ queryKey: ['sasha-publishers'] })
    queryClient.invalidateQueries({ queryKey: ['embi-publishers'] })
  }, [buyers, queryClient])

  return null
}

function PrefetchWrapper() {
  usePrefetchDashboardData('general')
  usePrefetchTopTenData('general')
  return <DashboardRoutes />
}

function ErrorFallback() {
  const [error, setError] = useState<Error | null>(globalError)
  
  useEffect(() => {
    const handler = (e: Error) => setError(e)
    errorListeners.add(handler)
    return () => { errorListeners.delete(handler) }
  }, [])
  
  if (!error) return null
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-xl font-bold text-red-400 mb-4">Algo salió mal</h1>
        <div className="text-left text-slate-300 text-sm bg-slate-900 p-4 rounded-lg overflow-auto max-h-96 mb-4">
          <p className="font-mono text-red-300 mb-2">{error.message}</p>
          <pre className="font-mono text-xs text-slate-500 mt-2 whitespace-pre-wrap">
            {error.stack?.split('\n').slice(0, 8).join('\n')}
          </pre>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500"
        >
          Recargar página
        </button>
      </div>
    </div>
  )
}

function DashboardRoutes() {
  return (
    <Layout>
      <CacheInvalidator />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/variaciones/revenue" element={<RevenueVariationsPage />} />
          <Route path="/variaciones/impressions" element={<ImpressionsVariationsPage />} />
          <Route path="/variaciones/ad-requests" element={<AdRequestsVariationsPage />} />
          <Route path="/media-buyers/:buyerId" element={<MediaBuyerRoute />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

class GlobalErrorBoundary extends ErrorBoundary {
  componentDidCatch(error: Error, _errorInfo: React.ErrorInfo) {
    setGlobalError(error)
    console.error('Error:', error.message, error.stack)
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GlobalErrorBoundary fallback={<ErrorFallback />}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <MediaBuyersProvider>
            <BrowserRouter>
              <PrefetchWrapper />
            </BrowserRouter>
          </MediaBuyersProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </GlobalErrorBoundary>
  </StrictMode>,
)