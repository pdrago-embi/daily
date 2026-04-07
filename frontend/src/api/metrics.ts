export function getTodayDate(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
  const today = getTodayDate()
  const res = await fetch(`/api/sasha-publishers?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SashaPublishersResponse>
}

export async function fetchEmbiPublishers(): Promise<SashaPublishersResponse> {
  const today = getTodayDate()
  const res = await fetch(`/api/embi-publishers?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SashaPublishersResponse>
}

export async function fetchMediaBuyer(prefix: string): Promise<SashaPublishersResponse> {
  const today = getTodayDate()
  const res = await fetch(`/api/media-buyer/${encodeURIComponent(prefix)}?today=${today}`)
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
  const today = getTodayDate()
  const res = await fetch(`/api/summary?scope=${encodeURIComponent(scope)}&today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SummaryResponse>
}

export async function fetchSummaryByPrefix(prefix: string): Promise<SummaryResponse> {
  const today = getTodayDate()
  const res = await fetch(`/api/summary/by-prefix/${encodeURIComponent(prefix)}?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<SummaryResponse>
}

export async function fetchTrend(): Promise<TrendPoint[]> {
  const today = getTodayDate()
  const res = await fetch(`/api/trend?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchSashaTrend(): Promise<TrendPoint[]> {
  const today = getTodayDate()
  const res = await fetch(`/api/trend/sasha?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchEmbiTrend(): Promise<TrendPoint[]> {
  const today = getTodayDate()
  const res = await fetch(`/api/trend/embi?today=${today}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  const json = (await res.json()) as { data: TrendPoint[] }
  return json.data
}

export async function fetchTrendByPrefix(prefix: string): Promise<TrendPoint[]> {
  const today = getTodayDate()
  const res = await fetch(`/api/trend/by-prefix/${encodeURIComponent(prefix)}?today=${today}`)
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
  const today = getTodayDate()
  const sp = new URLSearchParams()
  sp.set('today', today)
  if (params?.period) sp.set('period', params.period)
  if (params?.aggregate) sp.set('aggregate', params.aggregate)
  if (params?.metric) sp.set('metric', params.metric)
  const q = sp.toString()
  const res = await fetch(`/api/variations?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<VariationsResponse>
}

export type TopTenPeriod = 'yesterday' | '7days' | '30days'
export type TopTenMetric = 'revenue' | 'impressions' | 'ad_requests'

export interface TopTenItem {
  name: string
  value: number
}

export interface TopTenAdUnitItem extends TopTenItem {
  publisherName?: string
}

export interface TopTenResponse {
  scope: string
  scopeLabel: string
  period: TopTenPeriod
  metric: TopTenMetric
  periodLabel: string
  dateRange: string
  topPublishers: TopTenItem[]
  topAdUnits: TopTenAdUnitItem[]
  topNetworks: TopTenItem[]
}

export async function fetchTopTen(period?: TopTenPeriod, metric?: TopTenMetric, scope?: string): Promise<TopTenResponse> {
  const today = getTodayDate()
  const params = new URLSearchParams()
  params.set('today', today)
  if (period) params.set('period', period)
  if (metric) params.set('metric', metric)
  if (scope) params.set('scope', scope)
  const q = params.toString()
  const res = await fetch(`/api/top-ten?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<TopTenResponse>
}

export interface DroppedAdUnit {
  name: string
  publisherName: string
  pastAvgDailyAr: number
  recentAvgDailyAr: number
  dropPct: number
  lastGoodDate: string
}

export interface DroppedAdUnitsResponse {
  scope: string
  scopeLabel: string
  pastPeriodLabel: string
  recentPeriodLabel: string
  dropped: DroppedAdUnit[]
}

export interface DroppedPublisher {
  name: string
  pastAvgDailyAr: number
  recentAvgDailyAr: number
  dropPct: number
  lastGoodDate: string
}

export interface DroppedPublishersResponse {
  scope: string
  scopeLabel: string
  pastPeriodLabel: string
  recentPeriodLabel: string
  dropped: DroppedPublisher[]
}

export async function fetchDroppedAdUnits(scope?: string): Promise<DroppedAdUnitsResponse> {
  const today = getTodayDate()
  const params = new URLSearchParams()
  params.set('today', today)
  if (scope) params.set('scope', scope)
  const q = params.toString()
  const res = await fetch(`/api/dropped-ad-units?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<DroppedAdUnitsResponse>
}

export async function fetchDroppedPublishers(scope?: string): Promise<DroppedPublishersResponse> {
  const today = getTodayDate()
  const params = new URLSearchParams()
  params.set('today', today)
  if (scope) params.set('scope', scope)
  const q = params.toString()
  const res = await fetch(`/api/dropped-publishers?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<DroppedPublishersResponse>
}

export interface DailyDropAdUnit {
  name: string
  publisherName: string
  previousAr: number
  currentAr: number
  dropPct: number
}

export interface DailyDropPublisher {
  name: string
  previousAr: number
  currentAr: number
  dropPct: number
}

export interface DailyRecoveredAdUnit {
  name: string
  publisherName: string
  previousAr: number
  currentAr: number
  increasePct: number
}

export interface DailyRecoveredPublisher {
  name: string
  previousAr: number
  currentAr: number
  increasePct: number
}

export interface DailyMetric {
  date: string
  revenue: number
  cost: number
  profit: number
}

export interface DailyDropAlertResponse {
  scope: string
  scopeLabel: string
  comparisonLabel: string
  isMondayComparison: boolean
  dailyMetrics: DailyMetric[]
  droppedAdUnits: DailyDropAdUnit[]
  droppedPublishers: DailyDropPublisher[]
  recoveredAdUnits: DailyRecoveredAdUnit[]
  recoveredPublishers: DailyRecoveredPublisher[]
}

export async function fetchDailyDropAlert(scope?: string): Promise<DailyDropAlertResponse> {
  const today = getTodayDate()
  const params = new URLSearchParams()
  params.set('today', today)
  if (scope) params.set('scope', scope)
  const q = params.toString()
  const res = await fetch(`/api/alerts/daily-drop?${q}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error((body as { error?: string }).error ?? res.statusText)
  }
  return res.json() as Promise<DailyDropAlertResponse>
}
