'use client'

import { useState } from 'react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function GenericBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [json, setJson] = useState(JSON.stringify(block, null, 2))
  const [error, setError] = useState<string | null>(null)

  const handleBlur = () => {
    try {
      const parsed = JSON.parse(json)
      onChange(parsed)
      setError(null)
    } catch {
      setError('Invalid JSON')
    }
  }

  return (
    <div>
      <p className="text-xs text-gray-500 mb-2">Edit block JSON directly:</p>
      <textarea
        value={json}
        onChange={e => { setJson(e.target.value); setError(null) }}
        onBlur={handleBlur}
        rows={20}
        className={`w-full bg-white/5 text-gray-300 text-xs font-mono rounded-[10px] px-3 py-2 border focus:outline-none resize-none ${error ? 'border-red-500' : 'border-white/10 focus:border-[#1B4F8A]'}`}
        spellCheck={false}
      />
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
