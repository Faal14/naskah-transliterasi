"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approveComment, rejectComment, deleteComment } from "./actions";

type Comment = {
  id: string;
  userName: string;
  isGuest: boolean;
  guestEmail: string | null;
  content: string;
  status: string;
  createdAt: string;
  manuscriptId: string;
  manuscriptTitle: string | null;
};

export default function CommentRow({ comment }: { comment: Comment }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handle(action: "approve" | "reject" | "delete") {
    if (action === "delete") {
      if (!confirm("Hapus komentar ini permanen?")) return;
    }

    setLoading(true);
    setMsg("");

    try {
      if (action === "approve") {
        await approveComment(comment.id);
        setMsg("✅ Approved");
      } else if (action === "reject") {
        await rejectComment(comment.id);
        setMsg("❌ Rejected");
      } else {
        await deleteComment(comment.id);
        setMsg("🗑 Dihapus");
      }
      router.refresh();
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "error";
      setMsg("Gagal: " + errorMsg);
    } finally {
      setLoading(false);
    }
  }

  const statusColor =
    comment.status === "APPROVED"
      ? "bg-green-100 text-green-700"
      : comment.status === "REJECTED"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700";

  return (
    <div className="bg-white rounded-xl border border-sky-100 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-800 to-teal-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {comment.userName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-sm text-slate-900">
              {comment.userName}
            </p>
            {comment.isGuest && (
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wide font-medium">
                Tamu
              </span>
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}
            >
              {comment.status}
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(comment.createdAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {comment.guestEmail && (
            <p className="text-xs text-slate-500 mb-1">
              📧 {comment.guestEmail}
            </p>
          )}
          <p className="text-xs text-slate-500 mb-2">
            📖 Naskah:{" "}
            <span className="font-medium text-blue-900">
              {comment.manuscriptTitle || "Tanpa judul"}
            </span>
          </p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap break-words bg-sky-50 rounded-lg p-3 leading-relaxed">
            {comment.content}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-sky-100 flex-wrap">
        {comment.status !== "APPROVED" && (
          <button
            onClick={() => handle("approve")}
            disabled={loading}
            className="bg-green-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition"
          >
            ✓ Approve
          </button>
        )}
        {comment.status !== "REJECTED" && (
          <button
            onClick={() => handle("reject")}
            disabled={loading}
            className="bg-amber-600 text-white px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition"
          >
            ✕ Reject
          </button>
        )}
        <button
          onClick={() => handle("delete")}
          disabled={loading}
          className="ml-auto text-red-600 hover:bg-red-50 px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50 transition"
        >
          🗑 Hapus
        </button>
        {msg && (
          <span className="text-xs text-slate-700 font-medium ml-2">
            {msg}
          </span>
        )}
      </div>
    </div>
  );
}