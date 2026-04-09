import { ReactNode } from 'react'

type BadgeColor = 'blue' | 'green' | 'gold' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md'
}

const COLORS: Record<BadgeColor, string> = {
  blue:   'bg-[#EBF0F8] text-[#1B4F8A] border border-[#1B4F8A]/20',
  green:  'bg-[#EFF5F0] text-[#3D6B4F] border border-[#3D6B4F]/20',
  gold:   'bg-[#F5F0E8] text-[#7A5C2E] border border-[#7A5C2E]/20',
  red:    'bg-[#F5EEEE] text-[#8B3A3A] border border-[#8B3A3A]/20',
  gray:   'bg-[#F0EDE8] text-[#6B6560] border border-[#6B6560]/20',
  purple: 'bg-[#F2EEFA] text-[#5B3D8A] border border-[#5B3D8A]/20',
}

export default function Badge({ children, color = 'blue', size = 'md' }: BadgeProps) {
  return (
    <span
      className={`
        ${COLORS[color]}
        ${size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'}
        rounded-full font-bold inline-flex items-center gap-1
      `}
    >
      {children}
    </span>
  )
}
