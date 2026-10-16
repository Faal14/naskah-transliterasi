import Link from "next/link";
import { formatScript, getScriptColor } from "@/lib/script-label";

export type ManuscriptCardData = {
  id: string;
  title: string | null;
  script: string | null;
  year: string | null;
  source: string | null;
  description: string | null;
  firstPageUrl: string | null;
  stats: {
    totalApproved: number;
    publishedPages: number;
    totalPages: number;
  };
};

export default function ManuscriptCard({ m }: { m: ManuscriptCardData }) {
  return (
    <Link
      href={`/naskah/${m.id}`}
      className="group bg-white rounded-xl border border-sky-100 p-5 hover:border-teal-400 hover:shadow-lg transition-all flex flex-col"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-bold text-lg leading-tight text-slate-900">
          {m.title || "Tanpa judul"}
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
  );
}