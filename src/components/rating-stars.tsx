"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitRating, deleteRating } from "@/app/naskah/rating-actions";

export default function RatingStars({
  manuscriptId,
  initialUserScore,
  averageScore,
  totalRatings,
  isLoggedIn,
}: {
  manuscriptId: string;
  initialUserScore: number | null;
  averageScore: number;
  totalRatings: number;
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [userScore, setUserScore] = useState<number | null>(initialUserScore);
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleClick(score: number) {
    if (!isLoggedIn) {
      setMessage("Login dulu untuk memberi rating");
      setTimeout(() => setMessage(""), 3000);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (userScore === score) {
        await deleteRating(manuscriptId);
        setUserScore(null);
        setMessage("Rating dihapus");
      } else {
        await submitRating(manuscriptId, score);
        setUserScore(score);
        setMessage(`Terima kasih! Rating ${score} bintang tersimpan.`);
      }
      router.refresh();
      setTimeout(() => setMessage(""), 3000);
    } catch (err: any) {
      setMessage(err.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  const displayScore = hovered ?? userScore ?? 0;

  return (
    <div className="bg-white border border-sky-100 rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-5 bg-teal-500 rounded"></div>
            <h3 className="font-bold text-blue-900">Rating Naskah</h3>
          </div>
          <p className="text-xs text-slate-500 ml-3">
            {totalRatings > 0
              ? `Dari ${totalRatings} penilaian`
              : "Belum ada penilaian"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-3xl font-bold text-blue-900">
            {totalRatings > 0 ? averageScore.toFixed(1) : "—"}
          </p>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`text-sm ${
                  n <= Math.round(averageScore)
                    ? "text-amber-400"
                    : "text-slate-300"
                }`}
              >
                ★
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-sky-100">
        <p className="text-xs text-slate-600 mb-2">
          {userScore ? (
            <>
              Rating Anda: <strong>{userScore} bintang</strong>{" "}
              <span className="text-slate-400">
                (klik bintang yang sama untuk hapus)
              </span>
            </>
          ) : (
            "Klik bintang untuk memberi rating:"
          )}
        </p>
        <div className="flex gap-1" onMouseLeave={() => setHovered(null)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              disabled={saving}
              onClick={() => handleClick(n)}
              onMouseEnter={() => setHovered(n)}
              className={`text-3xl transition ${
                n <= displayScore
                  ? "text-amber-400 scale-110"
                  : "text-slate-300 hover:text-amber-300"
              } disabled:opacity-50`}
            >
              ★
            </button>
          ))}
        </div>

        {!isLoggedIn && (
          <p className="text-xs text-amber-600 mt-2">
            🔒 Login untuk memberi rating
          </p>
        )}

        {message && (
          <p className="text-xs text-teal-700 mt-2 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}