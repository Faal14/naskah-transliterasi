import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewCanvas from "./review-canvas";

export default async function ReviewManuscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ manuscriptId: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { manuscriptId } = await params;
  const { p } = await searchParams;
  const pageNum = Math.max(1, parseInt(p || "1"));

  const manuscript = await prisma.manuscript.findUnique({
    where: { id: manuscriptId },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        include: {
          annotations: {
            orderBy: { createdAt: "asc" },
            include: {
              contributor: { select: { name: true } },
              reviews: {
                orderBy: { createdAt: "desc" },
                include: {
                  reviewer: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!manuscript) notFound();

  const currentPage = manuscript.pages.find(
    (pg) => pg.pageNumber === pageNum
  );
  if (!currentPage) notFound();

  const { data: signed } = await supabaseAdmin.storage
    .from("manuscripts")
    .createSignedUrl(currentPage.imageUrl, 3600);

  const imageUrl = signed?.signedUrl || "";

  const totalPages = manuscript.pages.length;
  const prevPage = pageNum > 1 ? pageNum - 1 : null;
  const nextPage = pageNum < totalPages ? pageNum + 1 : null;

  const annotations = currentPage.annotations.map((a) => ({
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
    contributorName: a.contributor.name,
    reviews: a.reviews.map((r) => ({
      id: r.id,
      decision: r.decision,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewerName: r.reviewer.name,
    })),
  }));

  const pendingOnPage = annotations.filter(
    (a) => a.status === "SUBMITTED"
  ).length;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/admin/review"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Daftar Review
        </Link>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-teal-500 rounded"></div>
              <h1 className="text-xl font-bold text-blue-900">
                {manuscript.title}
              </h1>
            </div>
            <div className="flex gap-3 mt-2 text-sm text-slate-600 items-center ml-4">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  manuscript.script === "PEGON"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-teal-100 text-teal-800"
                }`}
              >
                {manuscript.script}
              </span>
              <span>
                Halaman {pageNum} dari {totalPages}
              </span>
              <span>·</span>
              <span>{annotations.length} anotasi</span>
              {pendingOnPage > 0 && (
                <>
                  <span>·</span>
                  <span className="text-yellow-700 font-medium">
                    {pendingOnPage} menunggu review
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {prevPage ? (
              <Link
                href={`/admin/review/${manuscriptId}?p=${prevPage}`}
                className="px-3 py-1.5 text-sm bg-white border border-sky-200 rounded-lg hover:bg-sky-50 hover:border-teal-400 transition text-blue-900"
              >
                ← Sebelumnya
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-300 bg-white">
                ← Sebelumnya
              </span>
            )}
            {nextPage ? (
              <Link
                href={`/admin/review/${manuscriptId}?p=${nextPage}`}
                className="px-3 py-1.5 text-sm bg-white border border-sky-200 rounded-lg hover:bg-sky-50 hover:border-teal-400 transition text-blue-900"
              >
                Berikutnya →
              </Link>
            ) : (
              <span className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-slate-300 bg-white">
                Berikutnya →
              </span>
            )}
          </div>
        </div>
      </div>

      <ReviewCanvas
        pageId={currentPage.id}
        imageUrl={imageUrl}
        initialAnnotations={annotations}
      />
    </div>
  );
}