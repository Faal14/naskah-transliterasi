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
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Data Demo</h1>
        <p className="text-sm text-gray-600 mt-1">
          Buat data contoh untuk keperluan presentasi atau demo ke dosen.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-5 max-w-4xl">
        {/* Card: Seed */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-3xl mb-3">🌱</div>
          <h2 className="font-semibold text-lg mb-2">Buat Data Demo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Membuat 2 naskah contoh dengan anotasi terverifikasi:
          </p>
          <ul className="text-sm text-gray-600 space-y-1 mb-4 pl-5 list-disc">
            <li>
              <strong>Hikayat Nabi Yusuf</strong> — beraksara Pegon, 3 halaman,
              7 anotasi
            </li>
            <li>
              <strong>Serat Wedhatama</strong> — beraksara Hanacaraka, 3
              halaman, 8 anotasi
            </li>
            <li>Semua anotasi sudah berstatus APPROVED</li>
            <li>Gambar placeholder otomatis di-upload ke Supabase Storage</li>
          </ul>

          <button
            onClick={handleSeed}
            disabled={loading || clearing}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Memproses... (10-20 detik)" : "Buat Data Demo"}
          </button>
        </div>

        {/* Card: Clear */}
        <div className="bg-white rounded-lg border p-6">
          <div className="text-3xl mb-3">🗑️</div>
          <h2 className="font-semibold text-lg mb-2">Hapus Data Demo</h2>
          <p className="text-sm text-gray-600 mb-4">
            Menghapus semua naskah demo yang pernah dibuat. Data naskah asli
            tidak akan terpengaruh.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-800 mb-4">
            ⚠️ Hanya menghapus naskah berjudul <strong>"Hikayat Nabi Yusuf"</strong>{" "}
            dan <strong>"Serat Wedhatama"</strong>.
          </div>

          <button
            onClick={handleClear}
            disabled={loading || clearing}
            className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {clearing ? "Menghapus..." : "Hapus Data Demo"}
          </button>
        </div>
      </div>

      {result && (
        <div
          className={`mt-6 max-w-4xl rounded-lg border p-5 ${
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
            <ul className="text-sm text-gray-700 space-y-1 mt-3">
              {result.manuscripts.map((m) => (
                <li key={m.id}>
                  📖 {m.title} —{" "}
                  <Link
                    href={`/naskah/${m.id}`}
                    className="text-blue-600 hover:underline"
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

      <div className="mt-8 max-w-4xl bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-900">
        <p className="font-medium mb-1">💡 Tips untuk presentasi</p>
        <p>
          Setelah data demo dibuat, buka{" "}
          <Link href="/" className="underline font-medium">
            halaman publik
          </Link>{" "}
          untuk melihat 2 naskah yang siap didemokan. Semua anotasi sudah
          terverifikasi dan bisa di-hover untuk melihat transliterasi.
        </p>
      </div>
    </div>
  );
}