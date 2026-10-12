import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, resetRateLimit, MINUTE } from "@/lib/rate-limit";

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // 5 percobaan per 15 menit per email; dihapus saat login berhasil.
        const limitKey = `login:${String(credentials.email).trim().toLowerCase()}`;
        if (!rateLimit(limitKey, 5, 15 * MINUTE).ok) {
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