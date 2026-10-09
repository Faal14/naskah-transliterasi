import Link from "next/link";
import { auth } from "@/auth";

export default async function SiteHeader() {
  const session = await auth();
  const user = session?.user as any;

  return (
    <header className="bg-blue-900 shadow-lg sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo + Brand */}
        <Link href="/" className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-white text-blue-900 font-bold text-xs border-2 border-teal-400">
            UIN
          </span>
          <div>
            <p className="font-bold text-white text-lg leading-tight tracking-wide">
              LONTAR
            </p>
            <p className="text-[10px] text-sky-200 leading-tight">
              Platform Preservasi &amp; Digital Heritage Manuskrip
            </p>
          </div>
        </Link>

        {/* Menu */}
        <nav className="flex gap-4 items-center text-sm">
          <Link
            href="/"
            className="text-sky-100 hover:text-white transition font-medium"
          >
            Beranda
          </Link>

          {user ? (
            <Link
              href="/dashboard"
              className="bg-teal-500 text-white px-4 py-1.5 rounded-lg hover:bg-teal-600 transition font-medium"
            >
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/login"
              className="bg-teal-500 text-white px-4 py-1.5 rounded-lg hover:bg-teal-600 transition font-medium"
            >
              Masuk
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}