import { useSashaPublishersQuery } from '../hooks'
import { PublishersPage } from './PublishersPage'
import type { SashaPublishersResponse } from '../api/metrics'

export function SashaPublishersPage() {
  const query = useSashaPublishersQuery(true)
  const adaptedQuery = {
    isPending: query.isPending,
    isError: query.isError,
    error: query.error,
    data: query.data ?? null,
  } as { isPending: boolean; isError: boolean; error: Error | null; data: SashaPublishersResponse | null }
  return <PublishersPage title="Sasha Balbi" query={adaptedQuery} />
}