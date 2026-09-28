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
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            {showBoxes ? "👁 Sembunyikan Kotak" : "👁 Tampilkan Kotak"}
          </button>
          <span className="text-gray-500 text-xs">
            {annotations.length} anotasi terverifikasi
          </span>
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-xs text-gray-500 hover:underline"
          >
            Tutup panel detail
          </button>
        )}
      </div>

      {/* Canvas */}
      <div className="relative bg-gray-100 rounded-lg overflow-hidden">
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
                  ? "border-blue-600 bg-blue-500/30 z-20"
                  : hovered?.id === a.id
                    ? "border-blue-500 bg-blue-500/20 z-10"
                    : "border-green-500 bg-green-500/10 hover:bg-green-500/20"
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
            className="absolute z-30 pointer-events-none bg-black/90 text-white px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs"
            style={{
              left: Math.min(tooltipPos.x + 15, 9999),
              top: tooltipPos.y + 15,
            }}
          >
            <p className="font-medium">{hovered.transliteration}</p>
            <p className="text-xs text-gray-300 mt-1">
              {hovered.translation}
            </p>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="bg-white border rounded-lg p-5">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold">Detail Anotasi</h3>
            <span className="text-xs text-gray-500">
              oleh {selected.contributorName}
            </span>
          </div>

          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                Transliterasi Latin
              </p>
              <p className="font-medium text-lg">{selected.transliteration}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-0.5">
                Terjemahan Indonesia
              </p>
              <p>{selected.translation}</p>
            </div>

            {selected.pegonText && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">Teks Asli</p>
                <p className="font-mono">{selected.pegonText}</p>
              </div>
            )}

            {selected.notes && (
              <div>
                <p className="text-xs text-gray-500 mb-0.5">
                  Catatan Filologis
                </p>
                <p className="text-gray-700 italic">{selected.notes}</p>
              </div>
            )}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500">
        💡 Arahkan kursor ke kotak untuk melihat transliterasi. Klik kotak untuk
        detail lengkap.
      </p>
    </div>
  );
}