
interface ToggleGroupProps {
  options: { value: string; label: string }[]
  value: string
  onChange: (value: string) => void
  label?: string
  variant?: 'default' | 'violet'
}

interface ToggleGroupItemProps {
  label: string
  isSelected: boolean
  onSelect: () => void
  variant?: 'default' | 'violet'
}

function ToggleGroupItem({
  label,
  isSelected,
  onSelect,
  variant = 'default',
}: ToggleGroupItemProps) {
  const baseClass = 'rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
  
  const variantClasses = variant === 'violet'
    ? {
        active: 'bg-violet-900/80 text-violet-100 ring-1 ring-violet-500/40',
        inactive: 'text-slate-400 hover:text-slate-200',
      }
    : {
        active: 'bg-slate-700 text-white',
        inactive: 'text-slate-400 hover:text-slate-200',
      }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${baseClass} ${isSelected ? variantClasses.active : variantClasses.inactive}`}
    >
      {label}
    </button>
  )
}

export function ToggleGroup({
  options,
  value,
  onChange,
  label,
  variant = 'default',
}: ToggleGroupProps) {
  const containerClass = 'inline-flex flex-shrink-0 flex-wrap justify-center gap-1 rounded-xl border border-slate-700 bg-slate-950/50 p-1'

  return (
    <div
      role={label ? 'group' : 'tablist'}
      aria-label={label}
      className={containerClass}
    >
      {options.map((opt) => (
        <ToggleGroupItem
          key={opt.value}
          label={opt.label}
          isSelected={value === opt.value}
          onSelect={() => onChange(opt.value)}
          variant={variant}
        />
      ))}
    </div>
  )
}