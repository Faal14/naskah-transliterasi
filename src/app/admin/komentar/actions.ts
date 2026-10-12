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

export async function approveComment(id: string) {
  await checkAdmin();

  await prisma.comment.update({
    where: { id },
    data: { status: "APPROVED" },
  });

  revalidatePath("/admin/komentar");
  revalidatePath("/naskah");
  return { success: true };
}

export async function rejectComment(id: string) {
  await checkAdmin();

  await prisma.comment.update({
    where: { id },
    data: { status: "REJECTED" },
  });

  revalidatePath("/admin/komentar");
  revalidatePath("/naskah");
  return { success: true };
}

export async function deleteComment(id: string) {
  await checkAdmin();

  await prisma.comment.delete({
    where: { id },
  });

  revalidatePath("/admin/komentar");
  revalidatePath("/naskah");
  return { success: true };
}