import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import { usePrefetchDashboardData } from './hooks'
import './index.css'
import { Layout } from './components/Layout'
import App from './App'
import { Loading } from './ui'

const SashaPublishersPage = lazy(() => import('./components/SashaPublishersPage').then(m => ({ default: m.SashaPublishersPage })))
const EmbiPublishersPage = lazy(() => import('./components/EmbiPublishersPage').then(m => ({ default: m.EmbiPublishersPage })))
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

function PrefetchWrapper() {
  usePrefetchDashboardData('general')
  return <DashboardRoutes />
}

function DashboardRoutes() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/variaciones/revenue" element={<RevenueVariationsPage />} />
          <Route path="/variaciones/impressions" element={<ImpressionsVariationsPage />} />
          <Route path="/variaciones/ad-requests" element={<AdRequestsVariationsPage />} />
          <Route path="/media-buyers/sasha-balbi" element={<SashaPublishersPage />} />
          <Route path="/media-buyers/embi-media" element={<EmbiPublishersPage />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <PrefetchWrapper />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)