"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

const LOCK_TIMEOUT_HOURS = 24;

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

// Auto-unlock naskah yang sudah lewat 24 jam
async function autoUnlockStale() {
  const cutoff = new Date(Date.now() - LOCK_TIMEOUT_HOURS * 60 * 60 * 1000);
  await prisma.manuscript.updateMany({
    where: {
      lockedById: { not: null },
      lockedAt: { lt: cutoff },
    },
    data: {
      lockedById: null,
      lockedAt: null,
    },
  });
}

export async function lockManuscript(manuscriptId: string) {
  const user = await checkAuth();
  await autoUnlockStale();

  const manuscript = await prisma.manuscript.findUnique({
    where: { id: manuscriptId },
  });

  if (!manuscript) throw new Error("Naskah tidak ditemukan");

  // Kalau sudah dikunci orang lain (dan bukan dirinya sendiri)
  if (manuscript.lockedById && manuscript.lockedById !== user.id) {
    throw new Error("Naskah sedang dikerjakan kontributor lain");
  }

  // Kalau sudah dikunci oleh diri sendiri, tidak perlu apa-apa
  if (manuscript.lockedById === user.id) {
    return { success: true };
  }

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      lockedById: user.id,
      lockedAt: new Date(),
    },
  });

  revalidatePath("/kontributor");
  revalidatePath(`/kontributor/naskah/${manuscriptId}`);
  return { success: true };
}

export async function unlockManuscript(manuscriptId: string) {
  const user = await checkAuth();

  const manuscript = await prisma.manuscript.findUnique({
    where: { id: manuscriptId },
  });

  if (!manuscript) throw new Error("Naskah tidak ditemukan");

  // Hanya owner atau admin yang bisa unlock
  if (manuscript.lockedById !== user.id && user.role !== "ADMIN") {
    throw new Error("Anda tidak berhak melepas naskah ini");
  }

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      lockedById: null,
      lockedAt: null,
    },
  });

  revalidatePath("/kontributor");
  revalidatePath(`/kontributor/naskah/${manuscriptId}`);
  return { success: true };
}

export async function forceUnlockManuscript(manuscriptId: string) {
  const user = await checkAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Hanya admin yang bisa force unlock");
  }

  await prisma.manuscript.update({
    where: { id: manuscriptId },
    data: {
      lockedById: null,
      lockedAt: null,
    },
  });

  revalidatePath("/kontributor");
  revalidatePath("/admin/naskah");
  revalidatePath(`/kontributor/naskah/${manuscriptId}`);
  return { success: true };
}