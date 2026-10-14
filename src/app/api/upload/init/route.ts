import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/require-admin";

const initSchema = z.object({
  code: z.string().trim().max(100).optional().nullable(),
  title: z.string().trim().max(500).optional().nullable(),
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
    const parsed = initSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }

    const { code, title } = parsed.data;

    const manuscript = await prisma.manuscript.create({
      data: {
        code: code || null,
        title: title || null,
        script: null,
      },
    });

    return NextResponse.json({ manuscriptId: manuscript.id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}