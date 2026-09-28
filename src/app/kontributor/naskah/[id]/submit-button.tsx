"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitPage } from "./actions";

export default function SubmitButton({
  pageId,
  annotationCount,
}: {
  pageId: string;
  annotationCount: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (annotationCount === 0) return;
    if (
      !confirm(
        `Submit ${annotationCount} anotasi di halaman ini untuk diverifikasi admin?`
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const res = await submitPage(pageId);
      alert(`${res.count} anotasi berhasil disubmit untuk direview.`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Gagal submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSubmit}
      disabled={loading || annotationCount === 0}
      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? "Mengirim..." : `Submit untuk Review (${annotationCount})`}
    </button>
  );
}