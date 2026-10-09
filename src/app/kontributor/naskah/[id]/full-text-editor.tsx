"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveFullText } from "./actions";

export default function FullTextEditor({
  pageId,
  value,
  onChange,
  translationValue,
  onTranslationChange,
  apparatusValue,
  onApparatusChange,
}: {
  pageId: string;
  value: string;
  onChange: (v: string) => void;
  translationValue: string;
  onTranslationChange: (v: string) => void;
  apparatusValue: string;
  onApparatusChange: (v: string) => void;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [lastSaved, setLastSaved] = useState({
    translit: value,
    translation: translationValue,
    apparatus: apparatusValue,
  });

  const isDirty =
    value !== lastSaved.translit ||
    translationValue !== lastSaved.translation ||
    apparatusValue !== lastSaved.apparatus;

  async function handleSave() {
    setSaving(true);
    setMessage("");

    try {
      await saveFullText(pageId, value, translationValue, apparatusValue);
      setLastSaved({
        translit: value,
        translation: translationValue,
        apparatus: apparatusValue,
      });
      setMessage("✅ Paragraf utuh tersimpan");
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage("❌ " + (err.message || "Gagal menyimpan"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-6 bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-teal-500 rounded"></div>
          <h3 className="font-bold text-blue-900">📝 Paragraf Utuh</h3>
        </div>
        <p className="text-xs text-slate-500">
          Otomatis terisi dari anotasi. Bisa diedit manual.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
            Alih Aksara (Transliterasi Utuh)
          </label>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={8}
            placeholder="Otomatis terisi dari anotasi per kata..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent font-serif"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {value.split(/\s+/).filter(Boolean).length} kata
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
            Alih Bahasa (Terjemahan Utuh)
          </label>
          <textarea
            value={translationValue}
            onChange={(e) => onTranslationChange(e.target.value)}
            rows={8}
            placeholder="Otomatis terisi dari anotasi per kata..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
          <p className="text-[10px] text-slate-400 mt-1">
            {translationValue.split(/\s+/).filter(Boolean).length} kata
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
          Aparatus Kritis
        </label>
        <textarea
          value={apparatusValue}
          onChange={(e) => onApparatusChange(e.target.value)}
          rows={4}
          placeholder="Catatan filologis, varian bacaan, tafsir ganda, atau keterangan lain untuk halaman ini..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent italic"
        />
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-sky-100">
        <button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-md transition"
        >
          {saving
            ? "Menyimpan..."
            : isDirty
              ? "💾 Simpan Paragraf"
              : "✅ Tersimpan"}
        </button>
        {message && (
          <p className="text-sm text-slate-700 font-medium">{message}</p>
        )}
        {isDirty && !message && (
          <p className="text-xs text-amber-600">
            ⚠️ Ada perubahan belum disimpan
          </p>
        )}
      </div>
    </div>
  );
}