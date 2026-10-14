import Link from "next/link";
import { auth } from "@/auth";

export default async function SiteHeader() {
  const session = await auth();
  const user = session?.user as
    | { name?: string; role?: string; status?: string }
    | undefined;

  return (
    <header className="bg-blue-900 shadow-lg sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between gap-3">
        
        {/* --- BAGIAN KIRI: Logo Baru + Brand --- */}
        <Link href="/" className="flex items-center gap-2 md:gap-3 min-w-0">
          
          {/* Logo Utama LONTAR */}
          <img 
            src="/logos/logo.png" 
            alt="Logo LONTAR" 
            className="h-10 w-auto object-contain drop-shadow-md shrink-0" 
          />
          
          {/* Teks Brand */}
          <div className="flex flex-col min-w-0">
            <p className="font-bold text-white text-lg leading-tight tracking-wide">
              LONTAR
            </p>
            <p className="hidden sm:block text-[10px] text-sky-200 leading-tight whitespace-nowrap">
              Platform Preservasi &amp; Digital Heritage Manuskrip
            </p>
          </div>
        </Link>

        {/* --- BAGIAN KANAN: Logo Mitra + Menu Navigasi --- */}
        <div className="flex items-center gap-4 md:gap-6 shrink-0">
          
          {/* Logo Mitra (hanya di laptop ke atas) */}
          <div className="hidden md:flex items-center gap-5 border-r border-white/20 pr-6">
            
            <img 
              src="/logos/kemenag.png" 
              alt="Kemenag" 
              className="h-10 w-auto object-contain drop-shadow-md" 
            />
            
            <img 
              src="/logos/uin.png" 
              alt="UIN" 
              className="h-10 w-auto object-contain drop-shadow-md" 
            />
            
            <img 
              src="/logos/oase.png" 
              alt="OASE" 
              className="h-10 w-auto object-contain drop-shadow-md" 
            />
          </div>

          {/* Menu Navigasi */}
          <nav className="flex gap-3 md:gap-4 items-center text-sm">
            <Link
              href="/"
              className="text-sky-100 hover:text-white transition font-medium whitespace-nowrap"
            >
              Beranda
            </Link>

            {user ? (
              <Link
                href="/dashboard"
                className="bg-teal-500 text-white px-3 md:px-4 py-1.5 rounded-lg hover:bg-teal-600 transition font-medium whitespace-nowrap"
              >
                {user.name?.split(" ")[0] || "Dashboard"}
              </Link>
            ) : (
              <Link
                href="/login"
                className="bg-teal-500 text-white px-3 md:px-4 py-1.5 rounded-lg hover:bg-teal-600 transition font-medium whitespace-nowrap"
              >
                Masuk
              </Link>
            )}
          </nav>
        </div>

      </div>
    </header>
  );
}