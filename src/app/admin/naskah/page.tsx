import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function NaskahListPage() {
  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { pages: true } } },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Naskah</h1>
        <Link
          href="/admin/naskah/baru"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          + Upload Naskah Baru
        </Link>
      </div>

      {manuscripts.length === 0 ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <p className="text-gray-500 mb-4">Belum ada naskah.</p>
          <Link
            href="/admin/naskah/baru"
            className="text-blue-600 hover:underline"
          >
            Upload naskah pertama
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Judul
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Aksara
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Tahun
                </th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">
                  Halaman
                </th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {manuscripts.map((m) => (
                <tr key={m.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{m.title}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {m.script}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{m.year || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{m._count.pages}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/naskah/${m.id}`}
                      className="text-blue-600 hover:underline text-sm"
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