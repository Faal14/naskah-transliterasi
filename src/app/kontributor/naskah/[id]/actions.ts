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
  const user = await checkAuth();

  const existing = await prisma.annotation.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Anotasi tidak ditemukan");

  if (existing.contributorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Anda tidak berhak mengedit anotasi ini");
  }

  const newStatus =
    existing.status === "SUBMITTED" || existing.status === "APPROVED"
      ? "DRAFT"
      : existing.status;

  await prisma.annotation.update({
    where: { id },
    data: {
      transliteration: data.transliteration,
      translation: data.translation,
      notes: data.notes || null,
      pegonText: data.pegonText || null,
      status: newStatus,
    },
  });

  revalidatePath(`/kontributor/naskah`);
  return { success: true, newStatus };
}

export async function deleteAnnotation(id: string) {
  const user = await checkAuth();

  const existing = await prisma.annotation.findUnique({
    where: { id },
  });
  if (!existing) throw new Error("Anotasi tidak ditemukan");

  if (existing.contributorId !== user.id && user.role !== "ADMIN") {
    throw new Error("Anda tidak berhak menghapus anotasi ini");
  }

  if (existing.status === "APPROVED") {
    throw new Error(
      "Anotasi yang sudah disetujui tidak bisa dihapus. Hubungi admin."
    );
  }

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

export async function saveFullText(
  pageId: string,
  fullTransliteration: string,
  fullTranslation: string,
  fullApparatus: string
) {
  await checkAuth();

  await prisma.page.update({
    where: { id: pageId },
    data: {
      fullTransliteration: fullTransliteration || null,
      fullTranslation: fullTranslation || null,
      fullApparatus: fullApparatus || null,
    },
  });

  revalidatePath(`/kontributor/naskah`);
  revalidatePath(`/naskah`);
  return { success: true };
}

// ============ Update Metadata Naskah (termasuk Judul) ============
export async function updateManuscriptMetadata(
  manuscriptId: string,
  data: {
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
  await checkAuth();

  if (!data.title || data.title.trim() === "") {
    throw new Error("Judul naskah wajib diisi");
  }

  if (!data.script || data.script.trim() === "") {
    throw new Error("Aksara wajib diisi");
  }

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      title: data.title.trim(),
      script: data.script.trim(),
      language: data.language.trim() || null,
      author: data.author.trim() || null,
      period: data.period.trim() || null,
      mediaType: data.mediaType.trim() || null,
      dimensions: data.dimensions.trim() || null,
      abstract: data.abstract.trim() || null,
      illumination: data.illumination.trim() || null,
      illustration: data.illustration.trim() || null,
      watermark: data.watermark.trim() || null,
      year: data.year.trim() || null,
      source: data.source.trim() || null,
      description: data.description.trim() || null,
    },
  });

  revalidatePath(`/kontributor/naskah/${manuscriptId}`);
  revalidatePath(`/naskah/${manuscriptId}`);
  revalidatePath("/naskah");
  revalidatePath("/admin/naskah");
  return { success: true };
}