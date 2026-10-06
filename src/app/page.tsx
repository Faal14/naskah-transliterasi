import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { auth } from "@/auth";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as any;

  const manuscripts = await prisma.manuscript.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      pages: {
        include: {
          annotations: {
            where: { status: "APPROVED" },
            select: { id: true },
          },
        },
      },
    },
  });

  const manuscriptsWithStats = manuscripts.map((m) => {
    const totalApproved = m.pages.reduce(
      (sum, p) => sum + p.annotations.length,
      0
    );
    const publishedPages = m.pages.filter(
      (p) => p.status === "PUBLISHED"
    ).length;
    return {
      ...m,
      stats: { totalApproved, publishedPages, totalPages: m.pages.length },
    };
  });

  const visibleManuscripts = manuscriptsWithStats.filter(
    (m) => m.stats.totalApproved > 0
  );

  const totalManuscripts = visibleManuscripts.length;
  const totalAnnotations = visibleManuscripts.reduce(
    (sum, m) => sum + m.stats.totalApproved,
    0
  );
  const totalPages = visibleManuscripts.reduce(
    (sum, m) => sum + m.stats.totalPages,
    0
  );

  return (
    <div className="min-h-screen bg-sky-50">
      {/* ============ HEADER ============ */}
      <header className="bg-blue-900 shadow-lg sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white font-bold text-lg">
              L
            </span>
            <div>
              <p className="font-bold text-white text-lg leading-tight tracking-wide">
                LONTAR
              </p>
              <p className="text-xs text-sky-200">
                Literasi Online, Naskah Transliterasi &amp; Alih-bahasa
              </p>
            </div>
          </Link>
          <nav className="flex gap-4 items-center text-sm">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sky-100 hover:text-white transition font-medium"
                >
                  Dashboard
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="text-sky-100 hover:text-white transition font-medium"
                  >
                    Admin
                  </Link>
                )}
                {user.role === "CONTRIBUTOR" && user.status === "APPROVED" && (
                  <Link
                    href="/kontributor"
                    className="text-sky-100 hover:text-white transition font-medium"
                  >
                    Ruang Kerja
                  </Link>
                )}
              </>
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

      {/* ============ HERO ============ */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 text-white">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-4">
            <span className="text-3xl">📜</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-wide">
            LONTAR
          </h1>

          <div className="max-w-3xl mx-auto mb-6">
            <p className="text-sky-100 text-base md:text-lg leading-relaxed mb-3">
              <span className="font-semibold text-white">LONTAR</span> adalah
              akronim dari{" "}
              <span className="font-medium text-white">L</span>iterasi{" "}
              <span className="font-medium text-white">O</span>nline,{" "}
              <span className="font-medium text-white">N</span>askah{" "}
              <span className="font-medium text-white">T</span>ransliterasi,
              dan{" "}
              <span className="font-medium text-white">A</span>lih-bahasa
              untuk <span className="font-medium text-white">R</span>iset.
            </p>
            <p className="text-sky-100 text-base md:text-lg leading-relaxed">
              Koleksi naskah beraksara Pegon dan Hanacaraka yang telah
              ditransliterasi dan diterjemahkan secara manual oleh para
              kontributor. Setiap anotasi telah diverifikasi oleh admin.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="#koleksi"
              className="bg-teal-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-teal-600 transition shadow-md"
            >
              Lihat Koleksi
            </Link>
            {!user && (
              <Link
                href="/register"
                className="bg-white/10 backdrop-blur border border-white/30 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-white/20 transition"
              >
                Jadi Kontributor
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ============ STATISTIK ============ */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {totalManuscripts}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Naskah
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {totalPages}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Halaman
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {totalAnnotations}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Anotasi
            </p>
          </div>
        </div>
      </section>

      {/* ============ KOLEKSI ============ */}
      <section id="koleksi" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Koleksi Naskah
            </h2>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Naskah yang sudah ditransliterasi dan diverifikasi, siap dibaca
            publik.
          </p>
        </div>

        {visibleManuscripts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-slate-600 mb-2 font-medium">
              Belum ada naskah yang siap dibaca publik.
            </p>
            <p className="text-sm text-slate-400">
              Naskah akan muncul di sini setelah anotasinya diverifikasi admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleManuscripts.map((m) => (
              <Link
                key={m.id}
                href={`/naskah/${m.id}`}
                className="group bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg leading-tight text-slate-900">
                    {m.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ml-2 ${
                      m.script === "PEGON"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-teal-100 text-teal-800"
                    }`}
                  >
                    {m.script}
                  </span>
                </div>

                <div className="text-sm text-slate-700 space-y-1 mb-4">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                </div>

                {m.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                    {m.description}
                  </p>
                )}

                <div className="flex gap-4 text-xs text-slate-500 pt-3 border-t border-sky-50">
                  <span className="font-medium text-teal-700">
                    {m.stats.totalApproved} anotasi
                  </span>
                  <span>
                    {m.stats.publishedPages}/{m.stats.totalPages} halaman
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ============ CARA KERJA ============ */}
      <section className="bg-white border-y border-sky-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-1 h-6 bg-teal-500 rounded"></div>
              <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
                Cara Kerja
              </h2>
            </div>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Platform ini mengandalkan metode manual oleh manusia karena
              teknologi OCR/AI belum akurat untuk naskah kuno.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-5">
            <StepCard
              number="1"
              icon="📤"
              title="Upload Naskah"
              desc="Admin mengunggah gambar pindaian naskah ke platform."
            />
            <StepCard
              number="2"
              icon="✍️"
              title="Anotasi"
              desc="Kontributor terverifikasi membuat kotak seleksi dan mengisi transliterasi + terjemahan."
            />
            <StepCard
              number="3"
              icon="✓"
              title="Review"
              desc="Admin memvalidasi keakuratan anotasi secara akademis."
            />
            <StepCard
              number="4"
              icon="📚"
              title="Publish"
              desc="Pembaca umum dapat mengakses naskah yang sudah terverifikasi."
            />
          </div>
        </div>
      </section>

      {/* ============ FITUR UTAMA ============ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Fitur Utama
            </h2>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Dirancang untuk pelestarian dan penelitian naskah Nusantara.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon="📜"
            title="Pegon & Hanacaraka"
            desc="Mendukung dua aksara utama naskah Nusantara dengan alur transliterasi khusus."
          />
          <FeatureCard
            icon="👥"
            title="Crowdsourcing"
            desc="Melibatkan banyak kontributor terverifikasi untuk mempercepat proses."
          />
          <FeatureCard
            icon="✅"
            title="Verifikasi Akademis"
            desc="Setiap anotasi diverifikasi admin agar sah untuk keperluan riset."
          />
          <FeatureCard
            icon="🔍"
            title="Tooltip Interaktif"
            desc="Hover kotak anotasi untuk melihat transliterasi + terjemahan langsung."
          />
          <FeatureCard
            icon="📊"
            title="Export Data"
            desc="Download hasil transliterasi dalam format JSON atau CSV untuk penelitian."
          />
          <FeatureCard
            icon="🌐"
            title="Open Source"
            desc="Kode terbuka di GitHub, dapat diadopsi dan dikembangkan siapa saja."
          />
        </div>
      </section>

      {/* ============ CTA ============ */}
      {!user && (
        <section className="bg-gradient-to-r from-blue-900 to-teal-700 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Ingin Berkontribusi?
            </h2>
            <p className="text-sky-100 mb-6">
              Bergabunglah sebagai kontributor untuk melestarikan naskah
              Nusantara. Daftar gratis, admin akan memverifikasi akun Anda.
            </p>
            <Link
              href="/register"
              className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-sky-100 transition shadow-md"
            >
              Daftar Sekarang
            </Link>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="bg-blue-900 text-sky-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-teal-500 text-white font-bold text-lg">
                  L
                </span>
                <p className="font-bold text-white text-lg tracking-wide">
                  LONTAR
                </p>
              </div>
              <p className="text-sm text-sky-200">
                <strong className="text-white">LONTAR</strong> — Literasi
                Online, Naskah Transliterasi, dan Alih-bahasa untuk Riset.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Navigasi</p>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-white transition">
                    Beranda
                  </Link>
                </li>
                <li>
                  <Link
                    href="#koleksi"
                    className="hover:text-white transition"
                  >
                    Koleksi Naskah
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition"
                  >
                    Daftar Kontributor
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition"
                  >
                    Masuk
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white mb-3">Tentang</p>
              <p className="text-sm text-sky-200">
                Dikembangkan oleh Tim Literasi Inovasi Teknologi OASE 2026.
              </p>
              <p className="text-xs text-sky-300 mt-3">
                Lisensi kode: MIT · Data: CC BY-SA 4.0
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-blue-800 text-center text-xs text-sky-300">
            © 2026 LONTAR · Literasi Online, Naskah Transliterasi, dan
            Alih-bahasa untuk Riset
          </div>
        </div>
      </footer>
    </div>
  );
}

function StepCard({
  number,
  icon,
  title,
  desc,
}: {
  number: string;
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-sky-50 rounded-xl border border-sky-100 p-5 relative hover:border-teal-300 transition">
      <span className="absolute top-3 right-3 text-xs font-bold text-teal-600 bg-teal-100 w-6 h-6 rounded-full flex items-center justify-center">
        {number}
      </span>
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-blue-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-300 hover:shadow-md transition">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-semibold text-blue-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}