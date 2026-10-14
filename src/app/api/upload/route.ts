import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdminApi } from "@/lib/require-admin";

const ALLOWED_CONTENT_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

const uploadSchema = z.object({
  manuscriptId: z.string().min(1).max(100),
  filename: z.string().min(1).max(255),
  contentType: z.enum(ALLOWED_CONTENT_TYPES, {
    message: "Hanya JPEG, PNG, atau WebP",
  }),
});

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
    const parsed = uploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { manuscriptId, filename, contentType } = parsed.data;

    const ext = (filename.split(".").pop() || "").toLowerCase();
    if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
      return NextResponse.json(
        { error: "Ekstensi file tidak diizinkan" },
        { status: 400 }
      );
    }

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

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const path = `${manuscriptId}/${uniqueName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("manuscripts")
      .createSignedUploadUrl(path);

    if (error || !data) {
      return NextResponse.json(
        { error: "Gagal menyiapkan upload" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      contentType,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}