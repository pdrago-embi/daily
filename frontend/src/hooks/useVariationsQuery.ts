import { useQuery } from '@tanstack/react-query'
import { fetchVariations, type VariationsResponse, type VariationPeriod, type VariationAggregate, type VariationMetric } from '../api/metrics'

interface UseVariationsOptions {
  period?: VariationPeriod
  aggregate?: VariationAggregate
  metric?: VariationMetric
}

export function useVariationsQuery(options: UseVariationsOptions = {}) {
  const { period = 'day', aggregate = 'total', metric = 'revenue' } = options
  
  return useQuery<VariationsResponse, Error>({
    queryKey: ['variations', period, aggregate, metric],
    queryFn: () => fetchVariations({
      period,
      aggregate: period === 'day' ? 'total' : aggregate,
      metric,
    }),
  })
}