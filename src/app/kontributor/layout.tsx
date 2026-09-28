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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/kontributor" className="font-bold text-lg">
              Ruang Kerja
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/kontributor"
                className="text-gray-600 hover:text-gray-900"
              >
                Daftar Naskah
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900"
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{user.name}</span>
            <Link href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}