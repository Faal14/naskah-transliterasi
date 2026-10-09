import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatScript, getScriptColor } from "@/lib/script-label";

export default async function ReviewListPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: { include: { annotations: true } },
    },
  });

  const manuscriptsWithPending = manuscripts
    .map((m) => {
      const pending = m.pages.reduce(
        (sum, p) =>
          sum + p.annotations.filter((a) => a.status === "SUBMITTED").length,
        0
      );
      const approved = m.pages.reduce(
        (sum, p) =>
          sum + p.annotations.filter((a) => a.status === "APPROVED").length,
        0
      );
      const rejected = m.pages.reduce(
        (sum, p) =>
          sum + p.annotations.filter((a) => a.status === "REJECTED").length,
        0
      );
      const publishedPages = m.pages.filter(
        (p) => p.status === "PUBLISHED"
      ).length;
      return {
        ...m,
        stats: {
          pending,
          approved,
          rejected,
          publishedPages,
          totalPages: m.pages.length,
        },
      };
    })
    .filter((m) => m.stats.approved + m.stats.pending + m.stats.rejected > 0);

  const totalPending = manuscriptsWithPending.reduce(
    (sum, m) => sum + m.stats.pending,
    0
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Review Anotasi</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-4">
        {totalPending > 0
          ? `Ada ${totalPending} anotasi menunggu verifikasi Anda.`
          : "Tidak ada anotasi yang menunggu verifikasi."}
      </p>

      {manuscriptsWithPending.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-12 text-center text-slate-500 shadow-sm">
          Belum ada anotasi yang disubmit kontributor.
        </div>
      ) : (
        <div className="space-y-3">
          {manuscriptsWithPending.map((m) => (
            <Link
              key={m.id}
              href={`/admin/review/${m.id}`}
              className="block bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-400 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-lg text-blue-900">
                    {m.title}
                  </h2>
                  <div className="flex gap-3 mt-1 text-sm text-slate-600">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${getScriptColor(
                        m.script
                      )}`}
                    >
                      {formatScript(m.script)}
                    </span>
                    {m.year && <span>Tahun: {m.year}</span>}
                  </div>
                </div>
                {m.stats.pending > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {m.stats.pending} menunggu
                  </span>
                )}
              </div>

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="text-slate-500">Approved:</span>{" "}
                  <span className="font-medium text-green-600">
                    {m.stats.approved}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Rejected:</span>{" "}
                  <span className="font-medium text-red-600">
                    {m.stats.rejected}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Halaman publish:</span>{" "}
                  <span className="font-medium text-blue-900">
                    {m.stats.publishedPages}/{m.stats.totalPages}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}