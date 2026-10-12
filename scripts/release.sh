#!/usr/bin/env bash
# Membuat build rilis standalone di .next/standalone.
#
# Wajib env : NEXT_PUBLIC_SUPABASE_URL, NEXTAUTH_URL
# Opsional  : NEXT_PUBLIC_BASE_PATH (kosong = root/subdomain, contoh: /oase1)
#
# Contoh:
#   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
#   NEXT_PUBLIC_BASE_PATH=/oase1 \
#   NEXTAUTH_URL=https://host/oase1/api/auth \
#   scripts/release.sh
set -euo pipefail

cd "$(dirname "$0")/.."

: "${NEXT_PUBLIC_SUPABASE_URL:?Set NEXT_PUBLIC_SUPABASE_URL}"
: "${NEXTAUTH_URL:?Set NEXTAUTH_URL (contoh: https://host/oase1/api/auth)}"
export NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH:-}"
export NEXT_PUBLIC_SUPABASE_URL NEXTAUTH_URL

fail() {
  echo "GAGAL: $*" >&2
  exit 1
}

# basePath ikut tertanam di bundle klien; nilai yang salah baru ketahuan setelah deploy.
if [[ -n "$NEXT_PUBLIC_BASE_PATH" && ! "$NEXT_PUBLIC_BASE_PATH" =~ ^/[^[:space:]]*[^/[:space:]]$ ]]; then
  fail "NEXT_PUBLIC_BASE_PATH harus diawali '/' dan tanpa '/' di akhir (contoh: /oase1)"
fi
if [[ "$NEXTAUTH_URL" != *"${NEXT_PUBLIC_BASE_PATH}/api/auth" ]]; then
  fail "NEXTAUTH_URL harus berakhiran '${NEXT_PUBLIC_BASE_PATH}/api/auth'"
fi

supabase_host="${NEXT_PUBLIC_SUPABASE_URL#*://}"
supabase_host="${supabase_host%%/*}"

echo "== Konfigurasi build"
echo "basePath      : ${NEXT_PUBLIC_BASE_PATH:-(kosong, root)}"
echo "NEXTAUTH_URL  : $NEXTAUTH_URL"
echo "host Supabase : $supabase_host"
echo "node          : $(node -v)"

echo "== Bersihkan .next"
rm -rf .next

echo "== npm ci"
npm ci --fetch-timeout=600000 --fetch-retries=5 --fetch-retry-maxtimeout=120000

echo "== prisma generate"
npx prisma generate

echo "== next build"
npm run build

out=.next/standalone
[[ -f "$out/server.js" ]] || fail "$out/server.js tidak ada (output: \"standalone\" aktif?)"

echo "== Salin aset statis"
cp -r public "$out/public"
cp -r .next/static "$out/.next/static"

compgen -G "$out/node_modules/.prisma/client/libquery_engine*" > /dev/null ||
  fail "libquery_engine* tidak ada di $out/node_modules/.prisma/client (jalankan 'npx prisma generate' dan periksa binaryTargets)"

# next build ikut menyalin berkas .env ke hasil standalone; rahasia tidak boleh ikut ter-upload.
rm -f "$out"/.env*
compgen -G "$out/.env*" > /dev/null && fail "berkas .env masih ada di $out"

commit="$(git rev-parse --short HEAD)"
[[ -z "$(git status --porcelain)" ]] || commit="$commit-dirty"
{
  echo "commit   : $commit"
  echo "tanggal  : $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "basePath : ${NEXT_PUBLIC_BASE_PATH:-(kosong)}"
} > "$out/BUILD_INFO.txt"

echo "== Selesai: $out"
cat "$out/BUILD_INFO.txt"
