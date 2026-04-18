import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const event = searchParams.get("event") || "";
  const team = searchParams.get("team") || "";
  const school = searchParams.get("school") || "";

  const athletes = await prisma.athlete.findMany({
    where: {
      AND: [
        name ? {
          OR: [
            { nameKanji: { contains: name } },
            { nameFurigana: { contains: name } },
          ],
        } : {},
        team ? { team: { name: { contains: team } } } : {},
        school ? {
          OR: [
            { highSchool: { contains: school } },
            { university: { contains: school } },
          ],
        } : {},
        // 種目フィルタ: 指定種目の記録を持つ選手のみDBレベルで絞り込む
        event ? { records: { some: { event } } } : {},
      ],
    },
    include: {
      team: { select: { id: true, name: true } },
      records: {
        where: event ? { event } : undefined,
        orderBy: { timeSeconds: "asc" },
        select: { event: true, timeSeconds: true, timeString: true, date: true, competitionName: true, ranking: true },
      },
    },
    orderBy: { nameKanji: "asc" },
  });

  const filtered = athletes;

  // 主種目・自己ベストを付加
  const result = filtered.map((a) => {
    // 主種目: 記録の中で最も多い種目
    const eventCounts: Record<string, number> = {};
    a.records.forEach((r) => {
      eventCounts[r.event] = (eventCounts[r.event] || 0) + 1;
    });
    const mainEvent =
      Object.entries(eventCounts).sort((x, y) => y[1] - x[1])[0]?.[0] || null;

    // 自己ベスト: 各種目の最小タイム
    const bestByEvent: Record<string, { timeString: string; timeSeconds: number }> = {};
    a.records.forEach((r) => {
      if (!bestByEvent[r.event] || r.timeSeconds < bestByEvent[r.event].timeSeconds) {
        bestByEvent[r.event] = { timeString: r.timeString, timeSeconds: r.timeSeconds };
      }
    });

    // メイン種目の自己ベスト
    const personalBest = mainEvent
      ? { event: mainEvent, timeString: bestByEvent[mainEvent]?.timeString || "" }
      : null;

    const { records: _r, ...athleteData } = a;
    return { ...athleteData, mainEvent, personalBest, bestByEvent };
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const athlete = await prisma.athlete.create({
    data: {
      nameKanji: body.nameKanji,
      nameFurigana: body.nameFurigana || "",
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      prefecture: body.prefecture || null,
      highSchool: body.highSchool || null,
      university: body.university || null,
      teamId: body.teamId || null,
      gender: body.gender || "男性",
      notes: body.notes || null,
    },
    include: { team: { select: { id: true, name: true } } },
  });
  return NextResponse.json(athlete, { status: 201 });
}
