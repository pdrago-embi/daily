interface SortHeaderProps {
  label: string
  column: string
  activeColumn: string | null
  direction: 'asc' | 'desc'
  onSort: (column: string) => void
  align?: 'left' | 'right'
  title?: string
}

export function SortHeader({
  label,
  column,
  activeColumn,
  direction,
  onSort,
  align = 'left',
  title,
}: SortHeaderProps) {
  const isActive = activeColumn === column
  const arrow = !isActive ? '' : direction === 'asc' ? ' ↑' : ' ↓'

  return (
    <th
      className={`whitespace-nowrap px-2 py-3 font-medium cursor-pointer hover:text-violet-300 transition-colors sm:px-4 ${
        align === 'right' ? 'text-right' : ''
      }`}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span title={title ?? label}>{label}</span>
        {isActive && <span className="text-violet-300">{arrow}</span>}
      </div>
    </th>
  )
}