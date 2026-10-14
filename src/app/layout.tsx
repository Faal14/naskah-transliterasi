import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title:
    "LONTAR — Literasi Online, Naskah Transliterasi, dan Alih-bahasa untuk Riset",
  description:
    "Platform open-source untuk transliterasi dan terjemahan naskah kuno beraksara Pegon dan Hanacaraka.",
};

const authBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/auth`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${inter.className} bg-sky-50 min-h-screen`}>
        <SessionProvider basePath={authBasePath}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}