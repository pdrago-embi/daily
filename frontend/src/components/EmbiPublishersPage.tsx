import { useEmbiPublishersQuery } from '../hooks'
import { PublishersPage } from './PublishersPage'

export function EmbiPublishersPage() {
  const query = useEmbiPublishersQuery(true)
  return <PublishersPage title="Embi Media" query={query} />
}
