import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import Link from "next/link";
import { formatScript, getScriptColor } from "@/lib/script-label";
import LockButton from "./lock-button";

const LOCK_TIMEOUT_HOURS = 24;

export default async function KontributorHome() {
  const session = await auth();
  const user = session!.user as any;

  // Auto-unlock stale
  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_HOURS * 60 * 60 * 1000);
  await prisma.manuscript.updateMany({
    where: {
      lockedById: { not: null },
      lockedAt: { lt: cutoff },
    },
    data: { lockedById: null, lockedAt: null },
  });

  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      lockedBy: { select: { id: true, name: true } },
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
        Ambil naskah untuk mulai mengerjakan. Satu naskah hanya bisa dikerjakan
        oleh satu kontributor.
      </p>

      {manuscripts.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-12 text-center text-slate-500 shadow-sm">
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

            const isLockedByMe = m.lockedById === user.id;
            const isLockedByOther =
              m.lockedById !== null && m.lockedById !== user.id;
            const isFree = m.lockedById === null;

            return (
              <div
                key={m.id}
                className={`bg-white rounded-xl border-2 p-5 transition-all ${
                  isLockedByMe
                    ? "border-teal-400 shadow-md"
                    : isLockedByOther
                      ? "border-slate-200 opacity-80"
                      : "border-sky-100 hover:border-teal-300 hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h2 className="font-bold text-lg text-slate-900 leading-tight">
                    {m.title}
                  </h2>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getScriptColor(
                      m.script
                    )}`}
                  >
                    {formatScript(m.script)}
                  </span>
                </div>

                <div className="text-sm text-slate-700 space-y-1 mb-4">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                  <p>{totalPages} halaman</p>
                </div>

                {/* Status lock */}
                {isLockedByMe && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 mb-3 text-xs text-teal-800 font-medium flex items-center gap-2">
                    <span>✅</span>
                    <span>Naskah ini milik Anda</span>
                  </div>
                )}

                {isLockedByOther && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 mb-3 text-xs text-slate-700 flex items-center gap-2">
                    <span>🔒</span>
                    <span>
                      Sedang dikerjakan <strong>{m.lockedBy?.name}</strong>
                    </span>
                  </div>
                )}

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>Progress</span>
                    <span className="font-medium">
                      {annotatedPages}/{totalPages} halaman ({progress}%)
                    </span>
                  </div>
                  <div className="w-full bg-sky-100 rounded-full h-1.5">
                    <div
                      className="bg-teal-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Aksi */}
                {isFree && (
                  <LockButton
                    manuscriptId={m.id}
                    action="lock"
                    label="🔓 Ambil Naskah"
                    variant="primary"
                  />
                )}

                {isLockedByMe && (
                  <div className="flex gap-2">
                    <Link
                      href={`/kontributor/naskah/${m.id}`}
                      className="flex-1 bg-gradient-to-r from-teal-600 to-teal-700 text-white py-2 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 shadow-sm transition text-center"
                    >
                      Lanjut Kerjakan
                    </Link>
                    <LockButton
                      manuscriptId={m.id}
                      action="unlock"
                      label="Lepas"
                      variant="secondary"
                    />
                  </div>
                )}

                {isLockedByOther && (
                  <button
                    disabled
                    className="w-full bg-slate-100 text-slate-400 py-2 rounded-lg text-sm font-medium cursor-not-allowed border border-slate-200"
                  >
                    🔒 Naskah Terkunci
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}