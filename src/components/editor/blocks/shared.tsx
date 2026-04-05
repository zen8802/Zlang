import { ReactNode } from 'react'

export function InspectorField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </label>
      {children}
    </div>
  )
}

export const INPUT_CLASS = 'w-full bg-white/10 text-white text-sm rounded-[10px] px-3 py-2 border border-white/10 focus:outline-none focus:border-[#1B4F8A] transition-colors placeholder-gray-600'

export const TEXTAREA_CLASS = 'w-full bg-white/10 text-white text-sm rounded-[10px] px-3 py-2 border border-white/10 focus:outline-none focus:border-[#1B4F8A] transition-colors placeholder-gray-600 resize-none'

export const SELECT_CLASS = 'w-full bg-white/10 text-white text-sm rounded-[10px] px-3 py-2 border border-white/10 focus:outline-none focus:border-[#1B4F8A] appearance-none'
