export function formatCurrency(
  n: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(n)
}

export function formatMoney(n: number): string {
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function formatCurrencyCompact(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatPercentage(
  n: number | null,
  options?: Intl.NumberFormatOptions
): string {
  if (n === null) return '—'
  const prefix = n >= 0 ? '+' : ''
  return `${prefix}${formatNumber(n, { minimumFractionDigits: 1, maximumFractionDigits: 1, ...options })}%`
}

export function formatNumber(n: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: 0,
    ...options,
  }).format(n)
}