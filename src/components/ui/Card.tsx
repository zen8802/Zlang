import { ReactNode } from 'react'

type CardVariant = 'default' | 'elevated' | 'flat' | 'bordered'

interface CardProps {
  children: ReactNode
  variant?: CardVariant
  className?: string
  onClick?: () => void
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const PADDING: Record<string, string> = {
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-6',
  none: '',
}

const VARIANTS: Record<CardVariant, string> = {
  default: 'bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_4px_0_rgba(0,0,0,0.04)] border border-gray-100',
  elevated: 'bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08),0_6px_0_rgba(0,0,0,0.05)] border border-gray-100',
  flat: 'bg-[#FAF8F5] border border-gray-100',
  bordered: 'bg-white border-2 border-[#B8CBE0]',
}

export default function Card({
  children,
  variant = 'default',
  className = '',
  onClick,
  padding = 'md',
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-[20px] transition-all duration-200
        ${VARIANTS[variant]}
        ${PADDING[padding]}
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.10)] active:translate-y-[2px] active:shadow-none' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
