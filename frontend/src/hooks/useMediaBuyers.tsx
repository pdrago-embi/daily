import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { getMediaBuyers, addMediaBuyer, removeMediaBuyer, updateMediaBuyer, type MediaBuyer } from '../utils/mediaBuyers'

const DEFAULT_BUYERS: MediaBuyer[] = [
  { id: 'sasha', name: 'Sasha Balbi', prefix: 'SB', createdAt: 0 },
  { id: 'embi', name: 'Embi Media', prefix: 'EM', createdAt: 0 },
]

function getDefaultBuyers(): MediaBuyer[] {
  if (typeof window === 'undefined') return DEFAULT_BUYERS
  const stored = getMediaBuyers()
  if (stored.length === 0) {
    localStorage.setItem('dashboard-media-buyers', JSON.stringify(DEFAULT_BUYERS))
    return DEFAULT_BUYERS
  }
  return stored
}

interface MediaBuyersContextType {
  buyers: MediaBuyer[]
  add: (name: string, prefix: string) => void
  remove: (id: string) => void
  update: (id: string, updates: { name?: string; prefix?: string }) => void
  isLocked: boolean
  setLocked: (locked: boolean) => void
}

const MediaBuyersContext = createContext<MediaBuyersContextType | null>(null)

export function MediaBuyersProvider({ children }: { children: ReactNode }) {
  const [buyers, setBuyers] = useState<MediaBuyer[]>(getDefaultBuyers)
  const [isLocked, setIsLocked] = useState(true)

  useEffect(() => {
    const stored = getMediaBuyers()
    if (stored.length > 0) {
      setBuyers(stored)
    }
    const locked = localStorage.getItem('dashboard-media-buyers-locked')
    if (locked !== null) {
      setIsLocked(locked === 'true')
    }
  }, [])

  const add = (name: string, prefix: string) => {
    const newBuyer = addMediaBuyer(name, prefix)
    setBuyers(prev => [...prev, newBuyer])
  }

  const remove = (id: string) => {
    removeMediaBuyer(id)
    setBuyers(prev => prev.filter(b => b.id !== id))
  }

  const update = (id: string, updates: { name?: string; prefix?: string }) => {
    updateMediaBuyer(id, updates)
    setBuyers(prev => prev.map(b => b.id === id ? { ...b, ...updates, prefix: updates.prefix?.toUpperCase().trim() ?? b.prefix } : b))
  }

  const setLocked = (locked: boolean) => {
    setIsLocked(locked)
    localStorage.setItem('dashboard-media-buyers-locked', String(locked))
  }

  return (
    <MediaBuyersContext.Provider value={{ buyers, add, remove, update, isLocked, setLocked }}>
      {children}
    </MediaBuyersContext.Provider>
  )
}

export function useMediaBuyers() {
  const ctx = useContext(MediaBuyersContext)
  if (!ctx) throw new Error('useMediaBuyers must be used within MediaBuyersProvider')
  return ctx
}