import { StrictMode, lazy, Suspense, useMemo, useEffect } from 'react'
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
import { Loading } from './ui'

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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <MediaBuyersProvider>
          <BrowserRouter>
            <PrefetchWrapper />
          </BrowserRouter>
        </MediaBuyersProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)