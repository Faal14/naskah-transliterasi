import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { manuscriptId, filename, contentType } = await req.json();

    if (!manuscriptId || !filename) {
      return NextResponse.json(
        { error: "manuscriptId dan filename wajib" },
        { status: 400 }
      );
    }

    const ext = filename.split(".").pop() || "jpg";
    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const path = `${manuscriptId}/${uniqueName}`;

    const { data, error } = await supabaseAdmin.storage
      .from("manuscripts")
      .createSignedUploadUrl(path);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path,
      contentType,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Server error" },
      { status: 500 }
    );
  }
}