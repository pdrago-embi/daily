export type SummaryScope = 'general' | 'sasha' | 'embi'

export interface SummaryMetricTriple {
  prev: number
  current: number
  projected: number | null
}

export interface SummaryMetrics {
  adRequests: SummaryMetricTriple
  impressions: SummaryMetricTriple
  revenue: SummaryMetricTriple
  cost: SummaryMetricTriple
  profit: SummaryMetricTriple
  publisherCount: SummaryMetricTriple
}

export interface SummaryResponse {
  scope: SummaryScope
  prevMonthLabel: string
  currentMonthLabel: string
  daysElapsed: number
  daysInMonth: number
  hasCurrentMonthData: boolean
  metrics: SummaryMetrics
}