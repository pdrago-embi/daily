import { useQuery } from '@tanstack/react-query'
import {
  fetchTrend,
  fetchSashaTrend,
  fetchEmbiTrend,
  fetchTrendByPrefix,
  fetchSummary,
  fetchSummaryByPrefix,
  type SummaryScope,
  type TrendPoint,
  type SummaryResponse,
} from '../api/metrics'

export interface DashboardData {
  trend: TrendPoint[]
  summary: SummaryResponse
}

function getTrendQueryFn(scope: string): () => Promise<TrendPoint[]> {
  switch (scope) {
    case 'general':
      return fetchTrend
    case 'sasha':
      return fetchSashaTrend
    case 'embi':
      return fetchEmbiTrend
    default:
      return () => fetchTrendByPrefix(scope)
  }
}

function getSummaryQueryFn(scope: string): () => Promise<SummaryResponse> {
  switch (scope) {
    case 'general':
      return () => fetchSummary('general')
    case 'sasha':
      return () => fetchSummary('sasha')
    case 'embi':
      return () => fetchSummary('embi')
    default:
      return () => fetchSummaryByPrefix(scope)
  }
}

function getTrendQueryKey(scope: string): string[] {
  switch (scope) {
    case 'general':
    case 'sasha':
    case 'embi':
      return ['trend', scope]
    default:
      return ['trend', 'by-prefix', scope]
  }
}

function getSummaryQueryKey(scope: string): string[] {
  switch (scope) {
    case 'general':
    case 'sasha':
    case 'embi':
      return ['summary', scope]
    default:
      return ['summary', 'by-prefix', scope]
  }
}

export function useDashboardData(scope: SummaryScope | string, enabled = true) {
  const trendQuery = useQuery<TrendPoint[], Error>({
    queryKey: getTrendQueryKey(scope),
    queryFn: getTrendQueryFn(scope),
    enabled,
    staleTime: 60_000,
  })

  const summaryQuery = useQuery<SummaryResponse, Error>({
    queryKey: getSummaryQueryKey(scope),
    queryFn: getSummaryQueryFn(scope),
    enabled,
    staleTime: 60_000,
  })

  const isPending = trendQuery.isPending || summaryQuery.isPending
  const isError = trendQuery.isError || summaryQuery.isError
  const error = trendQuery.error ?? summaryQuery.error

  const data =
    trendQuery.data && summaryQuery.data
      ? { trend: trendQuery.data, summary: summaryQuery.data }
      : null

  return {
    isPending,
    isError,
    error: error ?? null,
    data,
  }
}

export function usePrefetchDashboardData(scope: SummaryScope | string) {
  const trendQuery = useQuery({
    queryKey: getTrendQueryKey(scope),
    queryFn: getTrendQueryFn(scope),
    staleTime: 60_000,
    enabled: false,
  })

  const summaryQuery = useQuery({
    queryKey: getSummaryQueryKey(scope),
    queryFn: getSummaryQueryFn(scope),
    staleTime: 60_000,
    enabled: false,
  })

  return { trendQuery, summaryQuery }
}