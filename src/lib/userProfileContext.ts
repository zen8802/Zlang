// ---------------------------------------------------------------------------
// Back-compat wrapper for the legacy `buildProfileContext` helper. New code
// should import `buildLanguageProfile` directly from '@/lib/user-profile'.
//
// The payload type here keeps both `birthYear` (the new canonical field) and
// `age` (legacy: derived client-side) so existing callers don't have to flip
// at the same time. If only `age` is supplied we infer a synthetic birth year.
// ---------------------------------------------------------------------------

import { buildLegacyProfileContext } from './user-profile'

export interface UserProfilePayload {
  direction?: 'en-to-jp' | 'jp-to-en' | null
  birthYear?: number | null
  /** @deprecated Use birthYear. Kept for back-compat with older Zustand state. */
  age?: number | null
  gender?: string | null
  experience?: number | null
}

export function buildProfileContext(
  profile: UserProfilePayload | null | undefined,
): string {
  if (!profile) return ''

  // Translate legacy `age` to birth year if needed.
  const birthYear =
    profile.birthYear ??
    (typeof profile.age === 'number' && profile.age > 0
      ? new Date().getFullYear() - profile.age
      : undefined)

  return buildLegacyProfileContext({
    gender: profile.gender,
    birthYear,
    experienceLevel: profile.experience,
  })
}
