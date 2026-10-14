import { NextRequest } from "next/server";
import { handlers } from "@/auth";
import { withBasePath } from "@/lib/base-path";

// Next menghapus basePath dari URL request di route handler, sedangkan Auth.js
// mencocokkan path dengan AUTH_URL (yang memuat basePath, mis. /oase1/api/auth).
// Tanpa ini semua /api/auth/* membalas 400 UnknownAction saat basePath dipakai.
function restoreBasePath(req: NextRequest) {
  const url = new URL(req.url);
  const prefixed = withBasePath(url.pathname);
  if (prefixed === url.pathname || url.pathname.startsWith(withBasePath("/api/"))) {
    return req;
  }
  url.pathname = prefixed;
  return new NextRequest(url, req);
}

export const GET = (req: NextRequest) => handlers.GET(restoreBasePath(req));
export const POST = (req: NextRequest) => handlers.POST(restoreBasePath(req));
