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

  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      results: { orderBy: { year: "desc" } },
    },
  });
  if (!team) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // 所属選手: Recordのteamから紐づく選手を取得
  const athleteIds = await prisma.record.findMany({
    where: { teamId: params.id },
    select: { athleteId: true },
    distinct: ["athleteId"],
  });

  const athletes = await Promise.all(
    athleteIds.map(async ({ athleteId }) => {
      const a = await prisma.athlete.findUnique({
        where: { id: athleteId },
        select: { id: true, nameKanji: true, teamName: true },
      });
      const records = await prisma.record.findMany({
        where: { athleteId, teamId: params.id },
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
      return { ...a, mainEvent, bestByEvent };
    })
  );

  return NextResponse.json({ ...team, athletes });
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
