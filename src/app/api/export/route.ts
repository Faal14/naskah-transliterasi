import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "json";
  const manuscriptId = searchParams.get("manuscriptId") || "ALL";
  const statusFilter = searchParams.get("status") || "APPROVED";

  const where: any = {};
  if (statusFilter !== "ALL") where.status = statusFilter;
  if (manuscriptId !== "ALL") {
    where.page = { manuscriptId };
  }

  const annotations = await prisma.annotation.findMany({
    where,
    include: {
      page: {
        include: {
          manuscript: {
            select: {
              id: true,
              title: true,
              script: true,
              year: true,
              source: true,
            },
          },
        },
      },
      contributor: { select: { name: true, email: true } },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { reviewer: { select: { name: true } } },
      },
    },
    orderBy: [
      { page: { manuscriptId: "asc" } },
      { page: { pageNumber: "asc" } },
      { createdAt: "asc" },
    ],
  });

  const timestamp = new Date().toISOString().slice(0, 10);

  // ==================== CSV ====================
  if (format === "csv") {
    const headers = [
      "manuscript_title",
      "script",
      "year",
      "source",
      "page_number",
      "x",
      "y",
      "w",
      "h",
      "transliteration",
      "translation",
      "pegon_text",
      "notes",
      "status",
      "contributor_name",
      "reviewer_name",
      "review_comment",
    ];

    const rows = annotations.map((a) => {
      const review = a.reviews[0];
      return [
        a.page.manuscript.title,
        a.page.manuscript.script,
        a.page.manuscript.year || "",
        a.page.manuscript.source || "",
        String(a.page.pageNumber),
        String(a.x),
        String(a.y),
        String(a.w),
        String(a.h),
        a.transliteration,
        a.translation,
        a.pegonText || "",
        a.notes || "",
        a.status,
        a.contributor.name,
        review?.reviewer.name || "",
        review?.comment || "",
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="transliterasi-${timestamp}.csv"`,
      },
    });
  }

  // ==================== JSON ====================
  const data = annotations.map((a) => {
    const review = a.reviews[0];
    return {
      manuscript: {
        id: a.page.manuscript.id,
        title: a.page.manuscript.title,
        script: a.page.manuscript.script,
        year: a.page.manuscript.year,
        source: a.page.manuscript.source,
      },
      page: a.page.pageNumber,
      boundingBox: { x: a.x, y: a.y, w: a.w, h: a.h },
      transliteration: a.transliteration,
      translation: a.translation,
      pegonText: a.pegonText,
      notes: a.notes,
      status: a.status,
      contributor: {
        name: a.contributor.name,
        email: a.contributor.email,
      },
      review: review
        ? {
            decision: review.decision,
            reviewer: review.reviewer.name,
            comment: review.comment,
          }
        : null,
    };
  });

  const json = JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      totalAnnotations: data.length,
      filter: {
        manuscriptId: manuscriptId === "ALL" ? "ALL" : manuscriptId,
        status: statusFilter,
      },
      data,
    },
    null,
    2
  );

  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="transliterasi-${timestamp}.json"`,
    },
  });
}