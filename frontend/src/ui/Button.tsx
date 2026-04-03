import { type ButtonHTMLAttributes, forwardRef } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  active?: boolean
}

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-slate-700 text-white',
  secondary: 'bg-slate-700 text-white',
  ghost: 'text-slate-400 hover:text-slate-200',
  danger: 'bg-rose-600 text-white hover:bg-rose-500',
}

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'secondary', size = 'md', active, className, ...props }, ref) => {
    const activeClass = active ? 'ring-2 ring-violet-500' : ''
    return (
      <button
        ref={ref}
        className={`
          inline-flex items-center justify-center rounded-lg font-medium
          transition-colors focus:outline-none focus-visible:ring-2
          focus-visible:ring-violet-500 disabled:opacity-50
          ${variants[variant]} ${sizes[size]} ${activeClass} ${className ?? ''}
        `}
        {...props}
      />
    )
  }
)

Button.displayName = 'Button'