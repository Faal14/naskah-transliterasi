"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateManuscriptMetadata } from "./actions";
import { COMMON_SCRIPTS } from "@/lib/script-label";

export default function MetadataForm({
  manuscriptId,
  initialData,
}: {
  manuscriptId: string;
  initialData: {
    title: string;
    script: string;
    language: string;
    author: string;
    period: string;
    mediaType: string;
    dimensions: string;
    abstract: string;
    illumination: string;
    illustration: string;
    watermark: string;
    year: string;
    source: string;
    description: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateManuscriptMetadata(manuscriptId, form);
      setMessage("✅ Metadata tersimpan. Silakan lanjut transliterasi.");
      router.refresh();
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan metadata";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl border-2 border-amber-300 p-6 shadow-md mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-amber-500 rounded"></div>
        <div>
          <h2 className="text-lg font-bold text-blue-900">
            📋 Isi Metadata Naskah
          </h2>
          <p className="text-xs text-slate-500">
            Metadata wajib diisi sebelum mulai transliterasi
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Section 1: Identitas */}
        <div>
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3 pb-2 border-b border-sky-100">
            📖 Identitas
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Judul Naskah <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
                placeholder="cth: Masā'il at-Ta'līm"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
              <p className="text-xs text-slate-500 mt-1">
                Judul asli naskah — biasanya tertulis di halaman pertama
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Aksara <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.script}
                  onChange={(e) => setForm({ ...form, script: e.target.value })}
                  required
                  placeholder="cth: Pegon, Carakan, Jawi"
                  list="common-scripts"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
                <datalist id="common-scripts">
                  {COMMON_SCRIPTS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMMON_SCRIPTS.slice(0, 6).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm({ ...form, script: s })}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition ${
                        form.script === s
                          ? "bg-teal-600 text-white"
                          : "bg-sky-50 text-slate-700 hover:bg-sky-100 border border-sky-200"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Bahasa
                </label>
                <input
                  type="text"
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                  placeholder="cth: Latin Jawa, Arab Pegon"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Pengarang / Penulis
                </label>
                <input
                  type="text"
                  value={form.author}
                  onChange={(e) => setForm({ ...form, author: e.target.value })}
                  placeholder="cth: Anonim"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tahun / Periode
                </label>
                <input
                  type="text"
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  placeholder="cth: 1545 Saka (1623 Masehi)"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tahun (Angka)
                </label>
                <input
                  type="text"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                  placeholder="cth: 1623"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sumber / Asal
                </label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder="cth: Perpusnas, Koleksi Pribadi"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Fisik */}
        <div>
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3 pb-2 border-b border-sky-100">
            📅 Metadata Fisik
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Jenis Bahan
              </label>
              <input
                type="text"
                value={form.mediaType}
                onChange={(e) =>
                  setForm({ ...form, mediaType: e.target.value })
                }
                placeholder="cth: Kertas Daluwang, Lontar"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ukuran Kertas
              </label>
              <input
                type="text"
                value={form.dimensions}
                onChange={(e) =>
                  setForm({ ...form, dimensions: e.target.value })
                }
                placeholder="cth: 20 cm x 10 cm (Horizontal)"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Illuminasi
              </label>
              <select
                value={form.illumination}
                onChange={(e) =>
                  setForm({ ...form, illumination: e.target.value })
                }
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
              >
                <option value="">— Belum dicek —</option>
                <option value="Ya">Ya</option>
                <option value="Tidak">Tidak</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ilustrasi
              </label>
              <input
                type="text"
                value={form.illustration}
                onChange={(e) =>
                  setForm({ ...form, illustration: e.target.value })
                }
                placeholder="cth: Ada, halaman 5"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Watermark
              </label>
              <input
                type="text"
                value={form.watermark}
                onChange={(e) =>
                  setForm({ ...form, watermark: e.target.value })
                }
                placeholder="cth: Cap Perpusnas"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Konten */}
        <div>
          <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-3 pb-2 border-b border-sky-100">
            📚 Konten & Deskripsi
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Abstrak (Isi Teks)
              </label>
              <textarea
                value={form.abstract}
                onChange={(e) =>
                  setForm({ ...form, abstract: e.target.value })
                }
                rows={4}
                placeholder="Ringkasan isi teks naskah, tema utama, atau catatan penting..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Deskripsi Singkat
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                placeholder="Deskripsi singkat untuk tampilan homepage..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700">
            {message}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-sky-100">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-6 py-2.5 rounded-lg font-medium hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-md transition"
          >
            {saving ? "Menyimpan..." : "💾 Simpan Metadata"}
          </button>
        </div>
      </form>
    </div>
  );
}