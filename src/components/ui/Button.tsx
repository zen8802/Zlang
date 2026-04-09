'use client'

import { ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'correct' | 'wrong' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  className?: string
  icon?: ReactNode
  type?: 'button' | 'submit'
}

const VARIANTS: Record<Variant, { base: string; shadow: string; hover: string }> = {
  primary: {
    base: 'bg-[#1B4F8A] text-white',
    shadow: '',
    hover: 'hover:bg-[#4A7AB5] active:translate-y-px',
  },
  secondary: {
    base: 'bg-transparent text-[#1B4F8A] border border-[#E0DAD2]',
    shadow: '',
    hover: 'hover:border-[#1B4F8A] hover:bg-[#EBF0F8] active:translate-y-px',
  },
  ghost: {
    base: 'bg-transparent text-[#6B6560] underline decoration-[#E0DAD2] underline-offset-2',
    shadow: '',
    hover: 'hover:text-[#1A1814] hover:decoration-[#6B6560]',
  },
  correct: {
    base: 'bg-[#EFF5F0] text-[#3D6B4F] border border-[#B8D4C0]',
    shadow: '',
    hover: 'hover:bg-[#E0EDE4] active:translate-y-px',
  },
  wrong: {
    base: 'bg-[#F5EEEE] text-[#8B3A3A] border border-[#D4BABA]',
    shadow: '',
    hover: 'hover:bg-[#EDE4E4] active:translate-y-px',
  },
  gold: {
    base: 'bg-[#F5F0E8] text-[#7A5C2E] border border-[#D4C4A8]',
    shadow: '',
    hover: 'hover:bg-[#EDE8DC] active:translate-y-px',
  },
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-[6px]',
  md: 'px-6 py-3 text-sm rounded-[8px]',
  lg: 'px-8 py-3.5 text-base rounded-[8px]',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  fullWidth,
  className = '',
  icon,
  type = 'button',
}: ButtonProps) {
  const v = VARIANTS[variant]

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${v.base} ${v.shadow} ${v.hover}
        ${SIZES[size]}
        ${fullWidth ? 'w-full' : ''}
        font-bold tracking-wide
        transition-all duration-100 ease-out
        disabled:opacity-40 disabled:cursor-not-allowed
        disabled:active:translate-y-0
        flex items-center justify-center gap-2
        select-none cursor-pointer
        ${className}
      `}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  )
}
