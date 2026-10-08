import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function KontributorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;

  if (user.role !== "ADMIN" && user.role !== "CONTRIBUTOR") {
    redirect("/dashboard");
  }

  if (user.status !== "APPROVED") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="bg-gradient-to-r from-blue-900 to-teal-700 shadow-lg sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-white font-bold text-sm">
                L
              </span>
              <span className="font-bold text-white text-lg tracking-wide">
                LONTAR
              </span>
              <span className="text-xs text-sky-200 ml-1">· Ruang Kerja</span>
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/kontributor"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Daftar Naskah
              </Link>
              <Link
                href="/kontributor/anotasi"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Anotasi Saya
              </Link>
              <Link
                href="/kontributor/profil"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Profil
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-sky-100 hover:text-white transition font-medium"
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/kontributor/profil"
              className="text-sky-100 hover:text-white transition font-medium"
            >
              {user.name}
            </Link>
            <Link
              href="/dashboard"
              className="bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium border border-blue-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}