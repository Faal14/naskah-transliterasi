import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { manuscriptId, files } = await req.json();

    if (!manuscriptId || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      await prisma.page.create({
        data: {
          manuscriptId,
          pageNumber: i + 1,
          imageUrl: f.path,
          width: f.w || 1000,
          height: f.h || 1400,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}