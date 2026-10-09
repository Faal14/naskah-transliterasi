"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitComment } from "@/app/naskah/comment-actions";

type Comment = {
  id: string;
  userName: string;
  content: string;
  createdAt: string;
  isGuest: boolean;
};

export default function CommentSection({
  manuscriptId,
  initialComments,
  currentUser,
}: {
  manuscriptId: string;
  initialComments: Comment[];
  currentUser: { name: string; email: string } | null;
}) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setMessage("");
    setError("");

    const result = await submitComment({
      manuscriptId,
      content,
      guestName: currentUser ? undefined : guestName,
      guestEmail: currentUser ? undefined : guestEmail,
    });

    setSending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setContent("");
    setGuestName("");
    setGuestEmail("");
    setMessage(result.message || "Komentar terkirim!");
    router.refresh();

    setTimeout(() => setMessage(""), 5000);
  }

  const charCount = content.length;
  const maxChar = 1000;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-5 bg-teal-500 rounded"></div>
        <h2 className="text-lg font-bold text-blue-900">
          💬 Diskusi ({comments.length})
        </h2>
      </div>

      <div className="bg-white border border-sky-100 rounded-xl p-5 shadow-sm mb-6">
        <p className="text-sm font-medium text-slate-700 mb-3">
          {currentUser
            ? `Berkomentar sebagai ${currentUser.name}`
            : "Tinggalkan komentar (tanpa login)"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!currentUser && (
            <div className="grid md:grid-cols-2 gap-3">
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
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Email{" "}
                  <span className="text-slate-400 font-normal">
                    (opsional)
                  </span>
                </label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="email@contoh.com"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Komentar <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              minLength={5}
              maxLength={maxChar}
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis komentar, pertanyaan, atau catatan tentang naskah ini..."
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-[10px] text-slate-400">
                Komentar akan tampil setelah diverifikasi admin
              </p>
              <p
                className={`text-[10px] font-medium ${
                  charCount > maxChar * 0.9
                    ? "text-amber-600"
                    : "text-slate-400"
                }`}
              >
                {charCount}/{maxChar}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-xs text-green-700">
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || content.trim().length < 5}
            className="bg-gradient-to-r from-teal-600 to-teal-700 text-white px-5 py-2 rounded-lg text-sm font-medium hover:from-teal-700 hover:to-teal-800 disabled:opacity-50 shadow-md transition"
          >
            {sending ? "Mengirim..." : "💬 Kirim Komentar"}
          </button>
        </form>
      </div>

      {comments.length === 0 ? (
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-8 text-center">
          <p className="text-3xl mb-2">💭</p>
          <p className="text-sm text-slate-500">
            Belum ada komentar. Jadilah yang pertama berdiskusi!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-sky-100 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-800 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {c.userName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-sm text-slate-900">
                      {c.userName}
                    </p>
                    {c.isGuest && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wide font-medium">
                        Tamu
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">
                      {new Date(c.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}