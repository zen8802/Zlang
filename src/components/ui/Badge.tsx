import { ReactNode } from 'react'

type BadgeColor = 'blue' | 'green' | 'gold' | 'red' | 'gray' | 'purple'

interface BadgeProps {
  children: ReactNode
  color?: BadgeColor
  size?: 'sm' | 'md'
}

const COLORS: Record<BadgeColor, string> = {
  blue: 'bg-[#EBF0F8] text-[#1B4F8A] border border-[#B8CBE0]',
  green: 'bg-[#E5F9D0] text-[#2D8800] border border-[#89E219]',
  gold: 'bg-[#FFF3CC] text-[#CC7700] border border-[#FFB800]',
  red: 'bg-[#FFE5E5] text-[#CC0000] border border-[#FF4B4B]',
  gray: 'bg-gray-100 text-gray-500 border border-gray-200',
  purple: 'bg-purple-50 text-purple-600 border border-purple-200',
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
