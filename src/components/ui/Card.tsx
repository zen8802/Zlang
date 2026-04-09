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
  default: 'bg-[#FDFBF8] border border-[#E0DAD2]',
  elevated: 'bg-[#FDFBF8] border border-[#E0DAD2] shadow-[0_2px_12px_rgba(26,24,20,0.08)]',
  flat: 'bg-[#F5F0EB] border border-[#E0DAD2]',
  bordered: 'bg-[#FDFBF8] border-2 border-[#1B4F8A]/20',
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
        rounded-[10px] transition-all duration-200
        ${VARIANTS[variant]}
        ${PADDING[padding]}
        ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_2px_12px_rgba(26,24,20,0.10)] active:translate-y-px' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
