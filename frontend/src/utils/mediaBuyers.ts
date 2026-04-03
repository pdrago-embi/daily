export interface MediaBuyer {
  id: string
  name: string
  prefix: string
  createdAt: number
}

const STORAGE_KEY = 'dashboard-media-buyers'

export function getMediaBuyers(): MediaBuyer[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function addMediaBuyer(name: string, prefix: string): MediaBuyer {
  const buyers = getMediaBuyers()
  const newBuyer: MediaBuyer = {
    id: crypto.randomUUID(),
    name,
    prefix: prefix.toUpperCase().trim(),
    createdAt: Date.now(),
  }
  const updated = [...buyers, newBuyer]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return newBuyer
}

export function removeMediaBuyer(id: string): void {
  const buyers = getMediaBuyers()
  const updated = buyers.filter(b => b.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function updateMediaBuyer(id: string, updates: Partial<Pick<MediaBuyer, 'name' | 'prefix'>>): void {
  const buyers = getMediaBuyers()
  const updated = buyers.map(b => b.id === id ? { ...b, ...updates, prefix: updates.prefix?.toUpperCase().trim() ?? b.prefix } : b)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}