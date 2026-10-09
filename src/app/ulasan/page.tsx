import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import Link from "next/link";

export default async function UlasanPage() {
  const session = await auth();

  const reviews = await prisma.platformReview.findMany({
    orderBy: { createdAt: "desc" },
  });

  const ratings = await prisma.platformRating.findMany({
    select: { score: true },
  });

  const totalRatings = ratings.length;
  const averageScore =
    totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;

  // Distribusi rating
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r.score === star).length,
    percent:
      totalRatings > 0
        ? (ratings.filter((r) => r.score === star).length / totalRatings) * 100
        : 0,
  }));

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <Link
          href="/"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Beranda
        </Link>

        <div className="mt-4 mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h1 className="text-2xl md:text-3xl font-bold text-blue-900">
              Ulasan Platform LONTAR
            </h1>
          </div>
          <p className="text-sm text-slate-600 ml-4">
            Semua ulasan dari pengguna platform
          </p>
        </div>

        {/* Ringkasan rating */}
        <div className="bg-gradient-to-br from-blue-900 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="text-center">
              <p className="text-6xl font-bold">
                {totalRatings > 0 ? averageScore.toFixed(1) : "—"}
              </p>
              <div className="flex gap-1 mt-2 justify-center">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`text-2xl ${
                      n <= Math.round(averageScore)
                        ? "text-amber-400"
                        : "text-white/30"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-sm text-sky-200 mt-2">
                {totalRatings} penilaian
              </p>
            </div>

            {/* Distribusi */}
            <div className="flex-1 w-full">
              {distribution.map((d) => (
                <div key={d.star} className="flex items-center gap-3 mb-1">
                  <span className="text-xs w-4 text-sky-100">{d.star}</span>
                  <span className="text-amber-400 text-sm">★</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${d.percent}%` }}
                    />
                  </div>
                  <span className="text-xs text-sky-100 w-8 text-right">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* List ulasan */}
        {reviews.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-xl p-12 text-center">
            <div className="text-5xl mb-3">💭</div>
            <p className="text-slate-500">Belum ada ulasan.</p>
            <Link
              href="/"
              className="text-teal-700 hover:underline font-medium text-sm mt-2 inline-block"
            >
              Kembali ke Beranda → Tulis ulasan pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="bg-white border border-sky-100 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-800 to-teal-700 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {r.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-slate-900">
                        {r.displayName}
                      </p>
                      <span className="text-xs text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {r.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
