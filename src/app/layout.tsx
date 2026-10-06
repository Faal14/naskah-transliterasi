import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LONTAR — Literasi Online, Naskah Transliterasi, dan Alih-bahasa untuk Riset",
  description:
    "Platform open-source untuk transliterasi dan terjemahan naskah kuno beraksara Pegon dan Hanacaraka.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-sky-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}