"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewAnnotation, reviewAllSubmitted } from "../actions";

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
  contributorName: string;
  reviews: {
    id: string;
    decision: string;
    comment: string | null;
    createdAt: string;
    reviewerName: string;
  }[];
};

export default function ReviewCanvas({
  pageId,
  imageUrl,
  initialAnnotations,
}: {
  pageId: string;
  imageUrl: string;
  initialAnnotations: Annotation[];
}) {
  const router = useRouter();
  const [annotations, setAnnotations] =
    useState<Annotation[]>(initialAnnotations);
  const [selected, setSelected] = useState<Annotation | null>(null);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submittedCount = annotations.filter(
    (a) => a.status === "SUBMITTED"
  ).length;

  function selectAnnotation(a: Annotation) {
    setSelected(a);
    const lastReview = a.reviews[0];
    setComment(lastReview?.comment || "");
    setError("");
  }

  async function handleReview(decision: "APPROVED" | "REJECTED") {
    if (!selected) return;
    if (
      decision === "REJECTED" &&
      !confirm("Reject anotasi ini? Kontributor akan melihat komentar Anda.")
    )
      return;

    setSaving(true);
    setError("");
    try {
      await reviewAnnotation(selected.id, decision, comment);
      setAnnotations(
        annotations.map((a) =>
          a.id === selected.id ? { ...a, status: decision } : a
        )
      );
      setSelected({ ...selected, status: decision });
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleReviewAll(decision: "APPROVED" | "REJECTED") {
    if (submittedCount === 0) return;
    if (
      !confirm(
        `${decision === "APPROVED" ? "Approve" : "Reject"} ${submittedCount} anotasi sekaligus?`
      )
    )
      return;

    setSaving(true);
    setError("");
    try {
      await reviewAllSubmitted(pageId, decision, comment);
      setAnnotations(
        annotations.map((a) =>
          a.status === "SUBMITTED" ? { ...a, status: decision } : a
        )
      );
      setSelected(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas area */}
      <div className="lg:col-span-2">
        <div className="relative bg-sky-50 rounded-xl overflow-hidden border border-sky-100">
          <img
            src={imageUrl}
            alt="Naskah"
            className="w-full block pointer-events-none"
            draggable={false}
          />

          {annotations.map((a) => (
            <div
              key={a.id}
              className={`absolute border-2 cursor-pointer transition-colors ${
                selected?.id === a.id
                  ? "border-blue-700 bg-blue-500/30 z-10"
                  : a.status === "APPROVED"
                    ? "border-green-500 bg-green-500/15"
                    : a.status === "REJECTED"
                      ? "border-red-500 bg-red-500/15"
                      : "border-yellow-500 bg-yellow-500/20"
              }`}
              style={{
                left: `${a.x * 100}%`,
                top: `${a.y * 100}%`,
                width: `${a.w * 100}%`,
                height: `${a.h * 100}%`,
              }}
              onClick={() => selectAnnotation(a)}
            >
              <span className="absolute -top-5 left-0 text-xs bg-blue-900/85 text-white px-1.5 py-0.5 rounded whitespace-nowrap">
                {a.transliteration.slice(0, 25)}
                {a.transliteration.length > 25 ? "..." : ""}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-yellow-500 bg-yellow-500/20 rounded-sm" />
            <span className="text-slate-700">
              Menunggu review ({submittedCount})
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-green-500 bg-green-500/15 rounded-sm" />
            <span className="text-slate-700">Approved</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-red-500 bg-red-500/15 rounded-sm" />
            <span className="text-slate-700">Rejected</span>
          </div>
        </div>
      </div>

      {/* Review panel */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-xl border border-sky-100 p-5 sticky top-20 shadow-sm">
          {!selected ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 bg-teal-500 rounded"></div>
                <h2 className="font-bold text-blue-900">Info Halaman</h2>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                {annotations.length} anotasi total · {submittedCount} menunggu
                review
              </p>
              <p className="text-xs text-slate-500">
                👈 Klik kotak di atas gambar untuk mulai review.
              </p>

              {submittedCount > 0 && (
                <div className="mt-6 pt-6 border-t border-sky-100">
                  <p className="text-sm font-medium text-blue-900 mb-3">
                    Review semua ({submittedCount}) sekaligus:
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Komentar (opsional)"
                    rows={2}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent mb-3"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewAll("APPROVED")}
                      disabled={saving}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      Approve Semua
                    </button>
                    <button
                      onClick={() => handleReviewAll("REJECTED")}
                      disabled={saving}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      Reject Semua
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-blue-900">Review Anotasi</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-xs text-slate-500 hover:text-teal-700 hover:underline"
                >
                  Tutup
                </button>
              </div>

              <div className="mb-3">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    selected.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : selected.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {selected.status}
                </span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Kontributor</p>
                  <p className="font-medium text-blue-900">
                    {selected.contributorName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-500 mb-0.5">
                    Transliterasi Latin
                  </p>
                  <p className="font-medium text-blue-900">
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
                    <p className="text-xs text-slate-500 mb-0.5">
                      Teks Asli
                    </p>
                    <p className="font-mono text-sm text-blue-900">
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

              {selected.status === "SUBMITTED" && (
                <div className="mt-5 pt-5 border-t border-sky-100">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Komentar (opsional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Cth: transliterasi tepat, terjemahan sesuai konteks..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                  />

                  {error && (
                    <p className="text-sm text-red-600 mt-2">{error}</p>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleReview("APPROVED")}
                      disabled={saving}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
                    >
                      {saving ? "..." : "✓ Approve"}
                    </button>
                    <button
                      onClick={() => handleReview("REJECTED")}
                      disabled={saving}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
                    >
                      {saving ? "..." : "✕ Reject"}
                    </button>
                  </div>
                </div>
              )}

              {selected.reviews.length > 0 && (
                <div className="mt-5 pt-5 border-t border-sky-100">
                  <p className="text-xs font-medium text-slate-700 mb-2">
                    Riwayat Review
                  </p>
                  <div className="space-y-2">
                    {selected.reviews.map((r) => (
                      <div
                        key={r.id}
                        className="text-xs bg-sky-50 border border-sky-100 rounded p-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`font-medium ${
                              r.decision === "APPROVED"
                                ? "text-green-700"
                                : "text-red-700"
                            }`}
                          >
                            {r.decision}
                          </span>
                          <span className="text-slate-500">
                            {r.reviewerName}
                          </span>
                        </div>
                        {r.comment && (
                          <p className="text-slate-600">{r.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}