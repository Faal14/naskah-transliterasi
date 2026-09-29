import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function MyAnnotationsPage() {
  const session = await auth();
  const user = session!.user as any;

  const annotations = await prisma.annotation.findMany({
    where: { contributorId: user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      page: {
        include: {
          manuscript: { select: { id: true, title: true, script: true } },
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        include: { reviewer: { select: { name: true } } },
      },
    },
  });

  const stats = {
    total: annotations.length,
    draft: annotations.filter((a) => a.status === "DRAFT").length,
    submitted: annotations.filter((a) => a.status === "SUBMITTED").length,
    approved: annotations.filter((a) => a.status === "APPROVED").length,
    rejected: annotations.filter((a) => a.status === "REJECTED").length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Anotasi Saya</h1>
      <p className="text-sm text-gray-600 mb-6">
        Daftar semua anotasi yang Anda buat beserta status verifikasinya.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        <StatCard label="Total" value={stats.total} color="gray" />
        <StatCard label="Draft" value={stats.draft} color="blue" />
        <StatCard label="Menunggu" value={stats.submitted} color="yellow" />
        <StatCard label="Approved" value={stats.approved} color="green" />
        <StatCard label="Rejected" value={stats.rejected} color="red" />
      </div>

      {annotations.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <p className="text-gray-500 mb-4">Anda belum membuat anotasi.</p>
          <Link
            href="/kontributor"
            className="text-blue-600 hover:underline"
          >
            Mulai bekerja di daftar naskah
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {annotations.map((a) => {
            const lastReview = a.reviews[0];
            return (
              <div key={a.id} className="bg-white rounded-lg border p-5">
                <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <Link
                      href={`/kontributor/naskah/${a.page.manuscript.id}?p=${a.page.pageNumber}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {a.page.manuscript.title}
                    </Link>
                    <div className="flex gap-3 mt-1 text-sm text-gray-600">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                        {a.page.manuscript.script}
                      </span>
                      <span>Halaman {a.page.pageNumber}</span>
                    </div>
                  </div>

                  <StatusBadge status={a.status} />
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Transliterasi
                    </p>
                    <p className="font-medium">{a.transliteration}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Terjemahan
                    </p>
                    <p>{a.translation}</p>
                  </div>
                </div>

                {a.notes && (
                  <div className="mt-3 text-sm">
                    <p className="text-xs text-gray-500 mb-0.5">Catatan</p>
                    <p className="text-gray-700 italic">{a.notes}</p>
                  </div>
                )}

                {lastReview && (
                  <div
                    className={`mt-3 pt-3 border-t rounded p-3 text-sm ${
                      lastReview.decision === "APPROVED"
                        ? "bg-green-50"
                        : "bg-red-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`font-medium text-xs ${
                          lastReview.decision === "APPROVED"
                            ? "text-green-700"
                            : "text-red-700"
                        }`}
                      >
                        {lastReview.decision === "APPROVED"
                          ? "✓ Disetujui"
                          : "✕ Ditolak"}{" "}
                        oleh {lastReview.reviewer.name}
                      </span>
                    </div>
                    {lastReview.comment && (
                      <p className="text-gray-700">{lastReview.comment}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "blue" | "yellow" | "green" | "red";
}) {
  const colors = {
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-700 border-yellow-200",
    green: "bg-green-50 text-green-700 border-green-200",
    red: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    DRAFT: "bg-gray-100 text-gray-700",
    SUBMITTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  const labels = {
    DRAFT: "Draft",
    SUBMITTED: "Menunggu Review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-medium ${
        styles[status as keyof typeof styles]
      }`}
    >
      {labels[status as keyof typeof labels]}
    </span>
  );
}