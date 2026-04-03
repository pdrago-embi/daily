import { useTheme } from '../hooks/useTheme'

interface ChartToggleProps {
  label: string
  color: string
  active: boolean
  onToggle: () => void
}

export function ChartToggle({ label, color, active, onToggle }: ChartToggleProps) {
  const { theme } = useTheme()
  const textColor = theme === 'dark' 
    ? (active ? 'text-white' : 'text-slate-500') 
    : (active ? 'text-slate-900' : 'text-slate-500')

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium
        transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500
        ${textColor}
        ${!active ? 'line-through opacity-50 hover:opacity-75' : ''}
      `}
      style={active ? { backgroundColor: color + '30', border: `1px solid ${color}` } : {}}
    >
      <span
        className="h-3 w-3 rounded-full"
        style={{ backgroundColor: active ? color : '#64748b' }}
      />
      {label}
    </button>
  )
}