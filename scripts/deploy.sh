#!/usr/bin/env bash
# Mengunggah .next/standalone (hasil scripts/release.sh) ke server lalu me-restart PM2.
#
# Bawaan: DRY-RUN. Hanya mencetak perintah dan TIDAK menghubungi server.
# Eksekusi sungguhan hanya dengan argumen --go.
#
# Wajib env (tidak ada nilai bawaan):
#   DEPLOY_HOST         host server (atau alias di ~/.ssh/config)
#   DEPLOY_USER         pengguna SSH
#   DEPLOY_PATH         folder aplikasi di server, harus berakhiran /app
#   DEPLOY_RUNTIME_ENV  jalur env.sh di server (PATH node/pm2 + variabel aplikasi)
#   DEPLOY_PM2_NAME     nama proses PM2
#
# Contoh:
#   DEPLOY_HOST=... DEPLOY_USER=... DEPLOY_PATH=/var/www/mhs/oase1/app \
#   DEPLOY_RUNTIME_ENV=/var/www/mhs/oase1/runtime/env.sh DEPLOY_PM2_NAME=oase1-lontar \
#   scripts/deploy.sh          # dry-run
#   ... scripts/deploy.sh --go # sungguhan
set -euo pipefail

cd "$(dirname "$0")/.."

fail() {
  echo "GAGAL: $*" >&2
  exit 1
}

GO=0
case "${1:-}" in
  "") ;;
  --go) GO=1 ;;
  *) fail "argumen tidak dikenal: $1 (hanya --go)" ;;
esac
[[ $# -le 1 ]] || fail "terlalu banyak argumen"

: "${DEPLOY_HOST:?Set DEPLOY_HOST}"
: "${DEPLOY_USER:?Set DEPLOY_USER}"
: "${DEPLOY_PATH:?Set DEPLOY_PATH (harus berakhiran /app)}"
: "${DEPLOY_RUNTIME_ENV:?Set DEPLOY_RUNTIME_ENV (jalur env.sh di server)}"
: "${DEPLOY_PM2_NAME:?Set DEPLOY_PM2_NAME}"

# Nilai-nilai ini disisipkan ke perintah di server (termasuk rm -rf), jadi hanya
# karakter aman yang diterima.
[[ "$DEPLOY_HOST" =~ ^[A-Za-z0-9._-]+$ ]] || fail "DEPLOY_HOST berisi karakter tidak lazim"
[[ "$DEPLOY_USER" =~ ^[A-Za-z0-9._-]+$ ]] || fail "DEPLOY_USER berisi karakter tidak lazim"
[[ "$DEPLOY_PM2_NAME" =~ ^[A-Za-z0-9._-]+$ ]] || fail "DEPLOY_PM2_NAME berisi karakter tidak lazim"
[[ "$DEPLOY_PATH" =~ ^/[A-Za-z0-9._/-]+/app$ ]] ||
  fail "DEPLOY_PATH harus jalur absolut berakhiran /app (contoh: /var/www/mhs/oase1/app)"
[[ "$DEPLOY_RUNTIME_ENV" =~ ^/[A-Za-z0-9._/-]+$ ]] || fail "DEPLOY_RUNTIME_ENV harus jalur absolut"
[[ "$DEPLOY_PATH" != *..* && "$DEPLOY_RUNTIME_ENV" != *..* ]] || fail "jalur tidak boleh memuat '..'"

out=.next/standalone
[[ -f "$out/BUILD_INFO.txt" ]] || fail "$out/BUILD_INFO.txt tidak ada: jalankan scripts/release.sh dulu"
[[ -f "$out/server.js" ]] || fail "$out/server.js tidak ada"
if compgen -G "$out/.env*" > /dev/null; then
  fail "ada berkas .env di $out: rahasia tidak boleh ikut ter-upload"
fi

target="$DEPLOY_USER@$DEPLOY_HOST"
prev="${DEPLOY_PATH}-prev"

# Mencetak perintah; menjalankannya hanya pada mode --go.
run() {
  printf '+'
  printf ' %q' "$@"
  printf '\n'
  if ((GO)); then
    "$@"
  fi
}

echo "== Build yang akan dikirim"
cat "$out/BUILD_INFO.txt"
if grep -q -- '-dirty' "$out/BUILD_INFO.txt"; then
  echo "PERINGATAN: build dibuat dari working tree yang belum di-commit" >&2
fi
echo "tujuan   : $target:$DEPLOY_PATH"
echo "pm2      : $DEPLOY_PM2_NAME (env: $DEPLOY_RUNTIME_ENV)"
if ((GO)); then
  echo "mode     : EKSEKUSI (--go)"
else
  echo "mode     : DRY-RUN (tidak ada yang dijalankan; tambahkan --go untuk eksekusi)"
fi

echo "== 1. Cadangkan versi yang sedang berjalan ke $prev"
run ssh "$target" "rm -rf '$prev' && mkdir -p '$DEPLOY_PATH' && cp -a '$DEPLOY_PATH' '$prev'"

echo "== 2. Kirim build"
run rsync -avz --delete --exclude '.env*' "$out/" "$target:$DEPLOY_PATH/"

echo "== 3. Restart PM2"
run ssh "$target" "bash -c 'source $DEPLOY_RUNTIME_ENV && pm2 restart $DEPLOY_PM2_NAME --update-env'"

if ((GO)); then
  echo "== Selesai. Uji: BASE_URL=https://<host>/<basePath> scripts/smoke.sh"
else
  echo "== Dry-run selesai. Tidak ada perintah yang dijalankan."
fi
