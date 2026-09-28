"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");
  const user = session.user as any;
  if (user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}

export async function reviewAnnotation(
  annotationId: string,
  decision: "APPROVED" | "REJECTED",
  comment: string
) {
  const admin = await checkAdmin();

  const annotation = await prisma.annotation.findUnique({
    where: { id: annotationId },
    include: { page: true },
  });

  if (!annotation) throw new Error("Annotation not found");

  // Update annotation status
  await prisma.annotation.update({
    where: { id: annotationId },
    data: { status: decision },
  });

  // Record review
  await prisma.review.create({
    data: {
      annotationId,
      reviewerId: admin.id,
      decision,
      comment: comment || null,
    },
  });

  // Auto-publish: kalau semua anotasi di halaman ini sudah APPROVED
  const pageAnnotations = await prisma.annotation.findMany({
    where: { pageId: annotation.pageId },
  });

  const allApproved =
    pageAnnotations.length > 0 &&
    pageAnnotations.every((a) => a.status === "APPROVED");

  if (allApproved) {
    await prisma.page.update({
      where: { id: annotation.pageId },
      data: { status: "PUBLISHED" },
    });
  } else {
    // set status ke REVIEW kalau masih ada yang pending
    const hasSubmitted = pageAnnotations.some(
      (a) => a.status === "SUBMITTED"
    );
    if (hasSubmitted) {
      await prisma.page.update({
        where: { id: annotation.pageId },
        data: { status: "REVIEW" },
      });
    }
  }

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${annotation.page.manuscriptId}`);
  revalidatePath(`/admin/review/${annotation.page.manuscriptId}`);
  return { success: true };
}

export async function reviewAllSubmitted(
  pageId: string,
  decision: "APPROVED" | "REJECTED",
  comment: string
) {
  const admin = await checkAdmin();

  const annotations = await prisma.annotation.findMany({
    where: { pageId, status: "SUBMITTED" },
  });

  for (const a of annotations) {
    await prisma.annotation.update({
      where: { id: a.id },
      data: { status: decision },
    });
    await prisma.review.create({
      data: {
        annotationId: a.id,
        reviewerId: admin.id,
        decision,
        comment: comment || null,
      },
    });
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");

  // Update page status
  const allAnnotations = await prisma.annotation.findMany({
    where: { pageId },
  });

  const allApproved =
    allAnnotations.length > 0 &&
    allAnnotations.every((a) => a.status === "APPROVED");

  if (allApproved) {
    await prisma.page.update({
      where: { id: pageId },
      data: { status: "PUBLISHED" },
    });
  }

  revalidatePath("/admin/review");
  revalidatePath(`/admin/review/${page.manuscriptId}`);
  return { success: true, count: annotations.length };
}