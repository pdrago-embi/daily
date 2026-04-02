import { useQuery } from '@tanstack/react-query'
import { fetchTrend, type TrendPoint } from '../api/metrics'

export function useTrendQuery(enabled = true) {
  return useQuery<TrendPoint[], Error>({
    queryKey: ['trend'],
    queryFn: fetchTrend,
    enabled,
  })
}