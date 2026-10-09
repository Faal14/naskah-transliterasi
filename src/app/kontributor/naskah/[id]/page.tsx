import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import SubmitButton from "./submit-button";
import WorkArea from "./work-area";
import { formatScript, getScriptColor } from "@/lib/script-label";

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

  const session = await auth();
  const user = session!.user as any;

  const manuscript = await prisma.manuscript.findUnique({
    where: { id },
    include: {
      lockedBy: { select: { id: true, name: true } },
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });

  if (!manuscript) notFound();

  const isLockedByOther =
    manuscript.lockedById !== null &&
    manuscript.lockedById !== user.id &&
    user.role !== "ADMIN";

  if (isLockedByOther) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-8 text-center">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-amber-900 mb-2">
            Naskah Sedang Dikerjakan
          </h1>
          <p className="text-amber-800 mb-6">
            Naskah ini sedang dikerjakan oleh{" "}
            <strong>{manuscript.lockedBy?.name}</strong>. Anda tidak dapat
            membuat anotasi sampai naskah dilepas.
          </p>
          <Link
            href="/kontributor"
            className="inline-block bg-amber-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-700 transition"
          >
            ← Kembali ke Daftar Naskah
          </Link>
        </div>
      </div>
    );
  }

  const currentPage = manuscript.pages.find(
    (pg) => pg.pageNumber === pageNum
  );
  if (!currentPage) notFound();

  const { data: signed } = await supabaseAdmin.storage
    .from("manuscripts")
    .createSignedUrl(currentPage.imageUrl, 3600);

  const imageUrl = signed?.signedUrl || "";

  const annotations = await prisma.annotation.findMany({
    where: { pageId: currentPage.id },
    orderBy: { createdAt: "asc" },
  });

  const totalPages = manuscript.pages.length;
  const prevPage = pageNum > 1 ? pageNum - 1 : null;
  const nextPage = pageNum < totalPages ? pageNum + 1 : null;
  const draftCount = annotations.filter((a) => a.status === "DRAFT").length;

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/kontributor"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Daftar Naskah
        </Link>
        <div className="flex items-center justify-between mt-2 flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-teal-500 rounded"></div>
              <h1 className="text-xl font-bold text-blue-900">
                {manuscript.title}
              </h1>
            </div>
            <div className="flex gap-3 mt-2 text-sm text-slate-600 ml-4 items-center flex-wrap">
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${getScriptColor(
                  manuscript.script
                )}`}
              >
                {formatScript(manuscript.script)}
              </span>
              <span>
                Halaman {pageNum} dari {totalPages}
              </span>
              <span>·</span>
              <span>{annotations.length} anotasi</span>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <SubmitButton
              pageId={currentPage.id}
              annotationCount={draftCount}
            />
            {prevPage ? (
              <Link
                href={`/kontributor/naskah/${id}?p=${prevPage}`}
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
                href={`/kontributor/naskah/${id}?p=${nextPage}`}
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

      <div className="max-w-4xl mx-auto">
        <WorkArea
          pageId={currentPage.id}
          imageUrl={imageUrl}
          imageWidth={currentPage.width}
          imageHeight={currentPage.height}
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
          initialTransliteration={currentPage.fullTransliteration || ""}
          initialTranslation={currentPage.fullTranslation || ""}
          initialApparatus={currentPage.fullApparatus || ""}
        />
      </div>
    </div>
  );
}