import { prisma } from "@/lib/prisma";
import { approveUser, rejectUser } from "./actions";

export default async function KontributorPage() {
  const pendingUsers = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  const allUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-6 bg-teal-500 rounded"></div>
        <h1 className="text-2xl font-bold text-blue-900">Verifikasi Kontributor</h1>
      </div>

      {/* Section: Pending */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-4 text-blue-900">
          Menunggu Verifikasi ({pendingUsers.length})
        </h2>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-xl border border-sky-100 p-8 text-center text-slate-500 shadow-sm">
            Tidak ada pendaftar yang menunggu verifikasi.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-sky-50 border-b border-sky-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Nama</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-600">CV / Portofolio</th>
                  <th className="text-right px-4 py-3 font-medium text-slate-600">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((user) => (
                  <tr key={user.id} className="border-b border-sky-50 last:border-0">
                    <td className="px-4 py-3 text-blue-900">{user.name}</td>
                    <td className="px-4 py-3 text-slate-600">{user.email}</td>
                    <td className="px-4 py-3">
                      {user.cvUrl ? (
                        <a
                          href={user.cvUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-700 hover:underline font-medium"
                        >
                          Lihat CV
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form
                        action={async () => {
                          "use server";
                          await approveUser(user.id);
                        }}
                        className="inline"
                      >
                        <button
                          type="submit"
                          className="bg-teal-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-teal-700 transition"
                        >
                          Approve
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await rejectUser(user.id);
                        }}
                        className="inline ml-2"
                      >
                        <button
                          type="submit"
                          className="bg-red-600 text-white px-3 py-1.5 rounded text-xs font-medium hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section: All users */}
      <section>
        <h2 className="text-lg font-semibold mb-4 text-blue-900">
          Semua User (20 terakhir)
        </h2>
        <div className="bg-white rounded-xl border border-sky-100 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-sky-50 border-b border-sky-100">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Nama</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((user) => (
                <tr key={user.id} className="border-b border-sky-50 last:border-0">
                  <td className="px-4 py-3 text-blue-900">{user.name}</td>
                  <td className="px-4 py-3 text-slate-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.role === "ADMIN"
                          ? "bg-blue-100 text-blue-800"
                          : user.role === "CONTRIBUTOR"
                            ? "bg-teal-100 text-teal-800"
                            : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        user.status === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : user.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}