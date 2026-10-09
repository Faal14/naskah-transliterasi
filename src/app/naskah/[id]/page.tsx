import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import PublicCanvas from "@/components/public-canvas";
import RatingStars from "@/components/rating-stars";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { formatScript, getScriptColor } from "@/lib/script-label";

export default async function PublicManuscriptPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { id } = await params;
  const { p } = await searchParams;
  const pageNum = Math.max(1, parseInt(p || "1"));

  const session = await auth();
  const user = session?.user as any;

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        include: {
          annotations: {
            where: { status: "APPROVED" },
            orderBy: { createdAt: "asc" },
            include: {
              contributor: { select: { name: true } },
            },
          },
        },
      },
    },
  });

  if (!manuscript) notFound();

  const ratings = await prisma.rating.findMany({
    where: { manuscriptId: id },
    select: { score: true, userId: true },
  });

  const totalRatings = ratings.length;
  const averageScore =
    totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;
  const userScore = user
    ? ratings.find((r) => r.userId === user.id)?.score || null
    : null;

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
    contributorName: a.contributor.name,
  }));

  const totalApprovedInManuscript = manuscript.pages.reduce(
    (sum, p) => sum + p.annotations.length,
    0
  );

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
          >
            ← Koleksi Naskah
          </Link>

          <div className="mt-2">
            <h1 className="text-2xl font-bold text-blue-900">
              {manuscript.title}
            </h1>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600 items-center">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getScriptColor(
                  manuscript.script
                )}`}
              >
                {formatScript(manuscript.script)}
              </span>
              {manuscript.year && <span>Tahun: {manuscript.year}</span>}
              {manuscript.source && <span>Sumber: {manuscript.source}</span>}
              <span>·</span>
              <span className="font-medium text-teal-700">
                {totalApprovedInManuscript} kata terverifikasi
              </span>
            </div>

            {manuscript.description && (
              <p className="text-sm text-slate-600 mt-3 max-w-3xl">
                {manuscript.description}
              </p>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto mb-6">
          <RatingStars
            manuscriptId={id}
            initialUserScore={userScore}
            averageScore={averageScore}
            totalRatings={totalRatings}
            isLoggedIn={!!user}
          />
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm text-slate-600">
            Halaman{" "}
            <span className="font-medium text-blue-900">{pageNum}</span> dari{" "}
            <span className="font-medium text-blue-900">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            {prevPage ? (
              <Link
                href={`/naskah/${id}?p=${prevPage}`}
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
                href={`/naskah/${id}?p=${nextPage}`}
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

        <div className="max-w-4xl mx-auto">
          <PublicCanvas
            imageUrl={imageUrl}
            annotations={annotations}
            fullTransliteration={currentPage.fullTransliteration || ""}
            fullTranslation={currentPage.fullTranslation || ""}
          />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}