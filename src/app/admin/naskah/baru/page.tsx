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
          className="text-sm text-gray-600 hover:underline"
        >
          ← Kembali ke daftar naskah
        </Link>
        <h1 className="text-2xl font-bold mt-2">Upload Naskah Baru</h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg border p-6 space-y-5 max-w-2xl"
      >
        <div>
          <label className="block text-sm font-medium mb-1">
            Judul Naskah *
          </label>
          <input
            type="text"
            name="title"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Aksara *</label>
          <select
            name="script"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Pilih aksara --</option>
            <option value="PEGON">Pegon</option>
            <option value="HANACARAKA">Hanacaraka</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tahun / Perkiraan
            </label>
            <input
              type="text"
              name="year"
              placeholder="cth: 1890"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Sumber / Asal
            </label>
            <input
              type="text"
              name="source"
              placeholder="cth: Perpusnas"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Deskripsi</label>
          <textarea
            name="description"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Gambar Halaman (bisa multiple) *
          </label>
          <input
            type="file"
            name="pages"
            multiple
            accept="image/*"
            onChange={handleFiles}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700"
          />
          <p className="text-xs text-gray-500 mt-1">
            Urutan file = urutan halaman. Disarankan nama file urut (01.jpg,
            02.jpg, ...)
          </p>
        </div>

        {previews.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">
              Preview ({previews.length} halaman)
            </p>
            <div className="grid grid-cols-4 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative">
                  <img
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <span className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
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
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Mengupload..." : "Upload Naskah"}
          </button>
          <Link
            href="/admin/naskah"
            className="px-6 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}