import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import Link from "next/link";
import CommentRow from "./comment-row";

export default async function AdminKomentarPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  await requireAdmin();

  const { filter } = await searchParams;
  const activeFilter = filter || "PENDING";

  const where: any = {};
  if (activeFilter !== "ALL") {
    where.status = activeFilter;
  }

  const comments = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
      manuscript: { select: { id: true, title: true } },
    },
  });

  const counts = {
    ALL: await prisma.comment.count(),
    PENDING: await prisma.comment.count({ where: { status: "PENDING" } }),
    APPROVED: await prisma.comment.count({ where: { status: "APPROVED" } }),
    REJECTED: await prisma.comment.count({ where: { status: "REJECTED" } }),
  };

  const formattedComments = comments.map((c) => ({
    id: c.id,
    userName: c.user?.name || c.guestName || "Anonim",
    isGuest: !c.userId,
    guestEmail: c.guestEmail,
    content: c.content,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    manuscriptId: c.manuscript.id,
    manuscriptTitle: c.manuscript.title,
  }));

  const tabs = [
    { key: "PENDING", label: "Menunggu", count: counts.PENDING },
    { key: "APPROVED", label: "Approved", count: counts.APPROVED },
    { key: "REJECTED", label: "Rejected", count: counts.REJECTED },
    { key: "ALL", label: "Semua", count: counts.ALL },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Moderasi Komentar</h1>
      </div>
      <p className="text-sm text-slate-600 mb-6 ml-4">
        Kelola komentar pengguna. Komentar hanya tampil di publik setelah
        di-approve.
      </p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/komentar?filter=${t.key}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
              activeFilter === t.key
                ? "bg-blue-900 text-white border-blue-900 shadow-md"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
            <span
              className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                activeFilter === t.key
                  ? "bg-white/20"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* List */}
      {formattedComments.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-12 text-center text-slate-500 shadow-sm">
          <div className="text-5xl mb-3">💬</div>
          <p>Tidak ada komentar dengan filter ini.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {formattedComments.map((c) => (
            <CommentRow key={c.id} comment={c} />
          ))}
        </div>
      )}
    </div>
  );
}