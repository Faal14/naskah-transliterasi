"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const user = session.user as any;
  if (user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}

async function uploadFromUrl(url: string, path: string) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Gagal fetch ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "image/png";

  const { error } = await supabaseAdmin.storage
    .from("manuscripts")
    .upload(path, buffer, { contentType, upsert: true });

  if (error) throw new Error(`Upload error: ${error.message}`);
  return path;
}

function makePlaceholderUrl(text: string, bg: string, fg: string) {
  const encoded = encodeURIComponent(text);
  return `https://placehold.co/800x1100/${bg}/${fg}/png?text=${encoded}`;
}

export async function seedDemoData() {
  const admin = await checkAdmin();

  // Cari kontributor approved untuk dijadikan author anotasi
  const contributor =
    (await prisma.user.findFirst({
      where: { role: "CONTRIBUTOR", status: "APPROVED" },
    })) || admin;

  // ============================================
  // Naskah 1: PEGON
  // ============================================
  const pegonData = {
    title: "Hikayat Nabi Yusuf",
    script: "PEGON" as const,
    year: "1900",
    source: "Koleksi Pribadi",
    description:
      "Naskah beraksara Pegon berisi kisah Nabi Yusuf, ditulis dalam bahasa Jawa dengan aksara Arab yang dimodifikasi.",
    pages: [
      {
        annotations: [
          {
            x: 0.15,
            y: 0.12,
            w: 0.28,
            h: 0.05,
            transliteration: "Bismillahirrahmanirrahim",
            translation: "Dengan nama Allah Yang Maha Pengasih lagi Maha Penyayang",
            notes: "Pembuka standar naskah Islam-Jawa",
          },
          {
            x: 0.12,
            y: 0.25,
            w: 0.35,
            h: 0.04,
            transliteration: "Wonten satunggal dinten",
            translation: "Pada suatu hari",
            notes: null,
          },
          {
            x: 0.12,
            y: 0.35,
            w: 0.42,
            h: 0.05,
            transliteration: "Kanjeng Nabi Yusuf as",
            translation: "Kanjeng Nabi Yusuf as.",
            notes: "as = alaihissalam",
          },
        ],
      },
      {
        annotations: [
          {
            x: 0.14,
            y: 0.18,
            w: 0.4,
            h: 0.05,
            transliteration: "Miyos saking rama Yakub",
            translation: "Lahir dari ayah Nabi Yakub",
            notes: null,
          },
          {
            x: 0.14,
            y: 0.3,
            w: 0.38,
            h: 0.04,
            transliteration: "Sanget bagus rupanipun",
            translation: "Sangat tampan wajahnya",
            notes: null,
          },
        ],
      },
      {
        annotations: [
          {
            x: 0.16,
            y: 0.2,
            w: 0.32,
            h: 0.05,
            transliteration: "Mimpine sewelas lintang",
            translation: "Mimpinya sebelas bintang",
            notes: "Merujuk pada mimpi Nabi Yusuf",
          },
          {
            x: 0.16,
            y: 0.32,
            w: 0.36,
            h: 0.04,
            transliteration: "Sujud dhateng panjenenganipun",
            translation: "Sujud kepada beliau",
            notes: null,
          },
        ],
      },
    ],
  };

  // ============================================
  // Naskah 2: HANACARAKA
  // ============================================
  const hanacarakaData = {
    title: "Serat Wedhatama",
    script: "HANACARAKA" as const,
    year: "1850",
    source: "Kraton Surakarta",
    description:
      "Serat Wedhatama karya KGPAA Mangkunegara IV, berisi ajaran kebijaksanaan Jawa tentang ilmu sejati dan laku spiritual.",
    pages: [
      {
        annotations: [
          {
            x: 0.18,
            y: 0.15,
            w: 0.3,
            h: 0.05,
            transliteration: "Mangkunegara IV",
            translation: "Mangkunegara IV",
            notes: "Nama pengarang",
          },
          {
            x: 0.14,
            y: 0.28,
            w: 0.35,
            h: 0.04,
            transliteration: "Mingkar mingkuring angkara",
            translation: "Menghindari segala angkara murka",
            notes: "Pupuh Kinanthi bait pertama",
          },
          {
            x: 0.14,
            y: 0.4,
            w: 0.4,
            h: 0.04,
            transliteration: "Akarana karenan mardi siwi",
            translation: "Karena senang mendidik anak",
            notes: null,
          },
        ],
      },
      {
        annotations: [
          {
            x: 0.16,
            y: 0.2,
            w: 0.42,
            h: 0.05,
            transliteration: "Sinawung resmining kidung",
            translation: "Terangkai indah dalam nyanyian",
            notes: null,
          },
          {
            x: 0.16,
            y: 0.32,
            w: 0.36,
            h: 0.04,
            transliteration: "Sinuba sinukarta",
            translation: "Dihias dan diindahkan",
            notes: null,
          },
          {
            x: 0.16,
            y: 0.42,
            w: 0.3,
            h: 0.04,
            transliteration: "Mrih kretarta pakartining",
            translation: "Agar mantap pelaksanaan",
            notes: null,
          },
        ],
      },
      {
        annotations: [
          {
            x: 0.18,
            y: 0.22,
            w: 0.34,
            h: 0.05,
            transliteration: "Ilmu luhung kang kadyeku",
            translation: "Ilmu luhur yang seperti itu",
            notes: null,
          },
          {
            x: 0.18,
            y: 0.35,
            w: 0.38,
            h: 0.04,
            transliteration: "Kawruh ingkang tanpa pepindhan",
            translation: "Pengetahuan yang tanpa bandingan",
            notes: null,
          },
        ],
      },
    ],
  };

  const results: { title: string; id: string }[] = [];

  for (const data of [pegonData, hanacarakaData]) {
    // Buat manuscript
    const manuscript = await prisma.manuscript.create({
      data: {
        title: data.title,
        script: data.script,
        year: data.year,
        source: data.source,
        description: data.description,
      },
    });

    // Upload halaman
    for (let i = 0; i < data.pages.length; i++) {
      const pageNum = i + 1;
      const bg = data.script === "PEGON" ? "F5E6C8" : "FAF0D7";
      const fg = data.script === "PEGON" ? "8B4513" : "6B4423";
      const text = `${data.title}\nHalaman ${pageNum}\n(${data.script})`;
      const imageUrl = makePlaceholderUrl(text, bg, fg);

      const path = `demo/${manuscript.id}/${pageNum}.png`;
      await uploadFromUrl(imageUrl, path);

      const page = await prisma.page.create({
        data: {
          manuscriptId: manuscript.id,
          pageNumber: pageNum,
          imageUrl: path,
          width: 800,
          height: 1100,
          status: "PUBLISHED", // Langsung published untuk demo
        },
      });

      // Buat anotasi + review
      for (const ann of data.pages[i].annotations) {
        const annotation = await prisma.annotation.create({
          data: {
            pageId: page.id,
            contributorId: contributor.id,
            x: ann.x,
            y: ann.y,
            w: ann.w,
            h: ann.h,
            transliteration: ann.transliteration,
            translation: ann.translation,
            notes: ann.notes,
            status: "APPROVED",
          },
        });

        await prisma.review.create({
          data: {
            annotationId: annotation.id,
            reviewerId: admin.id,
            decision: "APPROVED",
            comment: "Transliterasi dan terjemahan sudah sesuai.",
          },
        });
      }
    }

    results.push({ title: manuscript.title, id: manuscript.id });
  }

  revalidatePath("/admin/naskah");
  revalidatePath("/admin/review");
  revalidatePath("/kontributor");
  revalidatePath("/kontributor/anotasi");
  revalidatePath("/");
  revalidatePath("/naskah");

  return { success: true, manuscripts: results };
}

export async function clearDemoData() {
  await checkAdmin();

  // Hapus manuskrip yang judulnya match dengan demo
  const demoManuscripts = await prisma.manuscript.findMany({
    where: {
      title: { in: ["Hikayat Nabi Yusuf", "Serat Wedhatama"] },
    },
    include: { pages: true },
  });

  for (const m of demoManuscripts) {
    const paths = m.pages.map((p) => p.imageUrl).filter((u) => u.startsWith("demo/"));
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("manuscripts").remove(paths);
    }
    await prisma.manuscript.delete({ where: { id: m.id } });
  }

  revalidatePath("/admin/naskah");
  revalidatePath("/");
  return { success: true, count: demoManuscripts.length };
}