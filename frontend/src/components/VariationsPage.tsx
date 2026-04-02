import { VariationsTable } from './VariationsTable'

export function VariationsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <section>
        <h2 className="mb-6 text-center text-xl font-semibold text-slate-100">
          Principales variaciones
        </h2>
        <VariationsTable />
      </section>
    </div>
  )
}