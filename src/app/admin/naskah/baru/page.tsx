"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { withBasePath } from "@/lib/base-path";

const MAX_PAGES = 200;
const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
  const router = useRouter();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files || []);
    setError("");

    if (list.length > MAX_PAGES) {
      setError(`Maksimal ${MAX_PAGES} halaman per naskah`);
      return;
    }

    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      if (!ALLOWED_TYPES.includes(f.type)) {
        setError(`File ${i + 1}: hanya JPEG, PNG, atau WebP`);
        return;
      }
      if (f.size > MAX_FILE_BYTES) {
        setError(`File ${i + 1}: ukuran maksimal 15 MB`);
        return;
      }
    }

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
    setProgress("Membuat naskah...");

    try {
      // 1. Buat manuscript → dapat ID
      const initRes = await fetch(withBasePath("/api/upload/init"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, title }),
      });
      const initData = await initRes.json();

      if (!initRes.ok) {
        throw new Error(initData.error || "Gagal buat naskah");
      }

      const manuscriptId = initData.manuscriptId;

      // 2. Ambil dimensi semua gambar
      setProgress("Membaca dimensi gambar...");
      const dims = await Promise.all(files.map(getImageDimensions));

      // 3. Upload tiap file langsung ke Supabase
      const uploadedFiles: { path: string; w: number; h: number }[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(`Upload ${i + 1}/${files.length}...`);

        const urlRes = await fetch(withBasePath("/api/upload"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            manuscriptId,
            filename: file.name,
            contentType: file.type,
          }),
        });

        const urlData = await urlRes.json();
        if (!urlRes.ok) {
          throw new Error(
            urlData.error || `Gagal siapkan upload file ${i + 1}`
          );
        }

        const uploadRes = await fetch(urlData.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Gagal upload file ${i + 1}`);
        }

        uploadedFiles.push({
          path: urlData.path,
          w: dims[i].w,
          h: dims[i].h,
        });
      }

      // 4. Simpan data halaman
      setProgress("Menyimpan data...");
      const finalRes = await fetch(withBasePath("/api/upload/finalize"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscriptId, files: uploadedFiles }),
      });

      const finalData = await finalRes.json();
      if (!finalRes.ok) {
        throw new Error(finalData.error || "Gagal simpan data");
      }

      // 5. Redirect (pakai base-path)
      router.push(withBasePath(`/admin/naskah/${manuscriptId}`));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      setError(message);
      setLoading(false);
      setProgress("");
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

      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 max-w-2xl">
        💡 <strong>Info:</strong> Admin hanya perlu mengisi{" "}
        <strong>kode naskah</strong> dan <strong>gambar halaman</strong>.{" "}
        <strong>Judul &amp; metadata lengkap</strong> akan diisi oleh
        kontributor.
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-sky-100 p-6 space-y-6 max-w-3xl shadow-sm"
      >
        <div>
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 pb-2 border-b border-sky-100">
            🔖 Info Naskah
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Kode Naskah
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="cth: 0179 00004"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Judul Naskah{" "}
                <span className="text-slate-400 font-normal">
                  (opsional)
                </span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Kosongkan jika belum tahu"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3 pb-2 border-b border-sky-100">
            🖼️ Gambar Halaman
          </h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Upload Gambar <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFiles}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-teal-50 file:text-teal-700 file:font-medium file:cursor-pointer"
            />
            <p className="text-xs text-slate-500 mt-1">
              Urutan file = urutan halaman. Maks {MAX_PAGES} halaman, maks 15
              MB per file. Format: JPEG, PNG, WebP.
            </p>
          </div>

          {previews.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700 mb-2">
                Preview ({previews.length} halaman)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {previews.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`Preview ${i + 1}`}
                    className="w-full h-24 object-cover rounded border border-slate-200"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {progress && !error && (
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-800 font-medium">
            ⏳ {progress}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-2 border-t border-sky-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-6 py-2.5 rounded-lg font-medium hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 shadow-md transition"
          >
            {loading ? "Mengupload..." : "Upload Naskah"}
          </button>
          <Link
            href="/admin/naskah"
            className="px-6 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium transition"
          >
            Batal
          </Link>
        </div>
      </form>
    </div>
  );
}