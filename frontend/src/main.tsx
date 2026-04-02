import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './hooks/useTheme'
import './index.css'
import { Layout } from './components/Layout'
import App from './App'
import { SashaPublishersPage } from './components/SashaPublishersPage'
import { EmbiPublishersPage } from './components/EmbiPublishersPage'
import { RevenueVariationsPage, ImpressionsVariationsPage } from './components/VariationsPages'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
})

function DashboardRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/variaciones/revenue" element={<RevenueVariationsPage />} />
        <Route path="/variaciones/impressions" element={<ImpressionsVariationsPage />} />
        <Route path="/media-buyers/sasha-balbi" element={<SashaPublishersPage />} />
        <Route path="/media-buyers/embi-media" element={<EmbiPublishersPage />} />
      </Routes>
    </Layout>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <BrowserRouter>
          <DashboardRoutes />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
)