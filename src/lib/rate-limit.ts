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

// Setiap proxy tepercaya menambahkan alamat yang dilihatnya di ujung KANAN
// x-forwarded-for; entri di sebelah kirinya dikirim klien dan bisa dipalsukan.
// TRUSTED_PROXY_HOPS = jumlah proxy tepercaya di depan aplikasi (bawaan 1: Nginx saja);
// dibaca saat runtime, lalu diambil entri ke-N dari kanan.
export function clientIp(headers: Headers) {
  const hops = Math.max(1, parseInt(process.env.TRUSTED_PROXY_HOPS ?? "1", 10) || 1);
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  // Lebih sedikit entri daripada lompatan: pakai yang paling kiri yang tersedia.
  const ip = entries[Math.max(0, entries.length - hops)];
  return ip || headers.get("x-real-ip") || "unknown";
}

export const HOUR = 60 * 60 * 1000;
export const MINUTE = 60 * 1000;
