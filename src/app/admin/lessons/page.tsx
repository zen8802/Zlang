'use client'

import { useRouter } from 'next/navigation'

export default function AdminLessonsIndex() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center px-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-semibold text-center text-[#1B4F8A] mb-8" style={{ fontFamily: 'var(--font-ui)' }}>
          Lesson Editor
        </h1>

        <button
          onClick={() => router.push('/admin/lessons/enjp')}
          className="w-full bg-white rounded-[10px] p-6 text-left cursor-pointer transition-all hover:-translate-y-1 active:translate-y-[2px]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E0DAD2' }}
        >
          <div className="text-3xl mb-2">🇺🇸 → 🇯🇵</div>
          <h2 className="text-xl font-semibold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-ui)' }}>
            English → Japanese
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">Lessons for English speakers learning Japanese</p>
        </button>

        <button
          onClick={() => router.push('/admin/lessons/jpen')}
          className="w-full bg-white rounded-[10px] p-6 text-left cursor-pointer transition-all hover:-translate-y-1 active:translate-y-[2px]"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E0DAD2' }}
        >
          <div className="text-3xl mb-2">🇯🇵 → 🇺🇸</div>
          <h2 className="text-xl font-semibold text-[#1A1A2E]" style={{ fontFamily: 'var(--font-ui)' }}>
            Japanese → English
          </h2>
          <p className="text-sm text-[#6B7280] mt-1">Lessons for Japanese speakers learning English</p>
        </button>
      </div>
    </div>
  )
}
