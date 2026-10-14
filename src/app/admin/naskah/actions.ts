"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const MAX_PAGES = 200;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
// ekstensi diturunkan dari MIME, bukan dari nama file
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const imgDimsSchema = z
  .array(
    z.object({
      w: z.number().int().min(0).max(100_000),
      h: z.number().int().min(0).max(100_000),
    })
  )
  .max(MAX_PAGES);

function parseImgDims(json: FormDataEntryValue | null) {
  if (typeof json !== "string") return null;
  try {
    const parsed = imgDimsSchema.safeParse(JSON.parse(json));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export async function createManuscript(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const code = formData.get("code") as string;
  const title = formData.get("title") as string;
  const script = formData.get("script") as string;
  const language = formData.get("language") as string;
  const author = formData.get("author") as string;
  const period = formData.get("period") as string;
  const mediaType = formData.get("mediaType") as string;
  const dimensions = formData.get("dimensions") as string;
  const abstract = formData.get("abstract") as string;
  const illumination = formData.get("illumination") as string;
  const illustration = formData.get("illustration") as string;
  const watermark = formData.get("watermark") as string;
  const year = formData.get("year") as string;
  const source = formData.get("source") as string;
  const description = formData.get("description") as string;
  const files = formData
    .getAll("pages")
    .filter((f): f is File => f instanceof File && f.size > 0);
  const imgDims = parseImgDims(formData.get("dimensions_imgs"));

  if (!title || !script) {
    return { error: "Judul dan aksara wajib diisi" };
  }
  if (files.length === 0) {
    return { error: "Minimal upload 1 gambar halaman" };
  }
  if (files.length > MAX_PAGES) {
    return { error: `Maksimal ${MAX_PAGES} halaman per naskah` };
  }
  if (!imgDims) {
    return { error: "Data dimensi gambar tidak valid" };
  }
  for (let i = 0; i < files.length; i++) {
    if (!IMAGE_EXTENSIONS[files[i].type]) {
      return { error: `Gambar ${i + 1}: hanya JPEG, PNG, atau WebP` };
    }
    if (files[i].size > MAX_FILE_BYTES) {
      return { error: `Gambar ${i + 1}: ukuran maksimal 15 MB` };
    }
  }

  const manuscript = await prisma.manuscript.create({
    data: {
      code: code || null,
      title,
      script,
      language: language || null,
      author: author || null,
      period: period || null,
      mediaType: mediaType || null,
      dimensions: dimensions || null,
      abstract: abstract || null,
      illumination: illumination || null,
      illustration: illustration || null,
      watermark: watermark || null,
      year: year || null,
      source: source || null,
      description: description || null,
    },
  });

  const uploaded: string[] = [];
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const dim = imgDims[i] || { w: 1000, h: 1400 };
      const path = `${manuscript.id}/${i + 1}.${IMAGE_EXTENSIONS[file.type]}`;

      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabaseAdmin.storage
        .from("manuscripts")
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload gambar ${i + 1}: ${uploadError.message}`);
      }
      uploaded.push(path);

      await prisma.page.create({
        data: {
          manuscriptId: manuscript.id,
          pageNumber: i + 1,
          imageUrl: path,
          width: dim.w || 1000,
          height: dim.h || 1400,
        },
      });
    }
  } catch (err) {
    console.error("createManuscript:", err);
    // Jangan tinggalkan naskah setengah jadi: hapus file yang sudah terunggah dan
    // naskahnya (halaman ikut terhapus lewat onDelete: Cascade).
    try {
      if (uploaded.length > 0) {
        await supabaseAdmin.storage.from("manuscripts").remove(uploaded);
      }
      await prisma.manuscript.delete({ where: { id: manuscript.id } });
    } catch (cleanupErr) {
      console.error("createManuscript cleanup:", cleanupErr);
    }
    return { error: "Gagal mengunggah naskah. Tidak ada data yang disimpan." };
  }

  revalidatePath("/admin/naskah");
  redirect(`/admin/naskah/${manuscript.id}`);
}

export async function updateManuscriptMetadata(
  id: string,
  data: {
    code: string;
    title: string;
    script: string;
    language: string;
    author: string;
    period: string;
    mediaType: string;
    dimensions: string;
    abstract: string;
    illumination: string;
    illustration: string;
    watermark: string;
    year: string;
    source: string;
    description: string;
  }
) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  await prisma.manuscript.update({
    where: { id },
    data: {
      code: data.code || null,
      title: data.title,
      script: data.script,
      language: data.language || null,
      author: data.author || null,
      period: data.period || null,
      mediaType: data.mediaType || null,
      dimensions: data.dimensions || null,
      abstract: data.abstract || null,
      illumination: data.illumination || null,
      illustration: data.illustration || null,
      watermark: data.watermark || null,
      year: data.year || null,
      source: data.source || null,
      description: data.description || null,
    },
  });

  revalidatePath(`/admin/naskah/${id}`);
  revalidatePath("/admin/naskah");
  return { success: true };
}

export async function deleteManuscript(id: string) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const pages = await prisma.page.findMany({ where: { manuscriptId: id } });
  const paths = pages.map((p) => p.imageUrl);

  if (paths.length > 0) {
    await supabaseAdmin.storage.from("manuscripts").remove(paths);
  }

  await prisma.manuscript.delete({ where: { id } });
  revalidatePath("/admin/naskah");
  redirect("/admin/naskah");
}