export interface TrendPoint {
  date: string
  revenue: number
  cost: number
  profit: number
}

export interface VariationRow {
  id: string
  name: string
  publisherName?: string
  revenueCurrent: number
  revenuePrevious: number
  delta: number
  deltaPct: number | null
  impressionsCurrent?: number
  impressionsPrevious?: number
  impressionsDelta?: number
  impressionsDeltaPct?: number | null
  adRequestsCurrent?: number
  adRequestsPrevious?: number
  adRequestsDelta?: number
  adRequestsDeltaPct?: number | null
}

export type VariationPeriod = 'day' | 'week' | 'month'
export type VariationAggregate = 'total' | 'avg'
export type VariationMetric = 'revenue' | 'impressions' | 'ad_requests'

export interface VariationsResponse {
  period: VariationPeriod
  aggregate: VariationAggregate
  metric: VariationMetric
  periodCurrentLabel: string
  periodPreviousLabel: string
  publishers: VariationRow[]
  adUnits: VariationRow[]
  networks: VariationRow[]
  networksByPublisher: VariationRow[]
}

export type SummaryScope = 'general' | 'sasha' | 'embi'

export interface SashaPublishersResponse {
  currentMonthLabel: string
  dateRange: string
  daysElapsed: number
  daysInMonth: number
  hasCurrentMonthData: boolean
  totals: {
    adRequests: number
    impressions: number
    revenue: number
    cost: number
    profit: number
    projectedAdRequests: number
    projectedImpressions: number
    projectedRevenue: number
    projectedCost: number
    projectedProfit: number
  }
  publishers: {
    publisher_id: number
    publisher_name: string
    adRequests: number
    impressions: number
    revenue: number
    cost: number
    profit: number
  }[]
  daily: {
    date: string
    adRequests: number
    impressions: number
    revenue: number
    cost: number
    profit: number
  }[]
}

export async function fetchSashaPublishers(): Promise<SashaPublishersResponse> {
  const res = await fetch('/api/sasha-publishers')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SashaPublishersResponse>
}

export async function fetchEmbiPublishers(): Promise<SashaPublishersResponse> {
  const res = await fetch('/api/embi-publishers')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SashaPublishersResponse>
}

export interface SummaryMetricTriple {
  prev: number
  current: number
  projected: number | null
}

export interface SummaryResponse {
  scope: SummaryScope
  prevMonthLabel: string
  currentMonthLabel: string
  daysElapsed: number
  daysInMonth: number
  hasCurrentMonthData: boolean
  metrics: {
    adRequests: SummaryMetricTriple
    impressions: SummaryMetricTriple
    revenue: SummaryMetricTriple
    cost: SummaryMetricTriple
    profit: SummaryMetricTriple
    publisherCount: SummaryMetricTriple
  }
}

export async function fetchSummary(scope: SummaryScope): Promise<SummaryResponse> {
  const res = await fetch(`/api/summary?scope=${encodeURIComponent(scope)}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SummaryResponse>
}

export async function fetchTrend(): Promise<TrendPoint[]> {
  const res = await fetch('/api/trend')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchSashaTrend(): Promise<TrendPoint[]> {
  const res = await fetch('/api/trend/sasha')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchEmbiTrend(): Promise<TrendPoint[]> {
  const res = await fetch('/api/trend/embi')
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchVariations(params?: {
  period?: VariationPeriod
  aggregate?: VariationAggregate
  metric?: VariationMetric
}): Promise<VariationsResponse> {
  const sp = new URLSearchParams()
  if (params?.period) sp.set('period', params.period)
  if (params?.aggregate) sp.set('aggregate', params.aggregate)
  if (params?.metric) sp.set('metric', params.metric)
  const q = sp.toString()
  const res = await fetch(`/api/variations${q ? `?${q}` : ''}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<VariationsResponse>
}
