import { useQuery } from '@tanstack/react-query'
import { fetchEmbiPublishers, type SashaPublishersResponse } from '../api/metrics'

export function useEmbiPublishersQuery(enabled: boolean) {
  return useQuery<SashaPublishersResponse, Error>({
    queryKey: ['embi-publishers'],
    queryFn: () => fetchEmbiPublishers(),
    enabled,
  })
}
