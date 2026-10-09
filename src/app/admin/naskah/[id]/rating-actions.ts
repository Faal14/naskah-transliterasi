"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitRating(manuscriptId: string, score: number) {
  const session = await auth();
  if (!session) {
    return { error: "Anda harus login untuk memberi rating" };
  }

  if (score < 1 || score > 5) {
    return { error: "Rating harus antara 1-5" };
  }

  const user = session.user as any;

  try {
    await prisma.rating.upsert({
      where: {
        manuscriptId_userId: {
          manuscriptId,
          userId: user.id,
        },
      },
      update: { score },
      create: {
        manuscriptId,
        userId: user.id,
        score,
      },
    });

    revalidatePath(`/naskah/${manuscriptId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menyimpan rating" };
  }
}

export async function deleteRating(manuscriptId: string) {
  const session = await auth();
  if (!session) {
    return { error: "Anda harus login" };
  }

  const user = session.user as any;

  try {
    await prisma.rating.delete({
      where: {
        manuscriptId_userId: {
          manuscriptId,
          userId: user.id,
        },
      },
    });

    revalidatePath(`/naskah/${manuscriptId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Gagal menghapus rating" };
  }
}