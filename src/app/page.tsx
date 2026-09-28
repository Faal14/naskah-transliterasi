import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as any;

  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        include: {
          annotations: {
            where: { status: "APPROVED" },
            select: { id: true },
          },
        },
      },
    },
  });

  const manuscriptsWithStats = manuscripts.map((m) => {
    const totalApproved = m.pages.reduce(
      (sum, p) => sum + p.annotations.length,
      0
    );
    const publishedPages = m.pages.filter(
      (p) => p.status === "PUBLISHED"
    ).length;
    return {
      ...m,
      stats: {
        totalApproved,
        publishedPages,
        totalPages: m.pages.length,
      },
    };
  });

  const visibleManuscripts = manuscriptsWithStats.filter(
    (m) => m.stats.totalApproved > 0
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
                {(user.role === "ADMIN" || user.role === "CONTRIBUTOR") &&
                  user.status === "APPROVED" && (
                    <Link
                      href="/kontributor"
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Ruang Kerja
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

      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Platform Transliterasi Naskah Kuno
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Koleksi naskah beraksara Pegon dan Hanacaraka yang telah
            ditransliterasi dan diterjemahkan secara manual oleh para
            kontributor. Setiap anotasi telah diverifikasi oleh admin.
          </p>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-semibold mb-5">Koleksi Naskah</h2>

        {visibleManuscripts.length === 0 ? (
          <div className="bg-white rounded-lg border p-16 text-center">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-gray-500 mb-2">
              Belum ada naskah yang siap dibaca publik.
            </p>
            <p className="text-sm text-gray-400">
              Naskah akan muncul di sini setelah anotasinya diverifikasi admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleManuscripts.map((m) => (
              <Link
                key={m.id}
                href={`/naskah/${m.id}`}
                className="bg-white rounded-lg border p-5 hover:border-blue-400 hover:shadow-sm transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg leading-tight">
                    {m.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium whitespace-nowrap ml-2">
                    {m.script}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                </div>

                {m.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {m.description}
                  </p>
                )}

                <div className="flex gap-4 text-xs text-gray-500 pt-3 border-t">
                  <span>{m.stats.totalApproved} anotasi</span>
                  <span>
                    {m.stats.publishedPages}/{m.stats.totalPages} halaman
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t bg-white mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 text-center text-sm text-gray-500">
          Platform Transliterasi Naskah Pegon &amp; Hanacaraka · Open Source
        </div>
      </footer>
    </div>
  );
}