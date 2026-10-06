"use client";

import { useState } from "react";
import Link from "next/link";
import { createManuscript } from "../actions";

async function getImageDimensions(
  file: File
): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.width, h: img.height });
    img.onerror = () => resolve({ w: 0, h: 0 });
    img.src = URL.createObjectURL(file);
  });
}

export default function NewManuscriptPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setPreviews(list.map((f) => URL.createObjectURL(f)));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (files.length === 0) {
      setError("Pilih minimal 1 gambar halaman");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const dims = await Promise.all(files.map(getImageDimensions));
    formData.set("dimensions", JSON.stringify(dims));

    const result = await createManuscript(formData);

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/naskah"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Kembali ke daftar naskah
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-1 h-6 bg-teal-500 rounded"></div>
          <h1 className="text-2xl font-bold text-blue-900">
            Upload Naskah Baru
          </h1>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-sky-100 p-6 space-y-5 max-w-2xl shadow-sm"
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Judul Naskah <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Aksara <span className="text-red-500">*</span>
          </label>
          <select
            name="script"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          >
            <option value="">-- Pilih aksara --</option>
            <option value="PEGON">Pegon</option>
            <option value="HANACARAKA">Hanacaraka</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tahun / Perkiraan
            </label>
            <input
              type="text"
              name="year"
              placeholder="cth: 1890"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Sumber / Asal
            </label>
            <input
              type="text"
              name="source"
              placeholder="cth: Perpusnas"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Deskripsi
          </label>
          <textarea
            name="description"
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gambar Halaman (bisa multiple){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            name="pages"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer"
          />
          <p className="text-xs text-slate-500 mt-1">
            Urutan file = urutan halaman. Disarankan nama file urut (01.jpg,
            02.jpg, ...)
          </p>
        </div>

        {previews.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">
              Preview ({previews.length} halaman)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-24 object-cover rounded border border-slate-200"
                  />
                  <span className="absolute top-1 left-1 bg-blue-900/80 text-white text-xs px-1.5 py-0.5 rounded">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2 rounded-lg font-medium hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 shadow-md transition"
          >
            {loading ? "Mengupload..." : "Upload Naskah"}
          </button>
          <Link
            href="/admin/naskah"
            className="px-6 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}