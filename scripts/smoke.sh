#!/usr/bin/env bash
# Uji asap terhadap aplikasi yang sedang berjalan. Keluar dengan kode != 0 jika ada yang gagal.
#
#   scripts/smoke.sh                               # http://localhost:3001/oase1
#   BASE_URL=https://host/oase1 scripts/smoke.sh
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001/oase1}"
BASE_URL="${BASE_URL%/}"
ORIGIN="$(printf '%s' "$BASE_URL" | sed -E 's#^(https?://[^/]+).*#\1#')"

failed=0
body="$(mktemp)"
headers="$(mktemp)"
trap 'rm -f "$body" "$headers"' EXIT

report() { # report <ok|fail> <nama> <keterangan>
  local mark="LULUS"
  if [[ "$1" != ok ]]; then
    mark="GAGAL"
    failed=$((failed + 1))
  fi
  printf '%-6s %-44s %s\n' "$mark" "$2" "$3"
}

# Mengisi $body dan $headers, mencetak kode status (000 bila tidak tersambung).
fetch() {
  curl -sS -o "$body" -D "$headers" -w '%{http_code}' --max-time 30 "$1" 2>/dev/null || true
}

expect_status() { # expect_status <path> <kode>
  local code
  code="$(fetch "$BASE_URL$1")"
  if [[ "$code" == "$2" ]]; then
    report ok "GET ${1:-/}" "$code"
  else
    report fail "GET ${1:-/}" "$code (harap $2)"
  fi
}

echo "BASE_URL: $BASE_URL"
printf '%-6s %-44s %s\n' "HASIL" "UJI" "KETERANGAN"

for path in "" /login /register /kontributor-publik /ulasan; do
  expect_status "$path" 200
done

code="$(fetch "$BASE_URL/api/auth/providers")"
if [[ "$code" == 200 ]] && grep -q '"credentials"' "$body"; then
  report ok "GET /api/auth/providers" "200, memuat credentials"
else
  report fail "GET /api/auth/providers" "$code (harap 200 + JSON credentials)"
fi

code="$(fetch "$BASE_URL/api/platform-feedback?limit=1")"
ctype="$(grep -i '^content-type:' "$headers" | tr -d '\r' | tail -1)"
if [[ "$code" == 200 && "$ctype" == *application/json* ]]; then
  report ok "GET /api/platform-feedback?limit=1" "200 JSON"
else
  report fail "GET /api/platform-feedback?limit=1" "$code ${ctype:-tanpa content-type} (harap 200 JSON)"
fi

code="$(fetch "$BASE_URL")"
css="$(grep -oE '/[^" ]*_next/static/[^" ]+\.css' "$body" | head -1)"
if [[ -z "$css" ]]; then
  report fail "CSS di /_next/static/" "tidak ada rujukan CSS di HTML halaman utama ($code)"
else
  code="$(fetch "$ORIGIN$css")"
  if [[ "$code" == 200 ]]; then
    report ok "GET $css" "200"
  else
    report fail "GET $css" "$code (harap 200)"
  fi
fi

expect_status /api/export 401

code="$(fetch "$BASE_URL/admin")"
location="$(grep -i '^location:' "$headers" | tr -d '\r' | tail -1 | cut -d' ' -f2-)"
if [[ "$code" == 3* && "$location" == *"/login"* ]]; then
  report ok "GET /admin (tanpa login)" "$code -> $location"
else
  report fail "GET /admin (tanpa login)" "$code -> ${location:-tanpa Location} (harap 3xx ke /login)"
fi

echo
if ((failed > 0)); then
  echo "$failed uji GAGAL"
  exit 1
fi
echo "Semua uji lulus"
