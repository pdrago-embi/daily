interface LoadingProps {
  message?: string
  variant?: 'text' | 'spinner' | 'skeleton'
}

export function Loading({ message = 'Cargando...', variant = 'text' }: LoadingProps) {
  if (variant === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        <p className="text-center text-slate-500">{message}</p>
      </div>
    )
  }

  return <p className="py-24 text-center text-slate-500">{message}</p>
}
