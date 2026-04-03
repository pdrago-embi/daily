import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui'
import type { MediaBuyer } from '../utils/mediaBuyers'

interface MediaBuyerModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (name: string, prefix: string) => void
  existingPrefixes: string[]
}

export function AddMediaBuyerModal({ isOpen, onClose, onAdd, existingPrefixes }: MediaBuyerModalProps) {
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setName('')
      setPrefix('')
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPrefix = prefix.trim().toUpperCase()
    
    if (!trimmedName) {
      setError('El nombre es requerido')
      return
    }
    if (!trimmedPrefix) {
      setError('El prefijo es requerido')
      return
    }
    if (trimmedPrefix.length < 2) {
      setError('El prefijo debe tener al menos 2 caracteres')
      return
    }
    if (existingPrefixes.includes(trimmedPrefix)) {
      setError('Este prefijo ya está en uso')
      return
    }
    
    onAdd(trimmedName, trimmedPrefix)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Agregar Media Buyer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Nombre
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: John Doe"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Prefijo de publishers
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              placeholder="Ej: JD"
              maxLength={10}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Los publishers que empiezan con este prefijo aparecerán en su reporte
            </p>
          </div>
          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

interface RemoveMediaBuyerModalProps {
  isOpen: boolean
  onClose: () => void
  onRemove: () => void
  buyerName: string
}

export function RemoveMediaBuyerModal({ isOpen, onClose, onRemove, buyerName }: RemoveMediaBuyerModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Eliminar Media Buyer</h2>
        <p className="mb-6 text-slate-300">
          ¿Estás seguro de que deseas eliminar <strong className="text-slate-100">{buyerName}</strong>? 
          Esta acción no se puede deshacer y se eliminarán todos sus datos.
        </p>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={() => { onRemove(); onClose(); }}>
            Eliminar
          </Button>
        </div>
      </div>
    </div>
  )
}

interface EditMediaBuyerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string, prefix: string) => void
  buyer: MediaBuyer | null
  existingPrefixes: string[]
}

export function EditMediaBuyerModal({ isOpen, onClose, onSave, buyer, existingPrefixes }: EditMediaBuyerModalProps) {
  const [name, setName] = useState('')
  const [prefix, setPrefix] = useState('')
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && buyer) {
      setName(buyer.name)
      setPrefix(buyer.prefix)
      setError('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, buyer])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    const trimmedPrefix = prefix.trim().toUpperCase()
    
    if (!trimmedName) {
      setError('El nombre es requerido')
      return
    }
    if (!trimmedPrefix) {
      setError('El prefijo es requerido')
      return
    }
    if (trimmedPrefix.length < 2) {
      setError('El prefijo debe tener al menos 2 caracteres')
      return
    }
    const otherPrefixes = existingPrefixes.filter(p => p !== buyer?.prefix)
    if (otherPrefixes.includes(trimmedPrefix)) {
      setError('Este prefijo ya está en uso')
      return
    }
    
    onSave(trimmedName, trimmedPrefix)
    onClose()
  }

  if (!isOpen || !buyer) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Editar Media Buyer</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Nombre
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Prefijo de publishers
            </label>
            <input
              type="text"
              value={prefix}
              onChange={(e) => setPrefix(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-100 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              Los publishers que empiezan con este prefijo aparecerán en su reporte
            </p>
          </div>
          {error && (
            <p className="text-sm text-rose-400">{error}</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}