"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { lockManuscript, unlockManuscript } from "./actions";

export default function LockButton({
  manuscriptId,
  action,
  label,
  variant,
}: {
  manuscriptId: string;
  action: "lock" | "unlock";
  label: string;
  variant: "primary" | "secondary";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");

    try {
      if (action === "lock") {
        await lockManuscript(manuscriptId);
        router.push(`/kontributor/naskah/${manuscriptId}`);
      } else {
        await unlockManuscript(manuscriptId);
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "Gagal");
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  }

  const baseClass =
    "py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-sm";

  const variantClass =
    variant === "primary"
      ? "w-full bg-gradient-to-r from-blue-800 to-blue-900 text-white hover:from-blue-900 hover:to-blue-950"
      : "px-4 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50";

  return (
    <div className={variant === "primary" ? "" : "flex-none"}>
      <button
        onClick={handleClick}
        disabled={loading}
        className={`${baseClass} ${variantClass}`}
      >
        {loading ? "..." : label}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}