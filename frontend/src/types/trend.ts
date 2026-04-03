export interface TrendPoint {
  date: string
  revenue: number
  cost: number
  profit: number
  dayOfWeek?: number
  isMonthStart?: boolean
}

export type TrendScope = 'general' | 'sasha'