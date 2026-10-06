"use client";

import { useState, Suspense } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setLoading(false);
      setError("Email atau password salah");
      return;
    }

    // Ambil session untuk tahu role user
    const session = await getSession();
    const user = session?.user as any;
    const role = user?.role;
    const status = user?.status;

    // Tentukan tujuan redirect
    let target = "/dashboard";

    if (callbackUrl && callbackUrl !== "/dashboard" && callbackUrl !== "/") {
      // Kalau user diarahkan ke login dari halaman tertentu, balik ke situ
      target = callbackUrl;
    } else if (role === "ADMIN") {
      target = "/admin";
    } else if (role === "CONTRIBUTOR" && status === "APPROVED") {
      target = "/kontributor";
    }
    // Reader / PENDING / REJECTED → tetap /dashboard (default)

    router.push(target);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Masuk</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Platform Transliterasi Naskah Pegon &amp; Hanacaraka
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <p className="text-sm text-center mt-6 text-gray-600">
          Belum punya akun?{" "}
          <Link href="/register" className="text-blue-600 hover:underline">
            Daftar sebagai kontributor
          </Link>
        </p>

        <div className="mt-6 pt-6 border-t text-xs text-gray-500 text-center space-y-1">
          <p className="font-medium text-gray-600 mb-1">Akun Demo:</p>
          <p>
            Admin: <code>admin@naskah.id</code> / <code>admin123</code>
          </p>
          <p>
            Kontributor: <code>test@naskah.id</code> / <code>test123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}