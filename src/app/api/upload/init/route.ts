import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const initSchema = z.object({
  code: z.string().trim().max(100).optional().nullable(),
  title: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        title: title || "",
        script: "",
      },
    });

    return NextResponse.json({ manuscriptId: manuscript.id });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}