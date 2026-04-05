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
    shadow: 'shadow-[0_4px_0_#133970]',
    hover: 'hover:brightness-110 active:shadow-none active:translate-y-[4px]',
  },
  secondary: {
    base: 'bg-white text-[#1B4F8A] border-2 border-[#B8CBE0]',
    shadow: 'shadow-[0_4px_0_#B8CBE0]',
    hover: 'hover:bg-[#EBF0F8] active:shadow-none active:translate-y-[4px]',
  },
  ghost: {
    base: 'bg-transparent text-[#6B7280]',
    shadow: '',
    hover: 'hover:bg-black/5',
  },
  correct: {
    base: 'bg-[#58CC02] text-white',
    shadow: 'shadow-[0_4px_0_#46A302]',
    hover: 'hover:brightness-105 active:shadow-none active:translate-y-[4px]',
  },
  wrong: {
    base: 'bg-[#FF4B4B] text-white',
    shadow: 'shadow-[0_4px_0_#CC0000]',
    hover: 'hover:brightness-105 active:shadow-none active:translate-y-[4px]',
  },
  gold: {
    base: 'bg-[#FFB800] text-white',
    shadow: 'shadow-[0_4px_0_#CC9200]',
    hover: 'hover:brightness-105 active:shadow-none active:translate-y-[4px]',
  },
}

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm rounded-[12px]',
  md: 'px-6 py-3.5 text-base rounded-[16px]',
  lg: 'px-8 py-4 text-lg rounded-[20px]',
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
