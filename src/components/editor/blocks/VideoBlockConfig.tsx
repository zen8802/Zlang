'use client'

import { useState } from 'react'
import { InspectorField, INPUT_CLASS, TEXTAREA_CLASS, SELECT_CLASS } from './shared'

interface SearchResult {
  videoId: string
  title: string
  thumbnailUrl: string
  channelTitle: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function VideoBlockConfig({ block, onChange }: { block: any; onChange: (b: any) => void }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    try {
      const res = await fetch('/api/youtube/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: search,
          // Search Crunchyroll Collection first (always JP audio)
          channelKey: 'crunchyrollCollection',
        }),
      })
      const data = await res.json()
      if (data.videoId) {
        setResults([data])
      } else {
        // Fallback: search Crunchyroll main
        const res2 = await fetch('/api/youtube/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: search + ' 日本語' }),
        })
        const data2 = await res2.json()
        if (data2.videoId) setResults([data2])
        else setResults([])
      }
    } catch {
      setResults([])
    }
    setSearching(false)
  }

  const selectClip = (clip: SearchResult) => {
    onChange({
      ...block,
      clipId: clip.videoId,
      clipTitle: clip.title,
      clipThumbnail: clip.thumbnailUrl,
    })
    setResults([])
    setSearch('')
  }

  return (
    <div className="space-y-3">
      {/* Search for JP clips */}
      <InspectorField label="Search anime clips (JP audio)">
        <div className="flex gap-1">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. spy x family anya"
            className={`${INPUT_CLASS} flex-1`}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            className="bg-[#1B4F8A] text-white px-3 py-2 rounded-[10px] text-xs font-bold hover:bg-[#133970] transition-colors disabled:opacity-50 shrink-0"
          >
            {searching ? '...' : '🔍'}
          </button>
        </div>
      </InspectorField>

      {/* Search results */}
      {results.length > 0 && (
        <div className="space-y-1.5">
          {results.map(clip => (
            <button
              key={clip.videoId}
              onClick={() => selectClip(clip)}
              className="w-full text-left p-2 rounded-[10px] border border-white/10 bg-white/5 hover:border-[#1B4F8A] transition-all flex items-center gap-2"
            >
              {clip.thumbnailUrl && (
                <img src={clip.thumbnailUrl} alt="" className="w-16 h-10 object-cover rounded shrink-0" />
              )}
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate">{clip.title}</p>
                <p className="text-gray-500 text-[10px]">{clip.channelTitle}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Currently selected clip */}
      {block.clipId && (
        <div className="bg-white/5 rounded-[12px] p-3 border border-white/10">
          <p className="text-xs text-gray-500 mb-1.5 font-bold">Selected clip</p>
          {block.clipThumbnail && (
            <img src={block.clipThumbnail} alt="" className="w-full h-24 object-cover rounded-lg mb-2" />
          )}
          <p className="text-white text-xs font-bold truncate">{block.clipTitle || block.clipId}</p>
          <p className="text-gray-600 text-[10px] mt-0.5 font-mono">{block.clipId}</p>
          <button onClick={() => onChange({ ...block, clipId: '', clipTitle: '', clipThumbnail: '' })} className="text-xs text-red-400 mt-2 hover:underline">Remove</button>
        </div>
      )}

      <div className="border-t border-white/5 pt-3" />

      {/* Manual entry */}
      <InspectorField label="Or paste YouTube Video ID">
        <input
          value={block.clipId || ''}
          onChange={e => onChange({ ...block, clipId: e.target.value })}
          placeholder="e.g. AATfuAJp48o"
          className={INPUT_CLASS}
        />
      </InspectorField>

      <InspectorField label="Clip Title">
        <input value={block.clipTitle || ''} onChange={e => onChange({ ...block, clipTitle: e.target.value })} placeholder="Video title..." className={INPUT_CLASS} />
      </InspectorField>

      <InspectorField label="Instruction">
        <textarea value={block.instruction || ''} onChange={e => onChange({ ...block, instruction: e.target.value })} rows={2} placeholder="Watch this clip carefully..." className={TEXTAREA_CLASS} />
      </InspectorField>

      <div className="grid grid-cols-2 gap-2">
        <InspectorField label="Start (sec)">
          <input type="number" value={block.startSeconds || 0} onChange={e => onChange({ ...block, startSeconds: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
        </InspectorField>
        <InspectorField label="End (sec)">
          <input type="number" value={block.endSeconds || 0} onChange={e => onChange({ ...block, endSeconds: parseInt(e.target.value) || 0 })} className={INPUT_CLASS} />
        </InspectorField>
      </div>

      <InspectorField label="Completion trigger">
        <select value={block.completionTrigger || 'watched'} onChange={e => onChange({ ...block, completionTrigger: e.target.value })} className={SELECT_CLASS}>
          <option value="watched">After watching</option>
          <option value="answered">After answering</option>
        </select>
      </InspectorField>
    </div>
  )
}
