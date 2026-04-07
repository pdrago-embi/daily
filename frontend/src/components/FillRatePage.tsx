import { useState, useEffect } from 'react'
import { LowFillRate } from './LowFillRate'
import { useMediaBuyers } from '../hooks/useMediaBuyers'
import { getDefaultMediaBuyer } from '../utils/mediaBuyerCookie'
import { ToggleGroup } from '../ui'

export function FillRatePage() {
  const { buyers } = useMediaBuyers()
  const [chartTab, setChartTab] = useState<string>('general')

  useEffect(() => {
    const defaultBuyerId = getDefaultMediaBuyer()
    if (defaultBuyerId) {
      const buyerExists = buyers.some(b => b.id === defaultBuyerId)
      if (buyerExists) {
        setChartTab(defaultBuyerId)
      }
    }
  }, [buyers])

  const tabOptions = [
    { value: 'general', label: 'General' },
    ...buyers.map(b => ({ value: b.id, label: b.name })),
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ToggleGroup
          options={tabOptions}
          value={chartTab}
          onChange={(v) => setChartTab(v as string)}
          label="Vista"
        />
      </div>
      <LowFillRate scope={chartTab} />
    </div>
  )
}