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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            📚 Naskah Nusantara
          </Link>
          <nav className="flex gap-4 items-center text-sm">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Admin
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/login"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
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
            className="text-sm text-gray-600 hover:underline"
          >
            ← Koleksi Naskah
          </Link>

          <div className="mt-2">
            <h1 className="text-2xl font-bold">{manuscript.title}</h1>

            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-600 items-center">
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                {manuscript.script}
              </span>
              {manuscript.year && <span>Tahun: {manuscript.year}</span>}
              {manuscript.source && <span>Sumber: {manuscript.source}</span>}
              <span>·</span>
              <span>
                {totalApprovedInManuscript} anotasi terverifikasi
              </span>
            </div>

            {manuscript.description && (
              <p className="text-sm text-gray-600 mt-3 max-w-3xl">
                {manuscript.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="text-sm text-gray-600">
            Halaman <span className="font-medium">{pageNum}</span> dari{" "}
            <span className="font-medium">{totalPages}</span>
          </div>

          <div className="flex gap-2">
            {prevPage ? (
              <Link
                href={`/naskah/${id}?p=${prevPage}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white"
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
                href={`/naskah/${id}?p=${nextPage}`}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-white"
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

        <div className="max-w-4xl mx-auto">
          {annotations.length === 0 ? (
            <div className="bg-white border rounded-lg overflow-hidden">
              <img
                src={imageUrl}
                alt="Naskah"
                className="w-full block"
                draggable={false}
              />
              <div className="p-4 text-center text-sm text-gray-500 bg-gray-50 border-t">
                Belum ada anotasi yang diverifikasi untuk halaman ini.
              </div>
            </div>
          ) : (
            <PublicCanvas
              imageUrl={imageUrl}
              annotations={annotations}
            />
          )}
        </div>
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          Platform Transliterasi Naskah Pegon &amp; Hanacaraka · Open Source
        </div>
      </footer>
    </div>
  );
}