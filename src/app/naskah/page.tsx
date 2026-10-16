import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import ManuscriptCard from "@/components/manuscript-card";

export const dynamic = "force-dynamic";

export default async function AllManuscriptsPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        orderBy: { pageNumber: "asc" },
        include: {
          annotations: {
            where: { status: "APPROVED" },
            select: { id: true },
          },
        },
      },
    },
  });

  const firstPagePaths = manuscripts
    .map((m) => m.pages[0]?.imageUrl)
    .filter((p): p is string => !!p);

  const signedUrlMap: Record<string, string> = {};
  if (firstPagePaths.length > 0) {
    const { data } = await supabaseAdmin.storage
      .from("manuscripts")
      .createSignedUrls(firstPagePaths, 3600);
    if (data) {
      data.forEach((item) => {
        if (item.signedUrl && item.path) {
          signedUrlMap[item.path] = item.signedUrl;
        }
      });
    }
  }

  const allItems = manuscripts.map((m) => {
    const totalApproved = m.pages.reduce(
      (sum, p) => sum + p.annotations.length,
      0
    );
    const publishedPages = m.pages.filter(
      (p) => p.status === "PUBLISHED"
    ).length;
    const firstPageUrl = m.pages[0]?.imageUrl
      ? signedUrlMap[m.pages[0].imageUrl] || null
      : null;
    return {
      id: m.id,
      title: m.title,
      script: m.script,
      year: m.year,
      source: m.source,
      description: m.description,
      firstPageUrl,
      stats: { totalApproved, publishedPages, totalPages: m.pages.length },
    };
  });

  const items = allItems.filter((m) => m.stats.totalApproved > 0);

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
          >
            ← Kembali ke Beranda
          </Link>
          <div className="flex items-center gap-3 mt-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
              Semua Naskah
            </h1>
          </div>
          <p className="text-slate-600 max-w-2xl">
            {items.length} naskah yang sudah ditransliterasi dan siap dibaca.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-slate-600 mb-2 font-medium">
              Belum ada naskah yang siap dibaca publik.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((m) => (
              <ManuscriptCard key={m.id} m={m} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}