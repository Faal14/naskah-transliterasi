"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

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