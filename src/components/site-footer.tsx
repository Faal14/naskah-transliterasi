import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="bg-blue-900 text-sky-100 mt-12">
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <p className="text-sky-200">
            <span className="font-bold text-white">LONTAR UIN Salatiga</span>{" "}
            — Pusat Studi Manuskrip &amp; Digital Heritage © 2026
          </p>
          <p className="text-sky-300">
            Dibimbing oleh Peneliti Utama:{" "}
            <span className="text-white font-medium">
              Almer Samantha Hidaya
            </span>{" "}
            (Ilmu Informasi)
          </p>
        </div>
      </div>
    </footer>
  );
}