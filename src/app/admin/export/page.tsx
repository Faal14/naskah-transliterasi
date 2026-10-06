import { prisma } from "@/lib/prisma";

export default async function ExportPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, script: true },
  });

  const totalAnnotations = await prisma.annotation.count();
  const approvedAnnotations = await prisma.annotation.count({
    where: { status: "APPROVED" },
  });
  const submittedAnnotations = await prisma.annotation.count({
    where: { status: "SUBMITTED" },
  });
  const draftAnnotations = await prisma.annotation.count({
    where: { status: "DRAFT" },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Export Data</h1>
        <p className="text-sm text-gray-600 mt-1">
          Download data transliterasi &amp; terjemahan untuk keperluan riset,
          analisis, atau lampiran laporan.
        </p>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8 max-w-4xl">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Anotasi</p>
          <p className="text-2xl font-bold mt-1">{totalAnnotations}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-xs text-green-700">Approved</p>
          <p className="text-2xl font-bold mt-1 text-green-700">
            {approvedAnnotations}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-xs text-yellow-700">Menunggu Review</p>
          <p className="text-2xl font-bold mt-1 text-yellow-700">
            {submittedAnnotations}
          </p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-xs text-gray-600">Draft</p>
          <p className="text-2xl font-bold mt-1 text-gray-600">
            {draftAnnotations}
          </p>
        </div>
      </div>

      {/* Form Export */}
      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        <h2 className="font-semibold text-lg mb-4">Buat File Export</h2>

        <form action="/api/export" method="GET" className="space-y-5">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Format File
            </label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  defaultChecked
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <strong>JSON</strong>
                  <span className="text-gray-500">
                    {" "}
                    — untuk pengolahan data lanjutan
                  </span>
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  className="w-4 h-4"
                />
                <span className="text-sm">
                  <strong>CSV</strong>
                  <span className="text-gray-500">
                    {" "}
                    — untuk Excel / Google Sheets
                  </span>
                </span>
              </label>
            </div>
          </div>

          {/* Naskah */}
          <div>
            <label className="block text-sm font-medium mb-2">Naskah</label>
            <select
              name="manuscriptId"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Semua Naskah</option>
              {manuscripts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.script})
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Status Anotasi
            </label>
            <select
              name="status"
              defaultValue="APPROVED"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="APPROVED">
                Approved saja (rekomendasi untuk riset)
              </option>
              <option value="ALL">Semua status</option>
              <option value="SUBMITTED">Submitted saja</option>
              <option value="DRAFT">Draft saja</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Untuk keperluan akademis, disarankan hanya export anotasi yang
              sudah diverifikasi (Approved).
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700"
          >
            ⬇ Download File Export
          </button>
        </form>

        <div className="mt-6 pt-6 border-t text-xs text-gray-500 space-y-1">
          <p>
            <strong>Isi file JSON:</strong> metadata naskah, koordinat kotak
            (bounding box), transliterasi, terjemahan, teks asli, catatan
            filologis, dan riwayat review.
          </p>
          <p>
            <strong>Isi file CSV:</strong> kolom lengkap siap diimpor ke
            Excel/Sheets — cocok untuk lampiran laporan atau analisis
            statistik.
          </p>
        </div>
      </div>

      {/* Info penggunaan */}
      <div className="mt-8 max-w-2xl bg-blue-50 border border-blue-200 rounded-lg p-5 text-sm text-blue-900">
        <p className="font-medium mb-2">💡 Contoh penggunaan</p>
        <ul className="space-y-1 list-disc pl-5">
          <li>
            <strong>Riset filologi</strong>: analisis variasi transliterasi
            antar kontributor
          </li>
          <li>
            <strong>Dataset OCR</strong>: bounding box + label siap dilatih
            model OCR
          </li>
          <li>
            <strong>Lampiran skripsi/laporan</strong>: CSV untuk tabel
            transliterasi
          </li>
          <li>
            <strong>Arsip digital</strong>: JSON untuk backup data jangka
            panjang
          </li>
        </ul>
      </div>
    </div>
  );
}