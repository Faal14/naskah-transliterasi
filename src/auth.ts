import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, resetRateLimit, MINUTE } from "@/lib/rate-limit";

// Status di JWT dibuat saat login dan bisa basi (mis. kontributor ditolak sesudahnya).
// Baca ulang dari database paling sering sekali per 5 menit per pengguna. Cache ada di
// memori proses karena server component tidak bisa menulis ulang cookie sesi.
const STATUS_TTL = 5 * MINUTE;
const statusCache = new Map<
  string,
  { checkedAt: number; status: Promise<string | null | undefined> }
>();

// Hasil: status terbaru, null bila pengguna sudah dihapus, undefined bila database
// tidak bisa dibaca (status lama di token dipertahankan).
function freshStatus(userId: string) {
  const now = Date.now();
  const cached = statusCache.get(userId);
  if (cached && now - cached.checkedAt < STATUS_TTL) return cached.status;

  const status = prisma.user
    .findUnique({ where: { id: userId }, select: { status: true } })
    .then((row) => (row ? row.status : null))
    .catch((err) => {
      console.error("Auth status refresh:", err);
      statusCache.delete(userId);
      return undefined;
    });
  statusCache.set(userId, { checkedAt: now, status });
  return status;
}

class RateLimitedSignin extends CredentialsSignin {
  code = "rate_limited";
}

// Host kampus dipakai bersama aplikasi lain: cookie diberi nama unik dan dibatasi ke
// basePath supaya tidak bentrok dan tidak ikut terkirim ke aplikasi lain.
// (__Host- tidak dipakai karena mewajibkan Path=/.)
const cookiePath = process.env.NEXT_PUBLIC_BASE_PATH || "/";
const secureCookies = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "").startsWith(
  "https://"
);
const authCookie = (name: string) => ({
  name: `${secureCookies ? "__Secure-" : ""}oase1-lontar.${name}`,
  options: {
    httpOnly: true,
    sameSite: "lax" as const,
    path: cookiePath,
    secure: secureCookies,
  },
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  useSecureCookies: secureCookies,
  cookies: {
    sessionToken: authCookie("session-token"),
    callbackUrl: authCookie("callback-url"),
    csrfToken: authCookie("csrf-token"),
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 20 percobaan per 15 menit per IP, dan 5 per 15 menit per email+IP (yang
        // terakhir dihapus saat login berhasil). Kunci per email+IP mencegah orang
        // lain mengunci akun cukup dengan mengetahui emailnya.
        const ip = clientIp(request.headers);
        const email = String(credentials.email).trim().toLowerCase();
        const limitKey = `login:${email}:${ip}`;
        if (
          !rateLimit(`login-ip:${ip}`, 20, 15 * MINUTE).ok ||
          !rateLimit(limitKey, 5, 15 * MINUTE).ok
        ) {
          throw new RateLimitedSignin();
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string },
          });

          if (!user) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );
          if (!valid) return null;

          resetRateLimit(limitKey);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
          };
        } catch (err) {
          console.error("Auth error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.status = (user as any).status;
        return token;
      }

      if (typeof token.id === "string") {
        const status = await freshStatus(token.id);
        if (status === null) return null; // pengguna dihapus: sesi tidak berlaku lagi
        if (status !== undefined) token.status = status;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).status = token.status;
      }
      return session;
    },
  },
});