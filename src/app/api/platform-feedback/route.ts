import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// GET — ambil semua rating + review
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  const [ratings, reviews] = await Promise.all([
    prisma.platformRating.findMany({
      select: { score: true, userId: true, guestId: true },
    }),
    prisma.platformReview.findMany({
      orderBy: { createdAt: "desc" },
      take: limit ? parseInt(limit) : undefined,
    }),
  ]);

  const totalRatings = ratings.length;
  const averageScore =
    totalRatings > 0
      ? ratings.reduce((sum, r) => sum + r.score, 0) / totalRatings
      : 0;

  const session = await auth();
  const user = session?.user as any;

  const userRating = user
    ? ratings.find((r) => r.userId === user.id)?.score || null
    : null;

  return NextResponse.json({
    totalRatings,
    averageScore,
    userRating,
    reviews,
  });
}

// POST — submit rating &/atau review
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      score,
      reviewContent,
      guestName,
      guestId,
      action, // "rate" | "review" | "both"
    } = body;

    const session = await auth();
    const user = session?.user as any;

    // Submit rating
    if ((action === "rate" || action === "both") && score) {
      if (score < 1 || score > 5) {
        return NextResponse.json(
          { error: "Rating harus 1-5" },
          { status: 400 }
        );
      }

      if (user) {
        // Upsert: 1 user = 1 rating
        const existing = await prisma.platformRating.findFirst({
          where: { userId: user.id },
        });

        if (existing) {
          await prisma.platformRating.update({
            where: { id: existing.id },
            data: { score },
          });
        } else {
          await prisma.platformRating.create({
            data: { userId: user.id, score },
          });
        }
      } else {
        if (!guestId) {
          return NextResponse.json(
            { error: "Guest ID diperlukan" },
            { status: 400 }
          );
        }

        const existing = await prisma.platformRating.findFirst({
          where: { guestId },
        });

        if (existing) {
          await prisma.platformRating.update({
            where: { id: existing.id },
            data: { score },
          });
        } else {
          await prisma.platformRating.create({
            data: { guestId, score },
          });
        }
      }
    }

    // Submit review
    if (action === "review" || action === "both") {
      if (!reviewContent || reviewContent.trim().length < 5) {
        return NextResponse.json(
          { error: "Ulasan minimal 5 karakter" },
          { status: 400 }
        );
      }

      if (reviewContent.length > 500) {
        return NextResponse.json(
          { error: "Ulasan maksimal 500 karakter" },
          { status: 400 }
        );
      }

      let displayName: string;

      if (user) {
        displayName = user.name;
      } else {
        if (!guestName || guestName.trim().length < 2) {
          return NextResponse.json(
            { error: "Nama minimal 2 karakter" },
            { status: 400 }
          );
        }
        displayName = guestName.trim();
      }

      await prisma.platformReview.create({
        data: {
          userId: user?.id || null,
          guestId: guestId || null,
          displayName,
          content: reviewContent.trim(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan" },
      { status: 500 }
    );
  }
}