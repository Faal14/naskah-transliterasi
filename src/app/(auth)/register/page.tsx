"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    cvUrl: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Terjadi kesalahan");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 2500);
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-sky-100 p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-teal-50 mb-4">
            <span className="text-4xl">✅</span>
          </div>
          <h1 className="text-xl font-bold text-blue-900 mb-2">
            Pendaftaran Berhasil
          </h1>
          <p className="text-sm text-slate-600">
            Akun kamu sedang menunggu verifikasi admin. Kamu akan diarahkan ke
            halaman login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg mb-3">
            <span className="text-3xl">✍️</span>
          </div>
          <h1 className="text-3xl font-bold text-blue-900">
            Daftar Kontributor
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Bergabunglah melestarikan naskah Nusantara
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
              <p className="text-xs text-slate-500 mt-1">Minimal 6 karakter</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Link CV / Portofolio{" "}
                <span className="text-slate-400 font-normal">(opsional)</span>
              </label>
              <input
                type="url"
                value={form.cvUrl}
                onChange={(e) => setForm({ ...form, cvUrl: e.target.value })}
                placeholder="https://..."
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
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2.5 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-md transition"
            >
              {loading ? "Mendaftar..." : "Daftar"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-slate-600">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="text-teal-700 font-medium hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}