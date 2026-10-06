"use client";

import { useRef, useState, useEffect } from "react";
import {
  createAnnotation,
  deleteAnnotation,
  updateAnnotation,
} from "@/app/kontributor/naskah/[id]/actions";

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
  status: string;
};

type Props = {
  pageId: string;
  imageUrl: string;
  initialAnnotations: Annotation[];
};

type Draft = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export default function AnnotationCanvas({
  pageId,
  imageUrl,
  initialAnnotations,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] =
    useState<Annotation[]>(initialAnnotations);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [formMode, setFormMode] = useState<"new" | "edit" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Sync state ketika initialAnnotations berubah (setelah router.refresh)
  useEffect(() => {
    setAnnotations(initialAnnotations);
  }, [initialAnnotations]);

  function getRelativePos(clientX: number, clientY: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    if (formMode) return;
    if (e.button !== 0) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    setStartPos(pos);
    setDraft({ x: pos.x, y: pos.y, w: 0, h: 0 });
    (e.target as Element).setPointerCapture?.(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!startPos) return;
    const pos = getRelativePos(e.clientX, e.clientY);
    const x = Math.min(startPos.x, pos.x);
    const y = Math.min(startPos.y, pos.y);
    const w = Math.abs(pos.x - startPos.x);
    const h = Math.abs(pos.y - startPos.y);
    setDraft({ x, y, w, h });
  }

  function handlePointerUp() {
    if (!startPos || !draft) return;

    if (draft.w < 0.01 || draft.h < 0.01) {
      setDraft(null);
      setStartPos(null);
      return;
    }

    setStartPos(null);
    setSelected(null);
    setFormMode("new");
  }

  function handleSelectAnnotation(a: Annotation) {
    if (formMode) return;
    setSelected(a);
    setDraft(null);
    setFormMode("edit");
  }

  function cancelForm() {
    setFormMode(null);
    setDraft(null);
    setSelected(null);
    setError("");
  }

  async function handleSaveNew(formData: {
    transliteration: string;
    translation: string;
    notes: string;
    pegonText: string;
  }) {
    if (!draft) return;
    setSaving(true);
    setError("");

    try {
      const result = await createAnnotation({
        pageId,
        x: draft.x,
        y: draft.y,
        w: draft.w,
        h: draft.h,
        transliteration: formData.transliteration,
        translation: formData.translation,
        notes: formData.notes,
        pegonText: formData.pegonText,
      });

      if (result.success && result.annotation) {
        setAnnotations([...annotations, result.annotation as Annotation]);
        cancelForm();
      }
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(formData: {
    transliteration: string;
    translation: string;
    notes: string;
    pegonText: string;
  }) {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      await updateAnnotation(selected.id, formData);
      setAnnotations(
        annotations.map((a) =>
          a.id === selected.id
            ? {
                ...a,
                transliteration: formData.transliteration,
                translation: formData.translation,
                notes: formData.notes || null,
                pegonText: formData.pegonText || null,
              }
            : a
        )
      );
      cancelForm();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm("Hapus anotasi ini?")) return;

    setSaving(true);
    try {
      await deleteAnnotation(selected.id);
      setAnnotations(annotations.filter((a) => a.id !== selected.id));
      cancelForm();
    } catch (err: any) {
      setError(err.message || "Gagal menghapus");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        ref={containerRef}
        className="relative bg-sky-50 rounded-xl overflow-hidden select-none border border-sky-100"
        style={{
          touchAction: "none",
          cursor: formMode ? "default" : "crosshair",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Naskah"
          className="w-full block pointer-events-none"
          draggable={false}
        />

        {/* Existing annotations */}
        {annotations.map((a) => (
          <div
            key={a.id}
            className={`absolute border-2 transition-colors ${
              selected?.id === a.id
                ? "border-blue-700 bg-blue-500/20"
                : a.status === "APPROVED"
                  ? "border-green-500 bg-green-500/10"
                  : a.status === "SUBMITTED"
                    ? "border-yellow-500 bg-yellow-500/10"
                    : a.status === "REJECTED"
                      ? "border-red-500 bg-red-500/10"
                      : "border-teal-500 bg-teal-500/10"
            }`}
            style={{
              left: `${a.x * 100}%`,
              top: `${a.y * 100}%`,
              width: `${a.w * 100}%`,
              height: `${a.h * 100}%`,
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              handleSelectAnnotation(a);
            }}
          >
            <span className="absolute -top-5 left-0 text-xs bg-blue-900/85 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
              {a.transliteration.slice(0, 20)}
              {a.transliteration.length > 20 ? "..." : ""}
            </span>
          </div>
        ))}

        {/* Draft box (sedang digambar) */}
        {draft && (
          <div
            className="absolute border-2 border-dashed border-red-500 bg-red-500/10 pointer-events-none"
            style={{
              left: `${draft.x * 100}%`,
              top: `${draft.y * 100}%`,
              width: `${draft.w * 100}%`,
              height: `${draft.h * 100}%`,
            }}
          />
        )}
      </div>

      {/* Form popup */}
      {formMode && (
        <div className="bg-white border border-sky-100 rounded-xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1 h-5 bg-teal-500 rounded"></div>
            <h3 className="font-bold text-blue-900">
              {formMode === "new" ? "Anotasi Baru" : "Edit Anotasi"}
            </h3>
          </div>

          <AnnotationForm
            initial={
              formMode === "edit" && selected
                ? {
                    transliteration: selected.transliteration,
                    translation: selected.translation,
                    notes: selected.notes || "",
                    pegonText: selected.pegonText || "",
                  }
                : undefined
            }
            saving={saving}
            error={error}
            onSave={formMode === "new" ? handleSaveNew : handleUpdate}
            onCancel={cancelForm}
            onDelete={formMode === "edit" ? handleDelete : undefined}
          />
        </div>
      )}

      <p className="text-xs text-slate-500">
        💡 Drag di atas gambar untuk membuat kotak baru. Klik kotak yang sudah
        ada untuk mengedit.
      </p>
    </div>
  );
}

function AnnotationForm({
  initial,
  saving,
  error,
  onSave,
  onCancel,
  onDelete,
}: {
  initial?: {
    transliteration: string;
    translation: string;
    notes: string;
    pegonText: string;
  };
  saving: boolean;
  error: string;
  onSave: (data: {
    transliteration: string;
    translation: string;
    notes: string;
    pegonText: string;
  }) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [transliteration, setTransliteration] = useState(
    initial?.transliteration || ""
  );
  const [translation, setTranslation] = useState(initial?.translation || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [pegonText, setPegonText] = useState(initial?.pegonText || "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transliteration.trim() || !translation.trim()) return;
    onSave({ transliteration, translation, notes, pegonText });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Transliterasi Latin <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={transliteration}
          onChange={(e) => setTransliteration(e.target.value)}
          required
          autoFocus
          placeholder="cth: sang nata..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Terjemahan Indonesia <span className="text-red-500">*</span>
        </label>
        <textarea
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          required
          rows={2}
          placeholder="cth: sang raja..."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Teks Asli{" "}
          <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <input
          type="text"
          value={pegonText}
          onChange={(e) => setPegonText(e.target.value)}
          placeholder="Teks Pegon/Hanacaraka jika ada"
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Catatan Filologis{" "}
          <span className="text-slate-400 font-normal">(opsional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Varian bacaan, tafsir ganda, dll."
          className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="bg-gradient-to-r from-blue-800 to-blue-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-900 hover:to-blue-950 disabled:opacity-50 shadow-md transition"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50 transition font-medium"
        >
          Batal
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={saving}
            className="ml-auto px-4 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition font-medium"
          >
            Hapus
          </button>
        )}
      </div>
    </form>
  );
}