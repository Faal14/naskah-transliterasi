import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  const isAdmin = user.role === "ADMIN";
  const isContributor =
    user.role === "CONTRIBUTOR" && user.status === "APPROVED";

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-slate-100 p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-sky-100 p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-teal-700 flex items-center justify-center text-2xl text-white font-bold shadow-md">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Dashboard</h1>
              <p className="text-sm text-slate-500">
                Selamat datang, {user.name}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm mb-8 bg-sky-50 rounded-xl p-5 border border-sky-100">
            <p>
              <span className="font-medium text-slate-500 inline-block w-20">
                Nama
              </span>
              {user.name}
            </p>
            <p>
              <span className="font-medium text-slate-500 inline-block w-20">
                Email
              </span>
              {user.email}
            </p>
            <p>
              <span className="font-medium text-slate-500 inline-block w-20">
                Role
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  isAdmin
                    ? "bg-blue-100 text-blue-800"
                    : isContributor
                      ? "bg-teal-100 text-teal-800"
                      : "bg-slate-100 text-slate-700"
                }`}
              >
                {user.role}
              </span>
            </p>
            <p>
              <span className="font-medium text-slate-500 inline-block w-20">
                Status
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : user.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {user.status}
              </span>
            </p>
          </div>

          {/* Quick links */}
          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {isAdmin && (
              <Link
                href="/admin"
                className="bg-gradient-to-br from-blue-800 to-blue-900 text-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <p className="text-2xl mb-1">⚙️</p>
                <p className="font-semibold">Admin Panel</p>
                <p className="text-xs text-sky-200 mt-0.5">
                  Kelola naskah, review anotasi
                </p>
              </Link>
            )}
            {isContributor && (
              <Link
                href="/kontributor"
                className="bg-gradient-to-br from-teal-600 to-teal-700 text-white p-5 rounded-xl shadow-md hover:shadow-lg transition"
              >
                <p className="text-2xl mb-1">✍️</p>
                <p className="font-semibold">Ruang Kerja</p>
                <p className="text-xs text-teal-100 mt-0.5">
                  Buat anotasi transliterasi
                </p>
              </Link>
            )}
            <Link
              href="/"
              className="bg-white border-2 border-sky-200 p-5 rounded-xl shadow-sm hover:shadow-md hover:border-blue-400 transition"
            >
              <p className="text-2xl mb-1">📚</p>
              <p className="font-semibold text-blue-900">Koleksi Naskah</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Lihat naskah publik
              </p>
            </Link>
          </div>

          {user.status === "PENDING" && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800 flex items-start gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-medium mb-0.5">Akun menunggu verifikasi</p>
                <p className="text-yellow-700">
                  Setelah admin menyetujui, kamu bisa mulai menerjemahkan
                  naskah.
                </p>
              </div>
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full bg-white border-2 border-red-200 text-red-600 py-2.5 rounded-lg font-medium hover:bg-red-50 transition"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}