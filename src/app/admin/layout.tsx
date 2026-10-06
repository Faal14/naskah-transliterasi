import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const user = session.user as any;
  if (user.role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-sky-50">
      <header className="bg-blue-900 shadow-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              className="font-bold text-lg text-white flex items-center gap-2"
            >
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 text-xs">
                ⚙️
              </span>
              Admin Panel
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/admin/kontributor"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Verifikasi Kontributor
              </Link>
              <Link
                href="/admin/naskah"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Naskah
              </Link>
              <Link
                href="/admin/review"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Review Anotasi
              </Link>
              <Link
                href="/admin/demo"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Data Demo
              </Link>
              <Link
                href="/admin/export"
                className="text-sky-100 hover:text-white transition font-medium"
              >
                Export Data
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-sky-100">{user.name}</span>
            <Link
              href="/dashboard"
              className="bg-blue-800 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition font-medium border border-blue-700"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}