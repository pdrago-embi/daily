import { formatCurrency, formatNumber, formatPercentage } from '../utils/formatters'

export type DeltaFormat = 'money' | 'int' | 'percentage'

interface DeltaCellProps {
  delta: number
  format?: DeltaFormat
}

export function DeltaCell({ delta, format = 'money' }: DeltaCellProps) {
  const positive = delta >= 0

  const formatted =
    format === 'money'
      ? formatCurrency(delta, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : format === 'percentage'
        ? formatPercentage(delta)
        : formatNumber(delta)

  return (
    <span
      className={positive ? 'font-medium text-emerald-400' : 'font-medium text-rose-400'}
    >
      {positive ? '+' : ''}
      {formatted}
    </span>
  )
}

interface DeltaPctCellProps {
  deltaPct: number | null
}

export function DeltaPctCell({ deltaPct }: DeltaPctCellProps) {
  if (deltaPct === null) {
    return <span className="text-slate-500">—</span>
  }
  const positive = deltaPct >= 0
  return (
    <span className={positive ? 'text-emerald-400' : 'text-rose-400'}>
      {formatPercentage(deltaPct)}
    </span>
  )
}