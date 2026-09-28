"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function checkAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const user = session.user as any;
  if (user.role !== "ADMIN" && user.role !== "CONTRIBUTOR") {
    throw new Error("Unauthorized");
  }
  if (user.status !== "APPROVED") throw new Error("Not approved");
  return user;
}

export async function createAnnotation(data: {
  pageId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  transliteration: string;
  translation: string;
  notes: string;
  pegonText?: string;
}) {
  const user = await checkAuth();

  const annotation = await prisma.annotation.create({
    data: {
      pageId: data.pageId,
      contributorId: user.id,
      x: data.x,
      y: data.y,
      w: data.w,
      h: data.h,
      transliteration: data.transliteration,
      translation: data.translation,
      notes: data.notes || null,
      pegonText: data.pegonText || null,
      status: "DRAFT",
    },
  });

  revalidatePath(`/kontributor/naskah`);
  return { success: true, annotation };
}

export async function updateAnnotation(
  id: string,
  data: {
    transliteration: string;
    translation: string;
    notes: string;
    pegonText?: string;
  }
) {
  await checkAuth();

  await prisma.annotation.update({
    where: { id },
    data: {
      transliteration: data.transliteration,
      translation: data.translation,
      notes: data.notes || null,
      pegonText: data.pegonText || null,
    },
  });

  revalidatePath(`/kontributor/naskah`);
  return { success: true };
}

export async function deleteAnnotation(id: string) {
  await checkAuth();

  await prisma.annotation.delete({ where: { id } });

  revalidatePath(`/kontributor/naskah`);
  return { success: true };
}

export async function submitPage(pageId: string) {
  const user = await checkAuth();

  const result = await prisma.annotation.updateMany({
    where: {
      pageId,
      contributorId: user.id,
      status: "DRAFT",
    },
    data: { status: "SUBMITTED" },
  });

  revalidatePath(`/kontributor/naskah`);
  return { success: true, count: result.count };
}