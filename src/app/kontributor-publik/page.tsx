import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { formatScript } from "@/lib/script-label";

export default async function KontributorPublikPage() {
  const contributors = await prisma.user.findMany({
    where: {
      role: "CONTRIBUTOR",
      status: "APPROVED",
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      institution: true,
      department: true,
      bio: true,
      expertise: true,
      createdAt: true,
    },
  });

  const contributorStats = await Promise.all(
    contributors.map(async (c) => {
      const annotations = await prisma.annotation.findMany({
        where: { contributorId: c.id },
        select: { status: true, page: { select: { manuscriptId: true } } },
      });

      const approved = annotations.filter((a) => a.status === "APPROVED").length;
      const rejected = annotations.filter((a) => a.status === "REJECTED").length;
      const uniqueManuscripts = new Set(
        annotations.map((a) => a.page.manuscriptId)
      ).size;

      const totalReviewed = approved + rejected;
      const rating =
        totalReviewed > 0
          ? Math.round((approved / totalReviewed) * 100)
          : 0;

      return {
        ...c,
        totalAnnotations: annotations.length,
        approved,
        rating,
        uniqueManuscripts,
      };
    })
  );

  const totalContributors = contributorStats.length;

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Beranda
        </Link>

        {/* Hero */}
        <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-teal-700 rounded-2xl p-8 md:p-10 text-white shadow-lg mt-4 mb-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur border border-white/20 mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Kontributor LONTAR
            </h1>
            <p className="text-sky-100 max-w-2xl mx-auto text-sm md:text-base">
              Mereka adalah para penerjemah naskah Nusantara yang telah
              terverifikasi. Terima kasih atas dedikasi mereka dalam
              melestarikan warisan budaya.
            </p>

            <div className="inline-flex items-center justify-center bg-white/10 backdrop-blur border border-white/20 rounded-xl px-8 py-4 mt-6">
              <div className="text-center">
                <p className="text-3xl font-bold">{totalContributors}</p>
                <p className="text-xs text-sky-200 mt-1 uppercase tracking-wider">
                  Kontributor Aktif
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* List kontributor */}
        {contributorStats.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-xl p-12 text-center shadow-sm">
            <div className="text-5xl mb-3">👤</div>
            <p className="text-slate-500">Belum ada kontributor terverifikasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contributorStats.map((c) => {
              const initials = c.name
                .split(" ")
                .map((w) => w.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase();

              return (
                <Link
                  key={c.id}
                  href={`/kontributor-publik/${c.id}`}
                  className="group bg-white rounded-xl border border-sky-100 p-5 shadow-sm hover:shadow-lg hover:border-teal-400 transition-all"
                >
                  {/* Avatar + nama */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-900 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-900 text-lg leading-tight truncate group-hover:text-teal-700 transition">
                        {c.name}
                      </h3>
                      {c.institution && (
                        <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                          <span>🏛️</span>
                          <span className="truncate">{c.institution}</span>
                        </p>
                      )}
                      {c.department && (
                        <p className="text-xs text-slate-500 truncate">
                          {c.department}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {c.bio && (
                    <p className="text-sm text-slate-600 italic line-clamp-2 mb-3 leading-relaxed">
                      &quot;{c.bio}&quot;
                    </p>
                  )}

                  {/* Keahlian */}
                  {c.expertise.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.expertise.slice(0, 4).map((e) => (
                        <span
                          key={e}
                          className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-100 rounded text-[10px] font-medium"
                        >
                          {formatScript(e)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-sky-50">
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-900">
                        {c.approved}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Approved
                      </p>
                    </div>
                    <div className="text-center border-x border-sky-50">
                      <p className="text-lg font-bold text-teal-700">
                        {c.uniqueManuscripts}
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Naskah
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-600">
                        {c.rating}%
                      </p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                        Rating
                      </p>
                    </div>
                  </div>

                  {/* Hint */}
                  <p className="text-[10px] text-teal-600 font-medium mt-3 text-center opacity-0 group-hover:opacity-100 transition">
                    Klik untuk lihat profil →
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}