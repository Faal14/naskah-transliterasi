import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import PublicCanvas from "@/components/public-canvas";

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
      <header className="bg-blue-900 shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white font-bold text-lg">
              L
            </span>
            <div>
              <p className="font-bold text-white text-lg leading-tight tracking-wide">
                LONTAR
              </p>
              <p className="text-xs text-sky-200">
                Literasi Online, Naskah Transliterasi &amp; Alih-bahasa
              </p>
            </div>
          </Link>
          <nav className="flex gap-4 items-center text-sm">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sky-100 hover:text-white transition font-medium"
                >
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sky-100 hover:text-white transition font-medium"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "CONTRIBUTOR" && user.status === "APPROVED" && (
                  <Link
                    href="/kontributor"
                    className="text-sky-100 hover:text-white transition font-medium"
                  >
                    Ruang Kerja
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="bg-teal-500 text-white px-4 py-1.5 rounded-lg hover:bg-teal-600 transition font-medium"
              >
                Masuk
              </Link>
            )}
          </nav>
        </div>
      </header>

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
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  manuscript.script === "PEGON"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-teal-100 text-teal-800"
                }`}
              >
                {manuscript.script}
              </span>
              {manuscript.year && <span>Tahun: {manuscript.year}</span>}
              {manuscript.source && <span>Sumber: {manuscript.source}</span>}
              <span>·</span>
              <span className="font-medium text-teal-700">
                {totalApprovedInManuscript} anotasi terverifikasi
              </span>
            </div>

            {manuscript.description && (
              <p className="text-sm text-slate-600 mt-3 max-w-3xl">
                {manuscript.description}
              </p>
            )}
          </div>
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
          {annotations.length === 0 ? (
            <div className="bg-white border border-sky-100 rounded-xl overflow-hidden shadow-sm">
              <img
                src={imageUrl}
                alt="Naskah"
                className="w-full block"
                draggable={false}
              />
              <div className="p-4 text-center text-sm text-slate-500 bg-sky-50 border-t border-sky-100">
                Belum ada anotasi yang diverifikasi untuk halaman ini.
              </div>
            </div>
          ) : (
            <PublicCanvas imageUrl={imageUrl} annotations={annotations} />
          )}
        </div>
      </main>

      <footer className="bg-blue-900 text-sky-100 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-8 text-center text-sm">
          <p className="font-bold text-white mb-1 tracking-wide">LONTAR</p>
          <p className="text-xs">
            Literasi Online, Naskah Transliterasi, dan Alih-bahasa untuk Riset
          </p>
        </div>
      </footer>
    </div>
  );
}