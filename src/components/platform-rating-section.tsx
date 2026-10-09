"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Review = {
  id: string;
  displayName: string;
  content: string;
  createdAt: string;
};

export default function PlatformRatingSection({
  currentUser,
}: {
  currentUser: { name: string } | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [averageScore, setAverageScore] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [guestId, setGuestId] = useState<string>("");

  const [guestName, setGuestName] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [formRating, setFormRating] = useState(0);
  const [formHovered, setFormHovered] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let id = localStorage.getItem("lontar_guest_id");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem("lontar_guest_id", id);
    }
    setGuestId(id);

    fetch("/api/platform-feedback?limit=5")
      .then((r) => r.json())
      .then((data) => {
        setAverageScore(data.averageScore || 0);
        setTotalRatings(data.totalRatings || 0);
        setReviews(data.reviews || []);

        const saved = localStorage.getItem("lontar_platform_rating");
        const initial = data.userRating || (saved ? parseInt(saved) : null);
        if (initial) {
          setUserScore(initial);
          setFormRating(initial);
        }
      });
  }, []);

  async function refreshStats() {
    const data = await fetch("/api/platform-feedback?limit=5").then((r) =>
      r.json()
    );
    setAverageScore(data.averageScore || 0);
    setTotalRatings(data.totalRatings || 0);
    setReviews(data.reviews || []);
  }

  async function handleQuickRating(score: number) {
    if (userScore === score) return;

    setUserScore(score);
    setFormRating(score);
    localStorage.setItem("lontar_platform_rating", score.toString());

    const res = await fetch("/api/platform-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, guestId, action: "rate" }),
    });

    if (res.ok) {
      await refreshStats();
      setMessage("✅ Terima kasih atas rating Anda!");
      setTimeout(() => setMessage(""), 3000);
    }
  }

  async function handleReviewSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    if (formRating === 0) {
      setError("Silakan beri rating bintang dulu");
      setSending(false);
      return;
    }

    const res = await fetch("/api/platform-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        score: formRating,
        reviewContent,
        guestName: currentUser ? undefined : guestName,
        guestId,
        action: "both",
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error || "Gagal mengirim");
      return;
    }

    setUserScore(formRating);
    localStorage.setItem("lontar_platform_rating", formRating.toString());
    setReviewContent("");
    setGuestName("");
    setMessage("✅ Rating & ulasan terkirim. Terima kasih!");
    await refreshStats();
    setTimeout(() => setMessage(""), 4000);
  }

  const displayScore = hovered !== null ? hovered : userScore ?? 0;
  const isHovering = hovered !== null;

  const formDisplayScore =
    formHovered !== null ? formHovered : formRating;

  const isFormValid =
    reviewContent.trim().length >= 5 &&
    formRating > 0 &&
    (currentUser || guestName.trim().length >= 2);

  return (
    <section className="bg-white border-y border-sky-100 py-16">
      <div className="max-w-4xl mx-auto px-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-1 h-6 bg-teal-500 rounded"></div>
            <h2 className="text-2xl md:text-3xl font-bold text-blue-900">
              Bagaimana Pengalaman Anda?
            </h2>
          </div>
          <p className="text-slate-600">
            Bantu kami meningkatkan platform LONTAR dengan rating dan ulasan
            Anda
          </p>
        </div>

        {/* ============ RATING SUMMARY ============ */}
        <div className="bg-gradient-to-br from-blue-900 to-teal-700 rounded-2xl p-6 md:p-8 text-white shadow-lg mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="text-center md:text-left shrink-0">
              <p className="text-5xl md:text-6xl font-bold">
                {totalRatings > 0 ? averageScore.toFixed(1) : "—"}
              </p>
              <div className="flex gap-1 mt-2 justify-center md:justify-start">
                {[1, 2, 3, 4, 5].map((n) => (
                  <span
                    key={n}
                    className={`text-xl ${
                      n <= Math.round(averageScore)
                        ? "text-amber-400"
                        : "text-white/30"
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
              <p className="text-xs text-sky-200 mt-1">
                {totalRatings > 0
                  ? `Dari ${totalRatings} penilaian`
                  : "Belum ada penilaian"}
              </p>
            </div>

            <div className="hidden md:block w-px h-24 bg-white/20"></div>

            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-sky-100 mb-3">
                {isHovering
                  ? `Beri ${hovered} bintang`
                  : userScore
                    ? `Rating Anda: ${userScore} bintang`
                    : "Klik bintang untuk beri rating cepat"}
              </p>

              <div
                className="flex gap-2 justify-center md:justify-start"
                onMouseLeave={() => setHovered(null)}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const isFilled = n <= displayScore;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => handleQuickRating(n)}
                      onMouseEnter={() => setHovered(n)}
                      onFocus={() => setHovered(n)}
                      onBlur={() => setHovered(null)}
                      aria-label={`Beri ${n} bintang`}
                      className={`text-4xl leading-none transition-all duration-150 cursor-pointer select-none ${
                        isFilled
                          ? "text-amber-400 scale-110 drop-shadow-md"
                          : "text-white/40 hover:text-amber-300 hover:scale-110"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
              </div>

              {message && (
                <p className="text-xs text-sky-100 mt-2">{message}</p>
              )}
            </div>
          </div>
        </div>

        {/* ============ REVIEWS LIST ============ */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-blue-900">💬 Ulasan Terbaru</h3>
            {reviews.length > 0 && (
              <Link
                href="/ulasan"
                className="text-sm text-teal-700 hover:underline font-medium"
              >
                Lihat Semua →
              </Link>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="bg-sky-50 border border-sky-100 rounded-xl p-8 text-center text-sm text-slate-500">
              Belum ada ulasan. Jadilah yang pertama!
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-sky-100 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-800 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {r.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <p className="font-semibold text-sm text-slate-900">
                          {r.displayName}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {new Date(r.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 whitespace-pre-wrap">
                        {r.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============ FORM ULASAN + BINTANG ============ */}
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-6">
          <h3 className="font-bold text-blue-900 mb-4">
            ✍️ Tulis Ulasan &amp; Beri Rating
          </h3>

          <form onSubmit={handleReviewSubmit} className="space-y-5">
            {!currentUser && (
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Nama <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  minLength={2}
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Nama Anda"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Rating Anda <span className="text-red-500">*</span>
              </label>
              <div
                className="flex items-center gap-2"
                onMouseLeave={() => setFormHovered(null)}
              >
                {[1, 2, 3, 4, 5].map((n) => {
                  const isFilled = n <= formDisplayScore;
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setFormRating(n)}
                      onMouseEnter={() => setFormHovered(n)}
                      onFocus={() => setFormHovered(n)}
                      onBlur={() => setFormHovered(null)}
                      aria-label={`Beri ${n} bintang`}
                      className={`text-4xl leading-none transition-all duration-150 cursor-pointer select-none ${
                        isFilled
                          ? "text-amber-400 scale-110 drop-shadow-md"
                          : "text-slate-200 hover:text-amber-300 hover:scale-110"
                      }`}
                    >
                      ★
                    </button>
                  );
                })}
                <span className="text-sm text-slate-600 ml-3 font-medium">
                  {formRating > 0
                    ? `${formRating} bintang`
                    : formHovered
                      ? `${formHovered} bintang`
                      : "Pilih bintang"}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Ulasan <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                minLength={5}
                maxLength={500}
                rows={3}
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="Ceritakan pengalaman Anda menggunakan platform LONTAR..."
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                {reviewContent.length}/500 karakter
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700">
                {message}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={sending || !isFormValid}
                className={`w-full md:w-auto px-8 py-3 rounded-lg text-base font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                  sending || !isFormValid
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:from-teal-700 hover:to-teal-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                }`}
              >
                {sending ? (
                  <>⏳ Mengirim...</>
                ) : (
                  <>⭐ Kirim Rating &amp; Ulasan</>
                )}
              </button>

              {!isFormValid && !sending && (
                <p className="text-xs text-slate-500 mt-2">
                  {formRating === 0 &&
                    "• Pilih bintang rating dulu"}
                  {formRating > 0 &&
                    reviewContent.trim().length < 5 &&
                    "• Ulasan minimal 5 karakter"}
                  {formRating > 0 &&
                    reviewContent.trim().length >= 5 &&
                    !currentUser &&
                    guestName.trim().length < 2 &&
                    "• Isi nama Anda dulu"}
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}