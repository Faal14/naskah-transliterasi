import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function KontributorHome() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        include: {
          _count: { select: { annotations: true } },
        },
      },
    },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Daftar Naskah</h1>
      <p className="text-sm text-gray-600 mb-6">
        Pilih naskah untuk mulai membuat anotasi transliterasi dan terjemahan.
      </p>

      {manuscripts.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
          Belum ada naskah yang tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {manuscripts.map((m) => {
            const totalPages = m.pages.length;
            const annotatedPages = m.pages.filter(
              (p) => p._count.annotations > 0
            ).length;
            const progress =
              totalPages > 0
                ? Math.round((annotatedPages / totalPages) * 100)
                : 0;

            return (
              <Link
                key={m.id}
                href={`/kontributor/naskah/${m.id}`}
                className="bg-white rounded-lg border p-5 hover:border-blue-400 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-lg">{m.title}</h2>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                    {m.script}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                  <p>{totalPages} halaman</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {annotatedPages}/{totalPages} halaman ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-blue-600 h-1.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}