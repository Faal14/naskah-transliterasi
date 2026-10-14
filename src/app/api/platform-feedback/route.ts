import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { clientIp, rateLimit, HOUR } from "@/lib/rate-limit";

const limitSchema = z.coerce
  .number()
  .int()
  .catch(20)
  .transform((n) => Math.min(50, Math.max(1, n)));

const feedbackSchema = z.object(
  {
    action: z.enum(["rate", "review", "both"], "Aksi tidak valid"),
    score: z
      .number("Rating harus 1-5")
      .int("Rating harus 1-5")
      .min(1, "Rating harus 1-5")
      .max(5, "Rating harus 1-5")
      .optional(),
    reviewContent: z
      .string("Ulasan tidak valid")
      .trim()
      .max(500, "Ulasan maksimal 500 karakter")
      .optional(),
    guestName: z
      .string("Nama tidak valid")
      .trim()
      .max(60, "Nama maksimal 60 karakter")
      .optional(),
    // dibuat klien: guest_<Date.now()>_<acak base36>
    guestId: z
      .string("Guest ID tidak valid")
      .regex(/^guest_\d{10,16}_[a-z0-9]{1,16}$/, "Guest ID tidak valid")
      .optional(),
  },
  "Permintaan tidak valid"
);

// GET — ambil semua rating + review
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = limitSchema.parse(searchParams.get("limit") ?? 20);

  const [ratings, reviews] = await Promise.all([
    prisma.platformRating.findMany({
      select: { score: true, userId: true, guestId: true },
    }),
    prisma.platformReview.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
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
  const limited = rateLimit(`feedback:${clientIp(req.headers)}`, 10, HOUR);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak kiriman. Coba lagi nanti." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  try {
    const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    // action: "rate" | "review" | "both"
    const { score, reviewContent, guestName, guestId, action } = parsed.data;

    const session = await auth();
    const user = session?.user as any;

    // Submit rating
    if ((action === "rate" || action === "both") && score) {
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
      if (!reviewContent || reviewContent.length < 5) {
        return NextResponse.json(
          { error: "Ulasan minimal 5 karakter" },
          { status: 400 }
        );
      }

      let displayName: string;

      if (user) {
        displayName = user.name;
      } else {
        if (!guestName || guestName.length < 2) {
          return NextResponse.json(
            { error: "Nama minimal 2 karakter" },
            { status: 400 }
          );
        }
        displayName = guestName;
      }

      await prisma.platformReview.create({
        data: {
          userId: user?.id || null,
          guestId: guestId || null,
          displayName,
          content: reviewContent,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("platform-feedback:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan" },
      { status: 500 }
    );
  }
}