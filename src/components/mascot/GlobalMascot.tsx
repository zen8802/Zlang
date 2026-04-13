'use client'

import { useMascot } from '@/contexts/MascotContext'
import { MascotCorner } from './MascotCorner'

export function GlobalMascot() {
  const { expression, isTalking } = useMascot()
  return <MascotCorner isTalking={isTalking} lastResult={null} isWaiting={false} expression={expression} />
}
