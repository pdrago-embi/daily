import { useQuery } from '@tanstack/react-query'
import { fetchSummary, type SummaryScope, type SummaryResponse } from '../api/metrics'

export function useSummaryQuery(scope: SummaryScope) {
  return useQuery<SummaryResponse, Error>({
    queryKey: ['summary', scope],
    queryFn: () => fetchSummary(scope),
  })
}