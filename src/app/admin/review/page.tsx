import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ReviewListPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        include: {
          annotations: true,
        },
      },
    },
  });

  // Hitung jumlah anotasi SUBMITTED per manuskrip
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
      const total = m.pages.reduce(
        (sum, p) => sum + p.annotations.length,
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
          total,
          publishedPages,
          totalPages: m.pages.length,
        },
      };
    })
    .filter((m) => m.stats.total > 0);

  const totalPending = manuscriptsWithPending.reduce(
    (sum, m) => sum + m.stats.pending,
    0
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Review Anotasi</h1>
        <p className="text-sm text-gray-600 mt-1">
          {totalPending > 0
            ? `Ada ${totalPending} anotasi menunggu verifikasi Anda.`
            : "Tidak ada anotasi yang menunggu verifikasi."}
        </p>
      </div>

      {manuscriptsWithPending.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center text-gray-500">
          Belum ada anotasi yang disubmit kontributor.
        </div>
      ) : (
        <div className="space-y-3">
          {manuscriptsWithPending.map((m) => (
            <Link
              key={m.id}
              href={`/admin/review/${m.id}`}
              className="block bg-white rounded-lg border p-5 hover:border-blue-400 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="font-semibold text-lg">{m.title}</h2>
                  <div className="flex gap-3 mt-1 text-sm text-gray-600">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {m.script}
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
                  <span className="text-gray-500">Total anotasi:</span>{" "}
                  <span className="font-medium">{m.stats.total}</span>
                </div>
                <div>
                  <span className="text-gray-500">Approved:</span>{" "}
                  <span className="font-medium text-green-600">
                    {m.stats.approved}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Rejected:</span>{" "}
                  <span className="font-medium text-red-600">
                    {m.stats.rejected}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Halaman publish:</span>{" "}
                  <span className="font-medium">
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