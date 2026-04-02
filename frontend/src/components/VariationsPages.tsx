import { VariationsTable } from './VariationsTable'

export function RevenueVariationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section>
        <h2 className="mb-6 text-center text-xl font-semibold text-slate-100">
          Principales Variaciones - Revenue
        </h2>
        <VariationsTable metric="revenue" />
      </section>
    </div>
  )
}

export function ImpressionsVariationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section>
        <h2 className="mb-6 text-center text-xl font-semibold text-slate-100">
          Principales Variaciones - Impressions
        </h2>
        <VariationsTable metric="impressions" />
      </section>
    </div>
  )
}