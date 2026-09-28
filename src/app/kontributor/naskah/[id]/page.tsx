import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import AnnotationCanvas from "@/components/annotation-canvas";

export default async function WorkPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const { p } = await searchParams;
  const pageNum = Math.max(1, parseInt(p || "1"));

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });

  if (!manuscript) notFound();

  const currentPage = manuscript.pages.find(
    (pg) => pg.pageNumber === pageNum
  );
  if (!currentPage) notFound();

  // Signed URL untuk gambar
  const { data: signed } = await supabaseAdmin.storage
    .from("manuscripts")
    .createSignedUrl(currentPage.imageUrl, 3600);

  const imageUrl = signed?.signedUrl || "";

  // Anotasi untuk halaman ini
  const annotations = await prisma.annotation.findMany({
    where: { pageId: currentPage.id },
    orderBy: { createdAt: "asc" },
  });

  const totalPages = manuscript.pages.length;
  const prevPage = pageNum > 1 ? pageNum - 1 : null;
  const nextPage = pageNum < totalPages ? pageNum + 1 : null;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/kontributor"
          className="text-sm text-gray-600 hover:underline"
        >
          ← Daftar Naskah
        </Link>
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-xl font-bold">{manuscript.title}</h1>
            <div className="flex gap-3 mt-1 text-sm text-gray-600">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {manuscript.script}
              </span>
              <span>
                Halaman {pageNum} dari {totalPages}
              </span>
              <span>·</span>
              <span>{annotations.length} anotasi</span>
            </div>
          </div>

          <div className="flex gap-2">
            {prevPage ? (
              <Link
                href={`/kontributor/naskah/${id}?p=${prevPage}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-300">
                ← Sebelumnya
              </span>
            )}
            {nextPage ? (
              <Link
                href={`/kontributor/naskah/${id}?p=${nextPage}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Berikutnya →
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg text-gray-300">
                Berikutnya →
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <AnnotationCanvas
          pageId={currentPage.id}
          imageUrl={imageUrl}
          initialAnnotations={annotations.map((a) => ({
            id: a.id,
            x: a.x,
            y: a.y,
            w: a.w,
            h: a.h,
            transliteration: a.transliteration,
            translation: a.translation,
            notes: a.notes,
            pegonText: a.pegonText,
            status: a.status,
          }))}
        />
      </div>
    </div>
  );
}