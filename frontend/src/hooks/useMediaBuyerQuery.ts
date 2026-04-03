import { useQuery } from '@tanstack/react-query'
import { fetchMediaBuyer, fetchSashaPublishers, fetchEmbiPublishers, type SashaPublishersResponse } from '../api/metrics'

export function useMediaBuyerQuery(prefix: string | null, enabled = true) {
  const sashaEnabled = enabled && prefix === 'SB'
  const embiEnabled = enabled && prefix === 'EM'
  const customEnabled = enabled && prefix !== 'SB' && prefix !== 'EM'

  const sashaQuery = useQuery<SashaPublishersResponse, Error>({
    queryKey: ['sasha-publishers'],
    queryFn: () => fetchSashaPublishers(),
    enabled: sashaEnabled,
  })

  const embiQuery = useQuery<SashaPublishersResponse, Error>({
    queryKey: ['embi-publishers'],
    queryFn: () => fetchEmbiPublishers(),
    enabled: embiEnabled,
  })

  const customQuery = useQuery<SashaPublishersResponse, Error>({
    queryKey: ['media-buyer', prefix],
    queryFn: () => fetchMediaBuyer(prefix!),
    enabled: customEnabled,
  })

  if (prefix === 'SB') return sashaQuery
  if (prefix === 'EM') return embiQuery
  if (prefix) return customQuery

  return {
    isPending: false,
    isError: false,
    error: null,
    data: null,
  }
}