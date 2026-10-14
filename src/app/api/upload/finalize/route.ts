import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const MAX_PAGES = 200;

const fileSchema = z.object({
  path: z.string().min(1).max(500),
  w: z.number().int().min(0).max(100_000).optional().default(1000),
  h: z.number().int().min(0).max(100_000).optional().default(1400),
});

const finalizeSchema = z.object({
  manuscriptId: z.string().min(1).max(100),
  files: z.array(fileSchema).min(1).max(MAX_PAGES),
});

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = finalizeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { manuscriptId, files } = parsed.data;

    // Cek manuscript ada
    const manuscript = await prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      select: { id: true },
    });
    if (!manuscript) {
      return NextResponse.json(
        { error: "Naskah tidak ditemukan" },
        { status: 404 }
      );
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      await prisma.page.create({
        data: {
          manuscriptId,
          pageNumber: i + 1,
          imageUrl: f.path,
          width: f.w,
          height: f.h,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}