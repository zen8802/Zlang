'use client'

import { useState, useEffect } from 'react'
import { getClipById } from '@/data/clips'

const CACHE_KEY = 'zlang_clip_cache_v2'
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

interface CachedClip {
  videoId: string
  title: string
  resolvedAt: number
}

function getCache(): Record<string, CachedClip> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(cache: Record<string, CachedClip>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

/**
 * Resolves a clip's YouTube video ID via the search API.
 * Starts with no video (loading state), fetches from API,
 * caches for 7 days. Only falls back to hardcoded ID if
 * the clip has no searchQuery configured.
 */
export function useResolvedClip(clipId: string) {
  const clip = getClipById(clipId)
  const hasSearch = !!(clip?.searchQuery)

  // Start empty if we need to search, use hardcoded only if no searchQuery
  const [resolvedVideoId, setResolvedVideoId] = useState<string>(
    hasSearch ? '' : (clip?.youtubeId || '')
  )
  const [resolvedTitle, setResolvedTitle] = useState<string>('')
  const [isResolving, setIsResolving] = useState(hasSearch)

  useEffect(() => {
    if (!clip || !clip.searchQuery) return

    // Check cache first
    const cache = getCache()
    const cached = cache[clipId]
    if (cached && Date.now() - cached.resolvedAt < CACHE_TTL) {
      setResolvedVideoId(cached.videoId)
      setResolvedTitle(cached.title)
      setIsResolving(false)
      return
    }

    // Fetch from YouTube search API
    let cancelled = false
    setIsResolving(true)

    fetch('/api/youtube/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: clip.searchQuery,
        channelId: clip.channelId,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Search failed: ${res.status}`)
        return res.json()
      })
      .then((data) => {
        if (cancelled) return
        if (data.videoId) {
          setResolvedVideoId(data.videoId)
          setResolvedTitle(data.title || '')
          // Cache the result
          const c = getCache()
          c[clipId] = {
            videoId: data.videoId,
            title: data.title || '',
            resolvedAt: Date.now(),
          }
          setCache(c)
        } else {
          // API returned no results — use hardcoded as last resort
          setResolvedVideoId(clip.youtubeId)
        }
      })
      .catch(() => {
        // Network error — use hardcoded as last resort
        if (!cancelled) {
          setResolvedVideoId(clip.youtubeId)
        }
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false)
      })

    return () => {
      cancelled = true
    }
  }, [clipId, clip, hasSearch])

  return {
    clip,
    videoId: resolvedVideoId,
    resolvedTitle,
    isResolving,
  }
}
