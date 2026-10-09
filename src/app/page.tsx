import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import Link from "next/link";
import { auth } from "@/auth";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import PlatformRatingSection from "@/components/platform-rating-section";
import { formatScript, getScriptColor } from "@/lib/script-label";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user as any;

  const [manuscripts, totalContributors] = await Promise.all([
    prisma.manuscript.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        pages: {
          orderBy: { pageNumber: "asc" },
          include: {
            annotations: {
              where: { status: "APPROVED" },
              select: { id: true },
            },
          },
        },
      },
    }),
    prisma.user.count({
      where: { role: "CONTRIBUTOR", status: "APPROVED" },
    }),
  ]);

  const firstPagePaths = manuscripts
    .map((m) => m.pages[0]?.imageUrl)
    .filter((p): p is string => !!p);

  const signedUrlMap: Record<string, string> = {};
  if (firstPagePaths.length > 0) {
    const { data } = await supabaseAdmin.storage
      .from("manuscripts")
      .createSignedUrls(firstPagePaths, 3600);
    if (data) {
      data.forEach((item) => {
        if (item.signedUrl && item.path) {
          signedUrlMap[item.path] = item.signedUrl;
        }
      });
    }
  }

  const manuscriptsWithStats = manuscripts.map((m) => {
    const totalApproved = m.pages.reduce(
      (sum, p) => sum + p.annotations.length,
      0
    );
    const publishedPages = m.pages.filter(
      (p) => p.status === "PUBLISHED"
    ).length;
    const firstPageUrl = m.pages[0]?.imageUrl
      ? signedUrlMap[m.pages[0].imageUrl] || null
      : null;
    return {
      ...m,
      stats: { totalApproved, publishedPages, totalPages: m.pages.length },
      firstPageUrl,
    };
  });

  const visibleManuscripts = manuscriptsWithStats.filter(
    (m) => m.stats.totalApproved > 0
  );

  const totalManuscripts = manuscripts.length;
  const translatedManuscripts = visibleManuscripts.length;

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

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
              Platform literasi digital untuk penelitian naskah kuno berbagai
              aksara Nusantara — dikerjakan secara kolaboratif oleh
              kontributor terverifikasi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {!user ? (
              <>
                <Link
                  href="/login"
                  className="bg-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-600 transition shadow-md text-base"
                >
                  🔑 Masuk ke Akun
                </Link>
                <Link
                  href="/register"
                  className="bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition text-base"
                >
                  ✍️ Daftar Kontributor
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/dashboard"
                  className="bg-teal-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-teal-600 transition shadow-md text-base"
                >
                  📊 Dashboard Saya
                </Link>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition text-base"
                  >
                    ⚙️ Admin Panel
                  </Link>
                )}
                {user.role === "CONTRIBUTOR" &&
                  user.status === "APPROVED" && (
                    <Link
                      href="/kontributor"
                      className="bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition text-base"
                    >
                      ✍️ Ruang Kerja
                    </Link>
                  )}
              </>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {totalManuscripts}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Total Naskah
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {translatedManuscripts}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Naskah Ditransliterasi
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg border border-sky-100 p-6 text-center">
            <p className="text-3xl md:text-4xl font-bold text-blue-900">
              {totalContributors}
            </p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">
              Kontributor
            </p>
          </div>
        </div>
      </section>

      <section id="koleksi" className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Koleksi Naskah
            </h2>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Sorotan naskah yang sudah ditransliterasi dan diverifikasi, siap
            dibaca publik.
          </p>
        </div>

        {visibleManuscripts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sky-100 p-16 text-center shadow-sm">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-slate-600 mb-2 font-medium">
              Belum ada naskah yang siap dibaca publik.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleManuscripts.map((m) => (
              <Link
                key={m.id}
                href={`/naskah/${m.id}`}
                className="group bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-400 hover:shadow-lg transition-all flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg leading-tight text-slate-900">
                    {m.title}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ml-2 ${getScriptColor(
                      m.script
                    )}`}
                  >
                    {formatScript(m.script)}
                  </span>
                </div>

                <div className="text-sm text-slate-700 space-y-1 mb-3">
                  {m.year && <p>Tahun: {m.year}</p>}
                  {m.source && <p>Sumber: {m.source}</p>}
                </div>

                <div className="relative flex-1 rounded-lg overflow-hidden min-h-[110px] mb-4">
                  {m.firstPageUrl && (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-70"
                        style={{ backgroundImage: `url(${m.firstPageUrl})` }}
                      ></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/60 to-white/95"></div>
                    </>
                  )}
                  <div className="relative p-3 flex items-end h-full min-h-[110px]">
                    <p className="text-sm text-slate-800 font-medium line-clamp-3 drop-shadow-sm">
                      {m.description || "Belum ada deskripsi untuk naskah ini."}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 text-xs text-slate-500 pt-3 border-t border-sky-50">
                  <span className="font-medium text-teal-700">
                    {m.stats.totalApproved} kata diterjemahkan
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

      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Fitur Utama
            </h2>
          </div>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Dirancang untuk pelestarian dan penelitian naskah Nusantara
            berbagai aksara.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard
            icon="🎯"
            title="Multi Aksara Nusantara"
            desc="Mendukung berbagai aksara Nusantara — Pegon, Carakan, dan aksara daerah lainnya dalam satu platform."
          />
          <FeatureCard
            icon="👥"
            title="Crowdsourcing"
            desc="Melibatkan banyak kontributor terverifikasi untuk mempercepat proses transliterasi lintas aksara."
          />
          <FeatureCard
            icon="✅"
            title="Verifikasi Akademis"
            desc="Setiap anotasi diverifikasi admin agar sah dan akurat untuk keperluan riset filologi."
          />
          <FeatureCard
            icon="📖"
            title="Multi Transliterasi"
            desc="Satu naskah dapat ditransliterasi ke berbagai aksara dan bahasa — didukung oleh kontributor dengan keahlian masing-masing."
          />
          <FeatureCard
            icon="📊"
            title="Export Data"
            desc="Download hasil transliterasi dalam format JSON atau CSV untuk analisis penelitian lanjutan."
          />
          <FeatureCard
            icon="🌐"
            title="Open Source"
            desc="Kode terbuka di GitHub — dapat diadopsi, dimodifikasi, dan dikembangkan siapa saja."
          />
        </div>
      </section>

      {!user && (
        <section className="bg-gradient-to-r from-blue-900 to-teal-700 py-16">
          <div className="max-w-3xl mx-auto px-6 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Siap Berkontribusi?
            </h2>
            <p className="text-sky-100 mb-6 max-w-xl mx-auto">
              Bergabunglah sebagai kontributor untuk melestarikan naskah
              Nusantara. Daftar gratis, admin akan memverifikasi akun Anda
              dalam 1×24 jam.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                href="/register"
                className="inline-block bg-white text-blue-900 px-8 py-3 rounded-lg font-semibold hover:bg-sky-100 transition shadow-md"
              >
                Daftar Sekarang
              </Link>
              <Link
                href="/login"
                className="inline-block bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/20 transition"
              >
                Sudah Punya Akun? Masuk
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ RATING & REVIEW PLATFORM ============ */}
      <PlatformRatingSection
        currentUser={user ? { name: user.name } : null}
      />

      <SiteFooter />
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