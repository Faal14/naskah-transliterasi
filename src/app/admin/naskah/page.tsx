import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import Link from "next/link";
import { formatScript, getScriptColor } from "@/lib/script-label";

export const dynamic = "force-dynamic";

export default async function NaskahListPage() {
  await requireAdmin();

  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pages: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-teal-500 rounded"></div>
          <h1 className="text-2xl font-bold text-blue-900">Naskah</h1>
        </div>
        <Link
          href="/admin/naskah/baru"
          className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-900 hover:to-blue-950 shadow-md transition"
        >
          + Upload Naskah Baru
        </Link>
      </div>

      {manuscripts.length === 0 ? (
        <div className="bg-white rounded-xl border border-sky-100 p-12 text-center shadow-sm">
          <p className="text-slate-500 mb-4">Belum ada naskah.</p>
          <Link
            href="/admin/naskah/baru"
            className="text-teal-700 hover:underline font-medium"
          >
            Upload naskah pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 border-b border-sky-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Kode
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Judul
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Aksara
                </th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">
                  Halaman
                </th>
                <th className="text-right px-4 py-3 font-medium text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {manuscripts.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-sky-50 last:border-0"
                >
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {m.code || (
                      <span className="text-slate-300 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.title ? (
                      <span className="font-medium text-blue-900">
                        {m.title}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        ⏳ Belum diisi kontributor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {m.script ? (
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getScriptColor(
                          m.script
                        )}`}
                      >
                        {formatScript(m.script)}
                      </span>
                    ) : (
                      <span className="text-slate-300 italic text-xs">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {m._count.pages}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/naskah/${m.id}`}
                      className="text-teal-700 hover:underline text-sm font-medium"
                    >
                      Detail
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}