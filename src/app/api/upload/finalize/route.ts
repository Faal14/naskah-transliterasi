import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/require-admin";

const MAX_PAGES = 200;
const MAX_FILE_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

const fileSchema = z.object({
  path: z.string().min(1).max(500),
  w: z.number().int().min(0).max(100_000).optional().default(1000),
  h: z.number().int().min(0).max(100_000).optional().default(1400),
});

const finalizeSchema = z.object({
  manuscriptId: z.string().min(1).max(100),
  files: z.array(fileSchema).min(1).max(MAX_PAGES),
});

async function cleanupFiles(paths: string[]) {
  try {
    if (paths.length > 0) {
      await supabaseAdmin.storage.from("manuscripts").remove(paths);
    }
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  const authCheck = await requireAdminApi();
  if (!authCheck.ok) {
    return NextResponse.json(
      { error: authCheck.error },
      { status: authCheck.status }
    );
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

    const escapedId = manuscriptId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pathRegex = new RegExp(
      `^${escapedId}/\\d+-[a-z0-9]+\\.(jpg|jpeg|png|webp)$`
    );
    for (const f of files) {
      if (!pathRegex.test(f.path)) {
        return NextResponse.json(
          { error: "Path file tidak valid" },
          { status: 400 }
        );
      }
    }

    const manuscript = await prisma.manuscript.findUnique({
      where: { id: manuscriptId },
      select: { id: true, _count: { select: { pages: true } } },
    });
    if (!manuscript) {
      return NextResponse.json(
        { error: "Naskah tidak ditemukan" },
        { status: 404 }
      );
    }
    if (manuscript._count.pages > 0) {
      return NextResponse.json(
        { error: "Naskah sudah punya halaman" },
        { status: 400 }
      );
    }

    const allPaths = files.map((f) => f.path);

    const { data: stored, error: listError } = await supabaseAdmin.storage
      .from("manuscripts")
      .list(manuscriptId);

    if (listError) {
      return NextResponse.json(
        { error: "Gagal memverifikasi berkas" },
        { status: 500 }
      );
    }

    const storedMap = new Map(
      (stored ?? []).map((f) => [`${manuscriptId}/${f.name}`, f])
    );

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const item = storedMap.get(f.path);
      if (!item) {
        await cleanupFiles(allPaths);
        await prisma.manuscript
          .delete({ where: { id: manuscriptId } })
          .catch(() => {});
        return NextResponse.json(
          { error: `File ${i + 1} tidak ditemukan di storage` },
          { status: 400 }
        );
      }
      const size = (item.metadata?.size as number | undefined) ?? 0;
      const mime = (item.metadata?.mimetype as string | undefined) ?? "";
      if (size > MAX_FILE_BYTES) {
        await cleanupFiles(allPaths);
        await prisma.manuscript
          .delete({ where: { id: manuscriptId } })
          .catch(() => {});
        return NextResponse.json(
          { error: `File ${i + 1} melebihi 15 MB` },
          { status: 400 }
        );
      }
      if (!ALLOWED_MIME.includes(mime)) {
        await cleanupFiles(allPaths);
        await prisma.manuscript
          .delete({ where: { id: manuscriptId } })
          .catch(() => {});
        return NextResponse.json(
          { error: `File ${i + 1} jenis tidak diizinkan` },
          { status: 400 }
        );
      }
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.page.createMany({
          data: files.map((f, i) => ({
            manuscriptId,
            pageNumber: i + 1,
            imageUrl: f.path,
            width: f.w,
            height: f.h,
          })),
        });
      });
    } catch {
      await cleanupFiles(allPaths);
      await prisma.manuscript
        .delete({ where: { id: manuscriptId } })
        .catch(() => {});
      return NextResponse.json(
        { error: "Gagal menyimpan data. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}