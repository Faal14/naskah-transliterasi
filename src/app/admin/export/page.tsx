import { prisma } from "@/lib/prisma";

export default async function ExportPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { title: "asc" },
    select: { id: true, title: true, script: true },
  });

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
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Export Data</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-4">
        Download data transliterasi &amp; terjemahan untuk keperluan riset,
        analisis, atau lampiran laporan.
      </p>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-3 mb-8 max-w-4xl">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-green-700">Approved</p>
          <p className="text-2xl font-bold mt-1 text-green-700">
            {approvedAnnotations}
          </p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-yellow-700">Menunggu Review</p>
          <p className="text-2xl font-bold mt-1 text-yellow-700">
            {submittedAnnotations}
          </p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs text-slate-600">Draft</p>
          <p className="text-2xl font-bold mt-1 text-slate-600">
            {draftAnnotations}
          </p>
        </div>
      </div>

      {/* Form Export */}
      <div className="bg-white rounded-xl border border-sky-100 p-6 max-w-2xl shadow-sm">
        <h2 className="font-semibold text-lg mb-4 text-blue-900">
          Buat File Export
        </h2>

        <form action="/api/export" method="GET" className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Format File
            </label>
            <div className="flex gap-4 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  defaultChecked
                  className="w-4 h-4 accent-teal-600"
                />
                <span className="text-sm">
                  <strong className="text-blue-900">JSON</strong>
                  <span className="text-slate-500">
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
                  className="w-4 h-4 accent-teal-600"
                />
                <span className="text-sm">
                  <strong className="text-blue-900">CSV</strong>
                  <span className="text-slate-500">
                    {" "}
                    — untuk Excel / Google Sheets
                  </span>
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Naskah
            </label>
            <select
              name="manuscriptId"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            >
              <option value="ALL">Semua Naskah</option>
              {manuscripts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({m.script})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Status Anotasi
            </label>
            <select
              name="status"
              defaultValue="APPROVED"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            >
              <option value="APPROVED">
                Approved saja (rekomendasi untuk riset)
              </option>
              <option value="ALL">Semua status</option>
              <option value="SUBMITTED">Submitted saja</option>
              <option value="DRAFT">Draft saja</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white py-2.5 rounded-lg font-medium hover:from-blue-900 hover:to-blue-950 shadow-md transition"
          >
            ⬇ Download File Export
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-sky-100 text-xs text-slate-500 space-y-1">
          <p>
            <strong className="text-slate-700">Isi file JSON:</strong> metadata
            naskah, koordinat kotak (bounding box), transliterasi, terjemahan,
            teks asli, catatan filologis, dan riwayat review.
          </p>
          <p>
            <strong className="text-slate-700">Isi file CSV:</strong> kolom
            lengkap siap diimpor ke Excel/Sheets.
          </p>
        </div>
      </div>
    </div>
  );
}