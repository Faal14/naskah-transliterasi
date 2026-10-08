import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatScript } from "@/lib/script-label";

export default async function ProfilPage() {
  const session = await auth();
  const user = session!.user as any;

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) return null;

  const annotations = await prisma.annotation.findMany({
    where: { contributorId: user.id },
    include: {
      page: { select: { manuscriptId: true } },
    },
  });

  const draftCount = annotations.filter((a) => a.status === "DRAFT").length;
  const submittedCount = annotations.filter(
    (a) => a.status === "SUBMITTED"
  ).length;
  const approvedCount = annotations.filter(
    (a) => a.status === "APPROVED"
  ).length;
  const rejectedCount = annotations.filter(
    (a) => a.status === "REJECTED"
  ).length;

  const uniqueManuscripts = new Set(
    annotations.map((a) => a.page.manuscriptId)
  ).size;

  const totalReviewed = approvedCount + rejectedCount;
  const rating =
    totalReviewed > 0
      ? Math.round((approvedCount / totalReviewed) * 100)
      : 0;

  const initials = dbUser.name
    .split(" ")
    .map((w) => w.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const memberSince = new Date(dbUser.createdAt).toLocaleDateString(
    "id-ID",
    { day: "numeric", month: "long", year: "numeric" }
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header profil */}
      <div className="bg-gradient-to-r from-blue-900 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-2 border-white/40 flex items-center justify-center text-3xl font-bold shadow-lg">
            {initials}
          </div>

          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-1">
              {dbUser.name}
            </h1>
            <p className="text-sky-100 text-sm">{dbUser.email}</p>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur rounded-full text-xs font-medium">
                {dbUser.role}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  dbUser.status === "APPROVED"
                    ? "bg-green-500/30 text-green-50"
                    : "bg-yellow-500/30 text-yellow-50"
                }`}
              >
                {dbUser.status}
              </span>
            </div>
            <p className="text-xs text-sky-200 mt-3">
              Bergabung sejak {memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Statistik Grid — 3 kotak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
        <StatBox
          label="Naskah Dikerjakan"
          value={uniqueManuscripts}
          icon="📚"
          color="teal"
        />
        <StatBox
          label="Approved"
          value={approvedCount}
          icon="✅"
          color="green"
        />
        <StatBox
          label="Rating"
          value={`${rating}%`}
          icon="⭐"
          color="amber"
        />
      </div>

      {/* Status Detail */}
      <div className="mt-6 bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="bg-sky-50 px-5 py-3 border-b border-sky-100">
          <h2 className="font-bold text-blue-900 text-sm">
            📊 Status Anotasi
          </h2>
        </div>
        <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-700">{draftCount}</p>
            <p className="text-xs text-slate-500 mt-1">Draft</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">
              {submittedCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">Menunggu Review</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {approvedCount}
            </p>
            <p className="text-xs text-slate-500 mt-1">Approved</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
            <p className="text-xs text-slate-500 mt-1">Rejected</p>
          </div>
        </div>
      </div>

      {/* Biodata */}
      <div className="mt-6 bg-white rounded-xl border border-sky-100 shadow-sm overflow-hidden">
        <div className="bg-sky-50 px-5 py-3 border-b border-sky-100">
          <h2 className="font-bold text-blue-900 text-sm">👤 Biodata</h2>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <Row label="Nama Lengkap" value={dbUser.name} />
          <Row label="Email" value={dbUser.email} />
          <Row
            label="Peran"
            value={
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {dbUser.role}
              </span>
            }
          />
          <Row
            label="Status"
            value={
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  dbUser.status === "APPROVED"
                    ? "bg-green-100 text-green-700"
                    : dbUser.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                }`}
              >
                {dbUser.status}
              </span>
            }
          />
          <Row
            label="Keahlian Aksara"
            value={
              dbUser.expertise.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {dbUser.expertise.map((e) => (
                    <span
                      key={e}
                      className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded text-xs font-medium"
                    >
                      {formatScript(e)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-slate-400 italic">Belum diisi</span>
              )
            }
          />
          <Row
            label="CV / Portofolio"
            value={
              dbUser.cvUrl ? (
                <a
                  href={dbUser.cvUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:underline font-medium"
                >
                  Lihat CV ↗
                </a>
              ) : (
                <span className="text-slate-400 italic">Belum diisi</span>
              )
            }
          />
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <p className="font-medium mb-1">💡 Info</p>
        <p className="text-xs leading-relaxed">
          Data institusi dan biografi akan ditambahkan pada update berikutnya.
          Sementara, hubungi admin jika ingin mengubah data profil Anda.
        </p>
      </div>
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
      <div className="text-2xl mb-1">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs mt-0.5 opacity-70">{label}</p>
    </div>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4">
      <p className="text-slate-500 text-xs md:text-sm md:w-40 shrink-0">
        {label}
      </p>
      <div className="text-slate-800 text-sm">{value}</div>
    </div>
  );
}