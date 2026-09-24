"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createManuscript(formData: FormData) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const title = formData.get("title") as string;
  const script = formData.get("script") as "PEGON" | "HANACARAKA";
  const year = formData.get("year") as string;
  const source = formData.get("source") as string;
  const description = formData.get("description") as string;
  const files = formData.getAll("pages") as File[];
  const dimensionsJson = formData.get("dimensions") as string;
  const dimensions = JSON.parse(dimensionsJson) as { w: number; h: number }[];

  if (!title || !script) {
    return { error: "Judul dan aksara wajib diisi" };
  }
  if (files.length === 0) {
    return { error: "Minimal upload 1 gambar halaman" };
  }

  const manuscript = await prisma.manuscript.create({
    data: {
      title,
      script,
      year: year || null,
      source: source || null,
      description: description || null,
    },
  });

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const dim = dimensions[i] || { w: 1000, h: 1400 };
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${manuscript.id}/${i + 1}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from("manuscripts")
      .upload(path, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return { error: `Gagal upload gambar ${i + 1}: ${uploadError.message}` };
    }

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

  revalidatePath("/admin/naskah");
  redirect(`/admin/naskah/${manuscript.id}`);
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