interface SkeletonProps {
  className?: string
  lines?: number
}

export function Skeleton({ className = '', lines = 1 }: SkeletonProps) {
  if (lines === 1) {
    return <div className={`animate-pulse rounded bg-slate-800 ${className}`} />
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={`animate-pulse rounded bg-slate-800 ${className}`} />
      ))}
    </div>
  )
}

export function SkeletonChart() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-around gap-2 h-64">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse rounded-t bg-slate-700 flex-1"
            style={{ height: `${30 + Math.random() * 60}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-xs text-slate-600">
        {Array.from({ length: 7 }).map((_, i) => (
          <span key={i}>--</span>
        ))}
      </div>
    </div>
  )
}

export function SkeletonCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonTopTen() {
  return (
    <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <Skeleton className="h-5 w-24 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, j) => (
              <div key={j} className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Skeleton className="h-4 w-4 shrink-0 mt-0.5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
                <Skeleton className="h-4 w-20 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="border-b border-slate-800 px-4 py-3">
        <Skeleton className="h-5 w-32" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 flex-1 max-w-48" />
            </div>
            <div className="flex gap-8 ml-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
