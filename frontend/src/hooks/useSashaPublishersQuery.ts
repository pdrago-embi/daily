import { useQuery } from '@tanstack/react-query'
import { fetchSashaPublishers, type SashaPublishersResponse } from '../api/metrics'

export function useSashaPublishersQuery(enabled: boolean) {
  return useQuery<SashaPublishersResponse, Error>({
    queryKey: ['sasha-publishers'],
    queryFn: () => fetchSashaPublishers(),
    enabled,
  })
}
