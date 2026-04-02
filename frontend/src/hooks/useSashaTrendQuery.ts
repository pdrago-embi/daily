import { useQuery } from '@tanstack/react-query'
import { fetchSashaTrend, type TrendPoint } from '../api/metrics'

export function useSashaTrendQuery(enabled = true) {
  return useQuery<TrendPoint[], Error>({
    queryKey: ['trend', 'sasha'],
    queryFn: fetchSashaTrend,
    enabled,
  })
}