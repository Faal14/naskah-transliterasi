"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function submitComment(data: {
  manuscriptId: string;
  content: string;
  guestName?: string;
  guestEmail?: string;
}) {
  if (!data.content || data.content.trim().length < 5) {
    return { error: "Komentar minimal 5 karakter" };
  }

  if (data.content.length > 1000) {
    return { error: "Komentar maksimal 1000 karakter" };
  }

  const session = await auth();
  const user = session?.user as any;

  try {
    if (user) {
      await prisma.comment.create({
        data: {
          manuscriptId: data.manuscriptId,
          userId: user.id,
          content: data.content.trim(),
          status: "PENDING",
        },
      });
    } else {
      if (!data.guestName || data.guestName.trim().length < 2) {
        return { error: "Nama minimal 2 karakter" };
      }

      await prisma.comment.create({
        data: {
          manuscriptId: data.manuscriptId,
          guestName: data.guestName.trim(),
          guestEmail: data.guestEmail?.trim() || null,
          content: data.content.trim(),
          status: "PENDING",
        },
      });
    }

    revalidatePath(`/naskah/${data.manuscriptId}`);
    return {
      success: true,
      message:
        "Komentar terkirim. Akan tampil setelah diverifikasi admin.",
    };
  } catch (err: any) {
    return { error: err.message || "Gagal mengirim komentar" };
  }
}