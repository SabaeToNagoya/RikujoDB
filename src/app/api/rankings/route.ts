import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const event = searchParams.get("event") || "";
  const year = searchParams.get("year") || "";
  const gender = searchParams.get("gender") || "";

  if (!event) return NextResponse.json([]);

  const where: Record<string, unknown> = { event };

  if (year) {
    const y = parseInt(year);
    where.date = {
      gte: new Date(`${y}-01-01`),
      lte: new Date(`${y}-12-31`),
    };
  }

  const records = await prisma.record.findMany({
    where,
    include: {
      athlete: {
        select: { id: true, nameKanji: true, gender: true, teamName: true },
      },
      team: { select: { name: true } },
    },
    orderBy: { timeSeconds: "asc" },
  });

  // 性別フィルタ
  const filtered = gender
    ? records.filter((r) => r.athlete.gender === gender)
    : records;

  // 選手ごとに最速記録のみ（ベスト1件）
  const bestByAthlete: Map<string, typeof filtered[0]> = new Map();
  filtered.forEach((r) => {
    const existing = bestByAthlete.get(r.athleteId);
    if (!existing || r.timeSeconds < existing.timeSeconds) {
      bestByAthlete.set(r.athleteId, r);
    }
  });

  const ranking = Array.from(bestByAthlete.values())
    .sort((a, b) => a.timeSeconds - b.timeSeconds)
    .slice(0, 50);

  return NextResponse.json(ranking);
}
