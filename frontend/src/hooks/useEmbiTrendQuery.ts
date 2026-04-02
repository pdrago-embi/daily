import { useQuery } from '@tanstack/react-query'
import { fetchEmbiTrend, type TrendPoint } from '../api/metrics'

export function useEmbiTrendQuery(enabled = true) {
  return useQuery<TrendPoint[], Error>({
    queryKey: ['trend', 'embi'],
    queryFn: fetchEmbiTrend,
    enabled,
  })
}