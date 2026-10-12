import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";
import { formatScript, getScriptColor } from "@/lib/script-label";

export default async function KontributorProfilePublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const contributor = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      institution: true,
      department: true,
      bio: true,
      expertise: true,
      cvUrl: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  if (!contributor || contributor.role !== "CONTRIBUTOR") {
    notFound();
  }

  if (contributor.status !== "APPROVED") {
    notFound();
  }

  // Ambil semua anotasi kontributor
  const annotations = await prisma.annotation.findMany({
    where: { contributorId: id },
    include: {
      page: {
        include: {
          manuscript: {
            select: { id: true, title: true, script: true, year: true },
          },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const approved = annotations.filter((a) => a.status === "APPROVED");
  const rejected = annotations.filter((a) => a.status === "REJECTED");
  const submitted = annotations.filter((a) => a.status === "SUBMITTED");

  const totalReviewed = approved.length + rejected.length;
  const rating =
    totalReviewed > 0
      ? Math.round((approved.length / totalReviewed) * 100)
      : 0;

  // Naskah unik yang dikerjakan
  const uniqueManuscripts = new Map<
    string,
    { id: string; title: string; script: string; year: string | null; count: number }
  >();
  annotations.forEach((a) => {
    const m = a.page.manuscript;
    if (!uniqueManuscripts.has(m.id)) {
      uniqueManuscripts.set(m.id, {
        id: m.id,
        title: m.title,
        script: m.script,
        year: m.year,
        count: 0,
      });
    }
    const entry = uniqueManuscripts.get(m.id)!;
    if (a.status === "APPROVED") entry.count++;
  });

  const manuscriptsList = Array.from(uniqueManuscripts.values()).sort(
    (a, b) => b.count - a.count
  );

  const initials = contributor.name
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = new Date(contributor.createdAt).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="min-h-screen bg-sky-50">
      <SiteHeader />

      <main className="max-w-5xl mx-auto px-6 py-8">
        <Link
          href="/kontributor-publik"
          className="text-sm text-slate-600 hover:text-teal-700 hover:underline transition"
        >
          ← Daftar Kontributor
        </Link>

        {/* Header profil */}
        <div className="bg-gradient-to-br from-blue-900 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg mt-4 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-3xl font-bold shadow-lg shrink-0">
              {initials}
            </div>

            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">
                {contributor.name}
              </h1>

              {(contributor.institution || contributor.department) && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-sm text-sky-100 mt-2">
                  <span>🏛️</span>
                  <span>
                    {contributor.institution}
                    {contributor.department && ` · ${contributor.department}`}
                  </span>
                </div>
              )}

              {contributor.bio && (
                <p className="text-sm text-sky-100 mt-3 italic leading-relaxed max-w-2xl">
                  &quot;{contributor.bio}&quot;
                </p>
              )}

              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                  Kontributor
                </span>
                <span className="px-2.5 py-0.5 bg-green-500/30 rounded-full text-xs font-medium">
                  ✓ Terverifikasi
                </span>
                <span className="text-xs text-sky-200 self-center">
                  · Bergabung sejak {memberSince}
                </span>
              </div>

              {contributor.cvUrl && (
                <a
                  href={contributor.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 bg-white/20 backdrop-blur border border-white/40 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition"
                >
                  📄 Lihat CV / Portofolio ↗
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <StatBox label="Approved" value={approved.length} icon="✅" color="green" />
          <StatBox
            label="Total Anotasi"
            value={annotations.length}
            icon="✍️"
            color="blue"
          />
          <StatBox
            label="Naskah"
            value={uniqueManuscripts.size}
            icon="📚"
            color="teal"
          />
          <StatBox
            label="Rating"
            value={`${rating}%`}
            icon="⭐"
            color="amber"
          />
        </div>

        {/* Keahlian Aksara */}
        {contributor.expertise.length > 0 && (
          <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-sky-50 px-5 py-3 border-b border-sky-100">
              <h2 className="font-bold text-blue-900 text-sm">
                🎯 Keahlian Aksara
              </h2>
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {contributor.expertise.map((e) => (
                <span
                  key={e}
                  className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-100 rounded-full text-xs font-medium"
                >
                  {formatScript(e)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Naskah yang Dikerjakan */}
        <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden mb-6">
          <div className="bg-sky-50 px-5 py-3 border-b border-sky-100 flex items-center justify-between">
            <h2 className="font-bold text-blue-900 text-sm">
              📖 Naskah yang Dikerjakan
            </h2>
            <span className="text-xs text-slate-500">
              {manuscriptsList.length} naskah
            </span>
          </div>
          <div className="p-5">
            {manuscriptsList.length === 0 ? (
              <p className="text-sm text-slate-400 italic text-center py-4">
                Belum ada naskah yang dikerjakan.
              </p>
            ) : (
              <div className="space-y-2">
                {manuscriptsList.map((m) => (
                  <Link
                    key={m.id}
                    href={`/naskah/${m.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-sky-50 hover:border-teal-300 hover:bg-sky-50 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${getScriptColor(
                          m.script
                        )}`}
                      >
                        {formatScript(m.script)}
                      </span>
                      <span className="font-medium text-slate-800 truncate group-hover:text-teal-700">
                        {m.title}
                      </span>
                      {m.year && (
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          ({m.year})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-xs font-medium text-teal-700">
                        {m.count} anotasi
                      </span>
                      <span className="text-xs text-slate-400 group-hover:text-teal-700 transition">
                        →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Statistik Status */}
        <div className="bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
          <div className="bg-sky-50 px-5 py-3 border-b border-sky-100">
            <h2 className="font-bold text-blue-900 text-sm">
              📊 Status Anotasi
            </h2>
          </div>
          <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-700">
                {annotations.filter((a) => a.status === "DRAFT").length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Draft</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">
                {submitted.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Menunggu Review</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {approved.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Approved</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {rejected.length}
              </p>
              <p className="text-xs text-slate-500 mt-1">Rejected</p>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | string;
  icon: string;
  color: "blue" | "teal" | "green" | "amber";
}) {
  const colors = {
    blue: "bg-blue-50 border-blue-100 text-blue-900",
    teal: "bg-teal-50 border-teal-100 text-teal-900",
    green: "bg-green-50 border-green-100 text-green-900",
    amber: "bg-amber-50 border-amber-100 text-amber-900",
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 text-center shadow-sm ${colors[color]}`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-[10px] mt-0.5 opacity-70 uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}