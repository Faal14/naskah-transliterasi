import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";

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
          className="text-sm text-gray-600 hover:underline"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl font-bold mt-2">{manuscript.title}</h1>
        <div className="flex gap-3 mt-2 text-sm text-gray-600">
          <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
            {manuscript.script}
          </span>
          {manuscript.year && <span>Tahun: {manuscript.year}</span>}
          {manuscript.source && <span>Sumber: {manuscript.source}</span>}
          <span>{manuscript.pages.length} halaman</span>
        </div>
        {manuscript.description && (
          <p className="text-sm text-gray-600 mt-3">
            {manuscript.description}
          </p>
        )}
      </div>

      <h2 className="text-lg font-semibold mb-4">Halaman</h2>

      {manuscript.pages.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          Belum ada halaman yang diupload.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {manuscript.pages.map((page) => (
            <div
              key={page.id}
              className="bg-white rounded-lg border overflow-hidden"
            >
              <div className="aspect-[3/4] bg-gray-100">
                {signedUrls[page.imageUrl] ? (
                  <img
                    src={signedUrls[page.imageUrl]}
                    alt={`Halaman ${page.pageNumber}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    Gambar tidak tersedia
                  </div>
                )}
              </div>
              <div className="p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Hal. {page.pageNumber}</span>
                  <span className="text-xs text-gray-500">{page.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}