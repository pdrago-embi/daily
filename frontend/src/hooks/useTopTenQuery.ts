import { useQuery } from '@tanstack/react-query'
import { fetchTopTen } from '../api/metrics'
import type { TopTenPeriod, TopTenMetric, TopTenResponse } from '../api/metrics'

export function useTopTenQuery(
  period: TopTenPeriod = '7days',
  metric: TopTenMetric = 'revenue',
  scope: string = 'general'
) {
  return useQuery<TopTenResponse, Error>({
    queryKey: ['top-ten', period, metric, scope],
    queryFn: () => fetchTopTen(period, metric, scope),
    staleTime: 60_000,
  })
}

export function usePrefetchTopTenData(scope: string = 'general') {
  const query = useQuery({
    queryKey: ['top-ten', '7days', 'revenue', scope],
    queryFn: () => fetchTopTen('7days', 'revenue', scope),
    staleTime: 60_000,
    enabled: false,
  })
  return query
}
