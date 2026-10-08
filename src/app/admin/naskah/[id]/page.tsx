import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatScript, getScriptColor } from "@/lib/script-label";

export default async function ManuscriptDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { pageNumber: "asc" } },
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
            {manuscript.title}
          </h1>
        </div>
        <div className="flex gap-3 mt-3 text-sm text-slate-600 ml-4 flex-wrap items-center">
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${getScriptColor(
              manuscript.script
            )}`}
          >
            {formatScript(manuscript.script)}
          </span>
          {manuscript.year && <span>Tahun: {manuscript.year}</span>}
          {manuscript.source && <span>Sumber: {manuscript.source}</span>}
          <span className="font-medium text-teal-700">
            {manuscript.pages.length} halaman
          </span>
        </div>
        {manuscript.description && (
          <p className="text-sm text-slate-600 mt-3 ml-4 max-w-3xl">
            {manuscript.description}
          </p>
        )}
      </div>

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