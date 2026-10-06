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

    const session = await getSession();
    const user = session?.user as any;
    const role = user?.role;
    const status = user?.status;

    let target = "/dashboard";
    if (callbackUrl && callbackUrl !== "/dashboard" && callbackUrl !== "/") {
      target = callbackUrl;
    } else if (role === "ADMIN") {
      target = "/admin";
    } else if (role === "CONTRIBUTOR" && status === "APPROVED") {
      target = "/kontributor";
    }

    router.push(target);
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-900 to-teal-700 shadow-lg mb-3">
            <span className="text-2xl font-bold text-white">L</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900 tracking-wide">
            LONTAR
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Literasi Online, Naskah Transliterasi &amp; Alih-bahasa
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-8">
          <h2 className="text-xl font-bold text-blue-900 mb-1 text-center">
            Masuk
          </h2>
          <p className="text-xs text-slate-500 text-center mb-6">
            Silakan masuk ke akun Anda
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-2.5 rounded-lg font-medium hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 shadow-md transition"
            >
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-slate-600">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="text-teal-700 font-medium hover:underline"
            >
              Daftar sebagai kontributor
            </Link>
          </p>
        </div>

        <div className="mt-6 bg-white/80 backdrop-blur border border-sky-100 rounded-xl p-4 text-xs text-slate-600 text-center space-y-1">
          <p className="font-medium text-slate-700 mb-1">🔑 Akun Demo</p>
          <p>
            Admin:{" "}
            <code className="bg-sky-50 px-1 rounded text-blue-800">
              admin@naskah.id
            </code>{" "}
            /{" "}
            <code className="bg-sky-50 px-1 rounded text-blue-800">
              admin123
            </code>
          </p>
          <p>
            Kontributor:{" "}
            <code className="bg-teal-50 px-1 rounded text-teal-800">
              test@naskah.id
            </code>{" "}
            /{" "}
            <code className="bg-teal-50 px-1 rounded text-teal-800">
              test123
            </code>
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