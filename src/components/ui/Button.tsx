'use client'

import { motion } from 'framer-motion'
import { forwardRef } from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  type?: 'button' | 'submit'
  className?: string
  ariaLabel?: string
}

const variantStyles: Record<string, string> = {
  primary:
    'bg-accent text-background font-semibold shadow-[0_0_20px_rgba(27,79,138,0.25)] hover:shadow-[0_0_30px_rgba(27,79,138,0.4)]',
  secondary:
    'bg-black/[0.03] backdrop-blur-glass border border-black/10 text-foreground hover:bg-black/[0.05] hover:border-black/20',
  ghost:
    'bg-transparent text-foreground hover:bg-black/[0.03]',
  danger:
    'bg-red-500/80 text-foreground font-semibold shadow-[0_0_20px_rgba(239,68,68,0.25)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(239,68,68,0.4)]',
}

const sizeStyles: Record<string, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-base rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-lg rounded-xl gap-2.5',
}

const Spinner = ({ size }: { size: string }) => {
  const dimensions = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
  return (
    <svg
      className={`animate-spin ${dimensions}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      onClick,
      disabled = false,
      loading = false,
      fullWidth = false,
      icon,
      type = 'button',
      className = '',
      ariaLabel,
    },
    ref,
  ) => {
    const isDisabled = disabled || loading

    return (
      <motion.button
        ref={ref}
        type={type}
        onClick={isDisabled ? undefined : onClick}
        disabled={isDisabled}
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        aria-busy={loading}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={[
          'relative inline-flex items-center justify-center font-body transition-colors duration-200 select-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {loading && <Spinner size={size} />}
        {!loading && icon && (
          <span className="shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}
        <span>{children}</span>
      </motion.button>
    )
  },
)

Button.displayName = 'Button'

export default Button
