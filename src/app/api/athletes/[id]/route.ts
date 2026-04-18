import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const athlete = await prisma.athlete.findUnique({
    where: { id: params.id },
    include: {
      team: { select: { id: true, name: true } },
      records: {
        orderBy: { date: "desc" },
        include: { team: { select: { name: true } } },
      },
    },
  });

  if (!athlete) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 種目別自己ベスト（駅伝は除外）
  const bestByEvent: Record<string, { timeString: string; timeSeconds: number; competitionName: string; date: Date }> = {};

  athlete.records.forEach((r) => {
    if (r.segment) return; // 駅伝（区間記録）は除外
    if (!bestByEvent[r.event] || r.timeSeconds < bestByEvent[r.event].timeSeconds) {
      bestByEvent[r.event] = { timeString: r.timeString, timeSeconds: r.timeSeconds, competitionName: r.competitionName, date: r.date };
    }
  });

  // つながり: 同じ高校/大学の選手を検索
  const connections: { type: "同期" | "先輩" | "後輩"; school: string; schoolType: "高校" | "大学"; athlete: { id: string; nameKanji: string; dateOfBirth: Date | null } }[] = [];
  const schoolFields: { field: "highSchool" | "university"; label: "高校" | "大学" }[] = [
    { field: "highSchool", label: "高校" },
    { field: "university", label: "大学" },
  ];

  for (const { field, label } of schoolFields) {
    const schoolName = athlete[field];
    if (!schoolName) continue;

    const related = await prisma.athlete.findMany({
      where: {
        [field]: schoolName,
        id: { not: athlete.id },
      },
      select: { id: true, nameKanji: true, dateOfBirth: true },
    });

    const athleteDOB = athlete.dateOfBirth ? new Date(athlete.dateOfBirth) : null;
    const athleteYear = athleteDOB ? athleteDOB.getFullYear() : null;

    related.forEach((r) => {
      const rDOB = r.dateOfBirth ? new Date(r.dateOfBirth) : null;
      const rYear = rDOB ? rDOB.getFullYear() : null;

      let type: "同期" | "先輩" | "後輩" = "同期";
      if (athleteYear && rYear) {
        const diff = rYear - athleteYear;
        if (Math.abs(diff) <= 1) type = "同期";
        else if (diff < 0) type = "先輩";
        else type = "後輩";
      }

      connections.push({ type, school: schoolName, schoolType: label, athlete: r });
    });
  }

  return NextResponse.json({ ...athlete, bestByEvent, connections });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const athlete = await prisma.athlete.update({
    where: { id: params.id },
    include: { team: { select: { id: true, name: true } } },
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
  });
  return NextResponse.json(athlete);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.athlete.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
