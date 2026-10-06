import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function KontributorHome() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        include: { _count: { select: { annotations: true } } },
      },
    },
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Daftar Naskah</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-4">
        Pilih naskah untuk mulai membuat anotasi transliterasi dan terjemahan.
      </p>

      {manuscripts.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-12 text-center text-slate-500 shadow-sm">
          Belum ada naskah yang tersedia.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {manuscripts.map((m) => {
            const totalPages = m.pages.length;
            const annotatedPages = m.pages.filter((p) => p._count.annotations > 0).length;
            const progress = totalPages > 0 ? Math.round((annotatedPages / totalPages) * 100) : 0;

            return (
              <Link
                key={m.id}
                href={`/kontributor/naskah/${m.id}`}
                className="group bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-semibold text-lg text-blue-900 group-hover:text-teal-700 transition leading-tight">
                    {m.title}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ml-2 ${
                      m.script === "PEGON"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {m.script}
                  </span>
                </div>

                <div className="text-sm text-slate-600 space-y-1 mb-4">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                  <p>{totalPages} halaman</p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span>Progress</span>
                    <span>
                      {annotatedPages}/{totalPages} halaman ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-teal-600 h-1.5 rounded-full transition-all"
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