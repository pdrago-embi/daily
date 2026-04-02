import { useSashaPublishersQuery } from '../hooks'
import { PublishersPage } from './PublishersPage'

export function SashaPublishersPage() {
  const query = useSashaPublishersQuery(true)
  return <PublishersPage title="Sasha Balbi" query={query} />
}
