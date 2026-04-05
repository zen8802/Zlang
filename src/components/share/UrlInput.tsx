'use client'

import { useState } from 'react'

interface Props {
  onSubmit: (url: string) => void
  error: string | null
}

export default function UrlInput({ onSubmit, error }: Props) {
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)

  const handleChange = (val: string) => {
    setValue(val)
    if (val.includes('http') &&
      (val.includes('youtube') || val.includes('tiktok') || val.includes('youtu.be'))) {
      onSubmit(val.trim())
    }
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center px-6 bg-background">
      <div className="text-center mb-12">
        <h1 className="font-display text-4xl font-black" style={{ color: '#1B4F8A' }}>
          未来
        </h1>
        <p className="text-sm text-foreground/40 mt-1 font-body">
          Share any Japanese video to learn from it
        </p>
      </div>

      <div className={`w-full max-w-sm transition-transform duration-200 ${focused ? 'scale-105' : 'scale-100'}`}>
        <div className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 border-2 transition-colors duration-200 shadow-lg ${focused ? 'border-[#1B4F8A]' : 'border-transparent'}`}>
          <span className="text-xl">🔗</span>
          <input
            autoFocus
            type="url"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Paste YouTube or TikTok link..."
            className="flex-1 text-sm outline-none bg-transparent text-foreground placeholder-foreground/20 font-body"
          />
          {value && (
            <button onClick={() => onSubmit(value.trim())} className="text-sm font-bold font-display" style={{ color: '#1B4F8A' }}>
              Go
            </button>
          )}
        </div>
        {error && <p className="text-red-400 text-xs text-center mt-3">{error}</p>}
      </div>

      <div className="flex gap-2 mt-8">
        {['▶️ YouTube', '📱 Shorts', '🎵 TikTok'].map((p) => (
          <span key={p} className="text-xs text-foreground/30 bg-white px-3 py-1.5 rounded-full shadow-sm font-body">{p}</span>
        ))}
      </div>

      <p className="absolute bottom-12 text-xs text-foreground/20 text-center font-body">
        Add to home screen to use the share button
      </p>
    </div>
  )
}
