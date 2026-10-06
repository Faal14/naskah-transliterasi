"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { seedDemoData, clearDemoData } from "./actions";
import Link from "next/link";

export default function DemoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    message: string;
    manuscripts?: { title: string; id: string }[];
  } | null>(null);

  async function handleSeed() {
    if (
      !confirm(
        "Buat 2 naskah demo (Pegon + Hanacaraka) dengan anotasi contoh?\n\nProses ini akan meng-upload gambar placeholder ke Supabase Storage dan memakan waktu 10-20 detik."
      )
    )
      return;

    setLoading(true);
    setResult(null);
    try {
      const res = await seedDemoData();
      setResult({
        type: "success",
        message: `Berhasil membuat ${res.manuscripts.length} naskah demo!`,
        manuscripts: res.manuscripts,
      });
      router.refresh();
    } catch (err: any) {
      setResult({
        type: "error",
        message: err.message || "Gagal membuat data demo",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (
      !confirm(
        "Hapus semua naskah demo (Hikayat Nabi Yusuf & Serat Wedhatama)?\n\nGambar di Supabase Storage juga akan dihapus."
      )
    )
      return;

    setClearing(true);
    setResult(null);
    try {
      const res = await clearDemoData();
      setResult({
        type: "success",
        message: `Berhasil menghapus ${res.count} naskah demo.`,
      });
      router.refresh();
    } catch (err: any) {
      setResult({
        type: "error",
        message: err.message || "Gagal menghapus data demo",
      });
    } finally {
      setClearing(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Data Demo</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-4">
        Buat data contoh untuk keperluan presentasi atau demo ke dosen.
      </p>

      <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
        {/* Card: Seed */}
        <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm">
          <div className="text-3xl mb-3">🌱</div>
          <h2 className="font-semibold text-lg mb-2 text-blue-900">Buat Data Demo</h2>
          <p className="text-sm text-slate-600 mb-4">
            Membuat 2 naskah contoh dengan anotasi terverifikasi:
          </p>
          <ul className="text-sm text-slate-600 space-y-1 mb-4 pl-5 list-disc">
            <li>
              <strong className="text-blue-900">Hikayat Nabi Yusuf</strong> —
              beraksara Pegon, 3 halaman, 7 anotasi
            </li>
            <li>
              <strong className="text-blue-900">Serat Wedhatama</strong> —
              beraksara Hanacaraka, 3 halaman, 8 anotasi
            </li>
            <li>Semua anotasi sudah berstatus APPROVED</li>
            <li>Gambar placeholder otomatis di-upload ke Supabase Storage</li>
          </ul>

          <button
            onClick={handleSeed}
            disabled={loading || clearing}
            className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-2.5 rounded-lg font-medium hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 shadow-md transition"
          >
            {loading ? "Memproses... (10-20 detik)" : "Buat Data Demo"}
          </button>
        </div>

        {/* Card: Clear */}
        <div className="bg-white rounded-xl border border-sky-100 p-6 shadow-sm">
          <div className="text-3xl mb-3">🗑️</div>
          <h2 className="font-semibold text-lg mb-2 text-blue-900">Hapus Data Demo</h2>
          <p className="text-sm text-slate-600 mb-4">
            Menghapus semua naskah demo yang pernah dibuat. Data naskah asli
            tidak akan terpengaruh.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800 mb-4">
            ⚠️ Hanya menghapus naskah berjudul{" "}
            <strong>&quot;Hikayat Nabi Yusuf&quot;</strong> dan{" "}
            <strong>&quot;Serat Wedhatama&quot;</strong>.
          </div>

          <button
            onClick={handleClear}
            disabled={loading || clearing}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 shadow-md transition"
          >
            {clearing ? "Menghapus..." : "Hapus Data Demo"}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 max-w-4xl rounded-xl border p-5 shadow-sm ${
            result.type === "success"
              ? "bg-green-50 border-green-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          <p
            className={`font-medium mb-2 ${
              result.type === "success" ? "text-green-800" : "text-red-800"
            }`}
          >
            {result.type === "success" ? "✓ " : "✕ "}
            {result.message}
          </p>

          {result.manuscripts && result.manuscripts.length > 0 && (
            <ul className="text-sm text-slate-700 space-y-1 mt-3">
              {result.manuscripts.map((m) => (
                <li key={m.id}>
                  📖 {m.title} —{" "}
                  <Link
                    href={`/naskah/${m.id}`}
                    className="text-teal-700 hover:underline font-medium"
                    target="_blank"
                  >
                    Lihat di publik
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}