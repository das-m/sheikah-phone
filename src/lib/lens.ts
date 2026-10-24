const TOKEN_PREFIX = 'sheikah:'

export interface LensToken {
  kind: string
  id: string
}

/** Parses a QR payload of the form `sheikah:<kind>:<id>`. Anything else (foreign QR codes, URLs) is ignored. */
export function parseToken(raw: string): LensToken | null {
  if (!raw.startsWith(TOKEN_PREFIX)) return null
  const [kind, id, ...rest] = raw.slice(TOKEN_PREFIX.length).split(':')
  if (!kind || !id || rest.length > 0) return null
  return { kind, id }
}

export interface ConfirmOptions {
  /** Consecutive frames a code must be seen in before it counts. */
  frames: number
  /** After a code was confirmed, the same code is ignored for this long. */
  cooldownMs: number
}

export const defaultConfirmOptions: ConfirmOptions = {
  frames: 2,
  cooldownMs: 4000
}

/** Feed it one reading per frame (`null` = nothing seen); `push` returns a code once it is confirmed. */
export function createConfirmer(options: Partial<ConfirmOptions> = {}) {
  const { frames, cooldownMs } = { ...defaultConfirmOptions, ...options }
  let candidate: string | null = null
  let streak = 0
  const blockedUntil = new Map<string, number>()

  return {
    push(code: string | null, timeMs: number): string | null {
      if (code === null) {
        candidate = null
        streak = 0
        return null
      }
      if (code !== candidate) {
        candidate = code
        streak = 0
      }
      streak++
      if (streak < frames) return null
      if (timeMs < (blockedUntil.get(code) ?? -Infinity)) return null
      blockedUntil.set(code, timeMs + cooldownMs)
      streak = 0
      return code
    },
    reset() {
      candidate = null
      streak = 0
      blockedUntil.clear()
    }
  }
}
