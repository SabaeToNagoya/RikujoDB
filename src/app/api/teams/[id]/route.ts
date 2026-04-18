import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// 選手の自己ベスト・主種目を集計するヘルパー
async function buildAthleteStats(athleteId: string, teamId: string) {
  const records = await prisma.record.findMany({
    where: { athleteId, teamId },
    orderBy: { timeSeconds: "asc" },
  });
  const bestByEvent: Record<string, string> = {};
  records.forEach((r) => {
    if (!bestByEvent[r.event]) bestByEvent[r.event] = r.timeString;
  });
  const mainEvent =
    Object.entries(
      records.reduce((acc: Record<string, number>, r) => {
        acc[r.event] = (acc[r.event] || 0) + 1;
        return acc;
      }, {})
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return { mainEvent, bestByEvent };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      results: { orderBy: { year: "desc" } },
    },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ── 現在のメンバー: Athlete.teamId === このチームID ──
  const currentRaw = await prisma.athlete.findMany({
    where: { teamId: params.id },
    orderBy: { dateOfBirth: "asc" },
    select: {
      id: true,
      nameKanji: true,
      dateOfBirth: true,
      gender: true,
      team: { select: { id: true, name: true } },
    },
  });

  const currentAthletes = await Promise.all(
    currentRaw.map(async (a) => {
      const stats = await buildAthleteStats(a.id, params.id);
      return { ...a, ...stats };
    })
  );

  const currentIds = new Set(currentRaw.map((a) => a.id));

  // ── 過去のメンバー候補を収集 ──

  // 1) 記録にこのチームIDが付いているが、現在は別チームの選手
  const recordLinks = await prisma.record.findMany({
    where: { teamId: params.id },
    select: { athleteId: true },
    distinct: ["athleteId"],
  });
  const formerIdsFromRecords = recordLinks
    .map((r) => r.athleteId)
    .filter((id) => !currentIds.has(id));

  // 2) 高校・大学チームの場合、選手マスタの出身校フィールドで OB/OG を検索
  let formerIdsFromMaster: string[] = [];
  if (team.type === "大学") {
    const fromMaster = await prisma.athlete.findMany({
      where: {
        university: team.name,
        NOT: { teamId: params.id },
      },
      select: { id: true },
    });
    formerIdsFromMaster = fromMaster.map((a) => a.id);
  } else if (team.type === "高校") {
    const fromMaster = await prisma.athlete.findMany({
      where: {
        highSchool: team.name,
        NOT: { teamId: params.id },
      },
      select: { id: true },
    });
    formerIdsFromMaster = fromMaster.map((a) => a.id);
  }

  // 重複排除してまとめる（現在のメンバーは除外済み）
  const allFormerIds = Array.from(
    new Set([...formerIdsFromRecords, ...formerIdsFromMaster])
  );

  // 過去メンバーの詳細取得 → 生年月日昇順ソート
  const formerRaw = await prisma.athlete.findMany({
    where: { id: { in: allFormerIds } },
    orderBy: { dateOfBirth: "asc" },
    select: {
      id: true,
      nameKanji: true,
      dateOfBirth: true,
      gender: true,
      highSchool: true,
      university: true,
      team: { select: { id: true, name: true } },
    },
  });

  const formerAthletes = await Promise.all(
    formerRaw.map(async (a) => {
      const stats = await buildAthleteStats(a.id, params.id);
      return { ...a, ...stats };
    })
  );

  return NextResponse.json({ ...team, currentAthletes, formerAthletes });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const team = await prisma.team.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(team);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.team.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
