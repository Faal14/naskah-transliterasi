"use client";

import { useState } from "react";

type Annotation = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  transliteration: string;
  translation: string;
  notes: string | null;
  pegonText: string | null;
  contributorName: string;
};

export default function PublicCanvas({
  imageUrl,
  annotations,
}: {
  imageUrl: string;
  annotations: Annotation[];
}) {
  const [hovered, setHovered] = useState<Annotation | null>(null);
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [showBoxes, setShowBoxes] = useState(true);
  const [tooltipPos, setTooltipPos] = useState<{
    x: number;
    y: number;
  } | null>(null);

  function handleMouseEnter(
    a: Annotation,
    e: React.MouseEvent<HTMLDivElement>
  ) {
    setHovered(a);
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition ${
              showBoxes
                ? "bg-blue-900 text-white border-blue-900 shadow-md"
                : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
            }`}
          >
            {showBoxes ? "👁 Sembunyikan Kotak" : "👁 Tampilkan Kotak"}
          </button>
          <span className="text-slate-500 text-xs">
            {annotations.length} anotasi terverifikasi
          </span>
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-slate-500 hover:text-teal-700 hover:underline"
          >
            Tutup panel detail
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative bg-sky-50 rounded-xl overflow-hidden border border-sky-100">
        <img
          src={imageUrl}
          alt="Naskah"
          className="w-full block"
          draggable={false}
        />

        {showBoxes &&
          annotations.map((a) => (
            <div
              key={a.id}
              className={`absolute border-2 transition-all cursor-pointer ${
                selected?.id === a.id
                  ? "border-blue-700 bg-blue-500/30 z-20"
                  : hovered?.id === a.id
                    ? "border-teal-500 bg-teal-500/20 z-10"
                    : "border-teal-500 bg-teal-500/10 hover:bg-teal-500/20"
              }`}
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                width: `${a.w * 100}%`,
                height: `${a.h * 100}%`,
              }}
              onMouseEnter={(e) => handleMouseEnter(a, e)}
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(a)}
            />
          ))}

        {/* Tooltip on hover */}
        {hovered && tooltipPos && !selected && (
          <div
            className="absolute z-30 pointer-events-none bg-blue-900/95 text-white px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs"
            style={{
              left: Math.min(tooltipPos.x + 15, 9999),
              top: tooltipPos.y + 15,
            }}
          >
            <p className="font-medium">{hovered.transliteration}</p>
            <p className="text-xs text-sky-200 mt-1">{hovered.translation}</p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-white border border-sky-100 rounded-xl p-5 shadow-md">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-teal-500 rounded"></div>
              <h3 className="font-bold text-blue-900">Detail Anotasi</h3>
            </div>
            <span className="text-xs text-slate-500">
              oleh {selected.contributorName}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">
                Transliterasi Latin
              </p>
              <p className="font-medium text-lg text-blue-900">
                {selected.transliteration}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500 mb-0.5">
                Terjemahan Indonesia
              </p>
              <p className="text-slate-700">{selected.translation}</p>
            </div>

            {selected.pegonText && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Teks Asli</p>
                <p className="font-mono text-blue-900">
                  {selected.pegonText}
                </p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p className="text-xs text-slate-500 mb-0.5">
                  Catatan Filologis
                </p>
                <p className="text-slate-600 italic">{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">
        💡 Arahkan kursor ke kotak untuk melihat transliterasi. Klik kotak untuk
        detail lengkap.
      </p>
    </div>
  );
}