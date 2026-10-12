// Rate limit jendela tetap, in-memory: cukup untuk satu proses PM2, reset saat restart.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count++;
  return { ok: true, retryAfter: 0 };
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}

// Aplikasi berada di belakang Nginx. Entri TERAKHIR x-forwarded-for adalah alamat yang
// dilihat Nginx; entri sebelumnya dikirim klien dan bisa dipalsukan.
export function clientIp(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  const last = forwarded?.split(",").pop()?.trim();
  return last || headers.get("x-real-ip") || "unknown";
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
