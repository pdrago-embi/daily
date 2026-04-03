import { useQuery, useQueries } from '@tanstack/react-query'
import {
  fetchTrend,
  fetchSashaTrend,
  fetchEmbiTrend,
  fetchSummary,
  type SummaryScope,
  type TrendPoint,
  type SummaryResponse,
} from '../api/metrics'

export interface DashboardData {
  trend: TrendPoint[]
  summary: SummaryResponse
}

export function useDashboardData(scope: SummaryScope, enabled = true) {
  const isGeneral = scope === 'general'
  const isSasha = scope === 'sasha'

  const trendQuery = useQuery<TrendPoint[], Error>({
    queryKey: ['trend', scope],
    queryFn: () =>
      isGeneral
        ? fetchTrend()
        : isSasha
          ? fetchSashaTrend()
          : fetchEmbiTrend(),
    enabled,
    staleTime: 60_000,
  })

  const summaryQuery = useQuery<SummaryResponse, Error>({
    queryKey: ['summary', scope],
    queryFn: () => fetchSummary(scope),
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

export function usePrefetchDashboardData(scope: SummaryScope) {
  useQueries({
    queries: [
      {
        queryKey: ['trend', scope],
        queryFn: () =>
          scope === 'general'
            ? fetchTrend()
            : scope === 'sasha'
              ? fetchSashaTrend()
              : fetchEmbiTrend(),
        staleTime: 60_000,
      },
      {
        queryKey: ['summary', scope],
        queryFn: () => fetchSummary(scope),
        staleTime: 60_000,
      },
    ],
  })
}