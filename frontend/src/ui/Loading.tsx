interface LoadingProps {
  message?: string
}

export function Loading({ message = 'Cargando...' }: LoadingProps) {
  return <p className="py-24 text-center text-slate-500">{message}</p>
}