'use client'

import { useState, useEffect, useCallback } from 'react'

interface ChannelInfo {
  channel_id: string
  channel_name: string
  content_type: string
  total_clips: number
  last_mined: string | null
  active: boolean
}

interface Stats {
  totalClips: number
  byType: Array<{ content_type: string; count: number }> | null
  byLevel: Array<{ jlpt_level: string; count: number }> | null
  channels: ChannelInfo[] | null
}

export default function ClipAdmin() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [mining, setMining] = useState(false)
  const [miningChannel, setMiningChannel] = useState<string | null>(null)
  const [result, setResult] = useState<Record<string, unknown> | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(() => {
    fetch('/api/clips/stats')
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error)
        else setStats(data)
      })
      .catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const mineAll = async () => {
    setMining(true)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/clips/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mineAll: true }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
      loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setMining(false)
    }
  }

  const mineSingle = async (channelId: string) => {
    setMiningChannel(channelId)
    setResult(null)
    setError(null)
    try {
      const res = await fetch('/api/clips/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      })
      const data = await res.json()
      if (data.error) setError(data.error)
      else setResult(data)
      loadStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setMiningChannel(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-foreground mb-2">
        Clip Library
      </h1>
      <p className="text-sm text-foreground/40 mb-8">
        Mine anime channels, index clips, search by grammar and level.
      </p>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="glass-card p-4">
            <div className="text-3xl font-bold text-accent">{stats.totalClips}</div>
            <div className="text-xs text-foreground/40 mt-1">Total Clips</div>
          </div>
          {stats.byType?.map((t) => (
            <div key={t.content_type} className="glass-card p-4">
              <div className="text-3xl font-bold text-foreground">{t.count}</div>
              <div className="text-xs text-foreground/40 mt-1 capitalize">{t.content_type}</div>
            </div>
          ))}
        </div>
      )}

      {/* JLPT breakdown */}
      {stats?.byLevel && stats.byLevel.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
            By JLPT Level
          </h2>
          <div className="flex gap-2">
            {stats.byLevel.map((l) => (
              <div key={l.jlpt_level} className="glass-card px-4 py-2 text-center">
                <div className="text-lg font-bold text-foreground">{l.count}</div>
                <div className="text-xs text-foreground/40">{l.jlpt_level}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channels */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-foreground/60 uppercase tracking-wider mb-3">
          Channels
        </h2>
        <div className="space-y-2">
          {stats?.channels?.map((c) => (
            <div
              key={c.channel_id}
              className="glass-card p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {c.channel_name}
                </p>
                <p className="text-xs text-foreground/40">
                  {c.content_type} &middot; {c.total_clips} clips
                  {c.last_mined && (
                    <> &middot; Last mined {new Date(c.last_mined).toLocaleDateString()}</>
                  )}
                </p>
              </div>
              <button
                onClick={() => mineSingle(c.channel_id)}
                disabled={miningChannel === c.channel_id}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50 transition-opacity"
                style={{ backgroundColor: '#1B4F8A' }}
              >
                {miningChannel === c.channel_id ? 'Mining...' : 'Mine'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mine all button */}
      <button
        onClick={mineAll}
        disabled={mining}
        className="w-full py-4 rounded-xl font-display font-bold text-lg text-white disabled:opacity-50 transition-opacity"
        style={{ backgroundColor: '#1B4F8A' }}
      >
        {mining ? 'Mining all channels...' : 'Mine All Channels'}
      </button>

      {/* Result output */}
      {result && (
        <pre className="mt-6 p-4 glass-card text-xs text-foreground/60 overflow-auto max-h-80 rounded-xl">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
