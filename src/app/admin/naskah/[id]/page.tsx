import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatScript } from "@/lib/script-label";

export default async function ManuscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();

  const { id } = await params;

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { pageNumber: "asc" } },
      _count: { select: { ratings: true, comments: true } },
    },
  });

  if (!manuscript) notFound();

  const paths = manuscript.pages.map((p) => p.imageUrl);
  const signedUrls: Record<string, string> = {};

  if (paths.length > 0) {
    const { data } = await supabaseAdmin.storage
      .from("manuscripts")
      .createSignedUrls(paths, 3600);
    if (data) {
      data.forEach((item) => {
        if (item.signedUrl && item.path) {
          signedUrls[item.path] = item.signedUrl;
        }
      });
    }
  }

  const isMetadataComplete = !!manuscript.script && !!manuscript.title;

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/naskah"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Kembali
        </Link>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-1 h-6 bg-teal-500 rounded"></div>
          <h1 className="text-2xl font-bold text-blue-900">
            {manuscript.title || (
              <span className="text-slate-400 italic">
                Naskah {manuscript.code || "tanpa judul"}
              </span>
            )}
          </h1>
        </div>
        {manuscript.code && (
          <p className="text-sm text-slate-500 mt-1 ml-4 font-mono">
            Kode: {manuscript.code}
          </p>
        )}
        <div className="flex gap-3 mt-3 text-sm text-slate-600 ml-4 flex-wrap items-center">
          {manuscript.script ? (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
              {formatScript(manuscript.script)}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
              ⏳ Metadata belum diisi
            </span>
          )}
          {manuscript.year && <span>Tahun: {manuscript.year}</span>}
          <span className="font-medium text-teal-700">
            {manuscript.pages.length} halaman
          </span>
        </div>
      </div>

      {!isMetadataComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900 mb-6 max-w-3xl">
          <p className="font-medium mb-1">⏳ Metadata belum lengkap</p>
          <p className="text-amber-800">
            Kontributor akan mengisi judul, aksara, bahasa, pengarang, abstrak,
            dan metadata lainnya saat mulai mengerjakan naskah ini.
          </p>
        </div>
      )}

      {isMetadataComplete && (
        <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-50 px-5 py-3 border-b border-sky-100">
            <h2 className="font-bold text-blue-900 text-sm">
              📋 Metadata Naskah (diisi kontributor)
            </h2>
          </div>
          <div className="p-5 grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <Row label="Judul" value={manuscript.title} />
            <Row label="Aksara" value={formatScript(manuscript.script || "")} />
            <Row label="Bahasa" value={manuscript.language} />
            <Row label="Pengarang / Penulis" value={manuscript.author} />
            <Row label="Tahun / Periode" value={manuscript.period} />
            <Row label="Tahun (Angka)" value={manuscript.year} />
            <Row label="Sumber / Asal" value={manuscript.source} />
            <Row label="Jenis Bahan" value={manuscript.mediaType} />
            <Row label="Ukuran Kertas" value={manuscript.dimensions} />
            <Row label="Illuminasi" value={manuscript.illumination} />
            <Row label="Ilustrasi" value={manuscript.illustration} />
            <Row label="Watermark" value={manuscript.watermark} />
            <Row
              label="Rating"
              value={`${manuscript._count.ratings} rating`}
            />
            <Row
              label="Komentar"
              value={`${manuscript._count.comments} komentar`}
            />
            {manuscript.abstract && (
              <div className="md:col-span-2">
                <p className="text-slate-500 text-xs mb-1">
                  Abstrak (Isi Teks)
                </p>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {manuscript.abstract}
                </p>
              </div>
            )}
            {manuscript.description && (
              <div className="md:col-span-2">
                <p className="text-slate-500 text-xs mb-1">Deskripsi</p>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {manuscript.description}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-teal-500 rounded"></div>
        <h2 className="text-lg font-bold text-blue-900">Halaman</h2>
      </div>

      {manuscript.pages.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-8 text-center text-slate-500 shadow-sm">
          Belum ada halaman yang diupload.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {manuscript.pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm hover:shadow-md hover:border-teal-300 transition-all"
            >
              <div className="aspect-[3/4] bg-sky-50">
                {signedUrls[page.imageUrl] ? (
                  <img
                    src={signedUrls[page.imageUrl]}
                    alt={`Halaman ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>
              <div className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900">
                    Hal. {page.pageNumber}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      page.status === "PUBLISHED"
                        ? "bg-green-100 text-green-700"
                        : page.status === "REVIEW"
                          ? "bg-yellow-100 text-yellow-700"
                          : page.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {page.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-start gap-1 md:gap-4 border-b border-sky-50 pb-2 last:border-0">
      <p className="text-slate-500 text-xs md:w-40 shrink-0 md:pt-0.5">
        {label}
      </p>
      <p className="text-slate-800 flex-1">
        {value || <span className="text-slate-300 italic">—</span>}
      </p>
    </div>
  );
}