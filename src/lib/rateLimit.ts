// Rate limiter en memoria (best-effort).
//
// Nota: en entornos serverless (p. ej. Vercel) el estado vive por instancia,
// no es global. Sirve como primera barrera contra abuso/fuerza bruta, pero
// para límites estrictos conviene un store compartido (Redis/Upstash).

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; retryAfter: number } {
  const now = Date.now()

  // Purga ocasional de entradas vencidas para acotar el tamaño del Map.
  if (store.size > 5000) {
    for (const [k, entry] of store) {
      if (entry.resetAt <= now) store.delete(k)
    }
  }

  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfter: 0 }
  }

  if (entry.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }

  entry.count++
  return { ok: true, retryAfter: 0 }
}

export function getClientIp(request: Request): string {
  const xff = request.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}
