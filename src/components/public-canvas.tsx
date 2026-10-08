"use client";

import { useState, useEffect, useRef } from "react";

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
  const [showBoxes, setShowBoxes] = useState(false);
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Cek browser dukung Web Speech API
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setVoiceSupported(true);
    }

    return () => {
      // Stop audio saat pindah halaman / unmount
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function findIndonesianVoice(): SpeechSynthesisVoice | null {
    if (!voiceSupported) return null;
    const voices = window.speechSynthesis.getVoices();
    // Prioritas: id-ID → id → apapun yang mengandung "Indonesia"
    return (
      voices.find((v) => v.lang === "id-ID") ||
      voices.find((v) => v.lang.startsWith("id")) ||
      voices.find((v) => v.name.toLowerCase().includes("indonesia")) ||
      null
    );
  }

  function speak(annotation: Annotation) {
    if (!voiceSupported) return;

    // Kalau tombol yang sama diklik lagi, stop
    if (speakingId === annotation.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    // Stop audio yang sedang jalan
    window.speechSynthesis.cancel();

    const text = `${annotation.transliteration}. ${annotation.translation}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;
    utterance.pitch = 1;

    const voice = findIndonesianVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeakingId(annotation.id);
  }

  function speakAll() {
    if (!voiceSupported || annotations.length === 0) return;

    if (speakingId === "all") {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const text = annotations
      .map((a) => `${a.transliteration}. ${a.translation}`)
      .join(". ");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";
    utterance.rate = 0.9;

    const voice = findIndonesianVoice();
    if (voice) utterance.voice = voice;

    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeakingId("all");
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between text-sm flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
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

          {voiceSupported && annotations.length > 0 && (
            <button
              onClick={speakAll}
              className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition flex items-center gap-1.5 ${
                speakingId === "all"
                  ? "bg-teal-600 text-white border-teal-600 shadow-md"
                  : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"
              }`}
            >
              {speakingId === "all" ? (
                <>⏸ Stop Semua</>
              ) : (
                <>🔊 Putar Semua</>
              )}
            </button>
          )}

          <span className="text-slate-500 text-xs">
            {annotations.length} kata terverifikasi
          </span>
        </div>

        {voiceSupported && (
          <span className="text-[10px] text-slate-400 hidden md:block">
            🎧 Audio text-to-speech aktif
          </span>
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
          annotations.map((a, i) => (
            <div
              key={a.id}
              className={`absolute border-2 transition-all cursor-pointer ${
                selected?.id === a.id
                  ? "border-blue-700 bg-blue-500/30 z-20"
                  : "border-teal-500 bg-teal-500/15 hover:bg-teal-500/30 hover:border-teal-600 z-10"
              }`}
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                width: `${a.w * 100}%`,
                height: `${a.h * 100}%`,
              }}
              onClick={() => setSelected(a)}
            >
              <span className="absolute -top-5 left-0 text-[10px] bg-blue-900 text-white px-1.5 py-0.5 rounded font-bold">
                {i + 1}
              </span>
            </div>
          ))}
      </div>

      {/* List Anotasi */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-5 bg-teal-500 rounded"></div>
          <h3 className="font-bold text-blue-900">
            Teks Hasil Transliterasi
          </h3>
        </div>

        {annotations.length === 0 ? (
          <div className="bg-white border border-sky-100 rounded-xl p-8 text-center text-slate-500 text-sm">
            Belum ada transliterasi untuk halaman ini.
          </div>
        ) : (
          <div className="space-y-4">
            {annotations.map((a, i) => {
              const isSpeaking = speakingId === a.id;
              return (
                <div key={a.id}>
                  {/* Header nomor + kontributor + tombol audio */}
                  <div className="flex items-center justify-between mb-2 px-1 gap-2">
                    <span className="text-xs font-bold text-blue-900 tracking-wider">
                      KATA #{i + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        oleh {a.contributorName}
                      </span>
                      {voiceSupported && (
                        <button
                          onClick={() => speak(a)}
                          title={
                            isSpeaking
                              ? "Stop audio"
                              : "Putar transliterasi + terjemahan"
                          }
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-full transition ${
                            isSpeaking
                              ? "bg-teal-600 text-white shadow-md animate-pulse"
                              : "bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200"
                          }`}
                        >
                          {isSpeaking ? "⏸" : "🔊"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3 kotak sejajar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Kotak Transliterasi */}
                    <div
                      className={`rounded-xl border-2 overflow-hidden shadow-sm transition cursor-pointer ${
                        selected?.id === a.id
                          ? "border-blue-700 shadow-md"
                          : "border-sky-100 hover:border-teal-300 hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelected(a);
                        setShowBoxes(true);
                      }}
                    >
                      <div className="bg-blue-900 px-3 py-2">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Transliterasi
                        </p>
                      </div>
                      <div className="bg-white p-3 min-h-[80px]">
                        <p className="text-blue-900 font-semibold text-base leading-snug">
                          {a.transliteration}
                        </p>
                        {a.pegonText && (
                          <p className="text-xs text-slate-500 mt-2 font-mono leading-relaxed">
                            {a.pegonText}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Kotak Terjemahan */}
                    <div
                      className={`rounded-xl border-2 overflow-hidden shadow-sm transition cursor-pointer ${
                        selected?.id === a.id
                          ? "border-blue-700 shadow-md"
                          : "border-sky-100 hover:border-teal-300 hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelected(a);
                        setShowBoxes(true);
                      }}
                    >
                      <div className="bg-teal-700 px-3 py-2">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Terjemahan
                        </p>
                      </div>
                      <div className="bg-white p-3 min-h-[80px]">
                        <p className="text-slate-700 text-sm leading-relaxed">
                          {a.translation}
                        </p>
                      </div>
                    </div>

                    {/* Kotak Aparatus Kritis */}
                    <div
                      className={`rounded-xl border-2 overflow-hidden shadow-sm transition cursor-pointer ${
                        selected?.id === a.id
                          ? "border-blue-700 shadow-md"
                          : "border-sky-100 hover:border-teal-300 hover:shadow-md"
                      }`}
                      onClick={() => {
                        setSelected(a);
                        setShowBoxes(true);
                      }}
                    >
                      <div className="bg-slate-700 px-3 py-2">
                        <p className="text-[10px] font-bold text-white uppercase tracking-wider">
                          Aparatus Kritis
                        </p>
                      </div>
                      <div className="bg-white p-3 min-h-[80px]">
                        <p className="text-slate-600 text-sm italic leading-relaxed">
                          {a.notes || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        💡 Klik salah satu kotak untuk menyorot posisi kata di gambar. Klik 🔊
        untuk mendengar transliterasi &amp; terjemahan.
      </p>
    </div>
  );
}