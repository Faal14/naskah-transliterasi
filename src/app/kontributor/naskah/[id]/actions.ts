"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function checkAuth() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const user = session.user as
    | { id?: string; role?: string; status?: string }
    | undefined;
  if (!user || (user.role !== "ADMIN" && user.role !== "CONTRIBUTOR")) {
    throw new Error("Unauthorized");
  }
  if (user.status !== "APPROVED") throw new Error("Not approved");
  return user as { id: string; role: string; status: string };
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

// ============ Update Metadata Naskah ============

const metadataSchema = z.object({
  title: z.string().trim().max(500).nullable().optional(),
  script: z.string().trim().max(100).nullable().optional(),
  language: z.string().trim().max(100).nullable().optional(),
  author: z.string().trim().max(200).nullable().optional(),
  period: z.string().trim().max(200).nullable().optional(),
  mediaType: z.string().trim().max(200).nullable().optional(),
  dimensions: z.string().trim().max(200).nullable().optional(),
  abstract: z.string().trim().max(5000).nullable().optional(),
  illumination: z.string().trim().max(200).nullable().optional(),
  illustration: z.string().trim().max(500).nullable().optional(),
  watermark: z.string().trim().max(500).nullable().optional(),
  year: z.string().trim().max(50).nullable().optional(),
  source: z.string().trim().max(500).nullable().optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});

function trimmedOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export async function updateManuscriptMetadata(
  manuscriptId: string,
  data: z.infer<typeof metadataSchema>
) {
  await checkAuth();

  const parsed = metadataSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Data tidak valid");
  }

  const d = parsed.data;

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      title: trimmedOrNull(d.title),
      script: trimmedOrNull(d.script),
      language: trimmedOrNull(d.language),
      author: trimmedOrNull(d.author),
      period: trimmedOrNull(d.period),
      mediaType: trimmedOrNull(d.mediaType),
      dimensions: trimmedOrNull(d.dimensions),
      abstract: trimmedOrNull(d.abstract),
      illumination: trimmedOrNull(d.illumination),
      illustration: trimmedOrNull(d.illustration),
      watermark: trimmedOrNull(d.watermark),
      year: trimmedOrNull(d.year),
      source: trimmedOrNull(d.source),
      description: trimmedOrNull(d.description),
    },
  });

  revalidatePath(`/kontributor/naskah/${manuscriptId}`);
  revalidatePath(`/naskah/${manuscriptId}`);
  revalidatePath("/naskah");
  revalidatePath("/admin/naskah");
  return { success: true };
}