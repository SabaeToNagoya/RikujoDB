import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeStringToSeconds } from "@/lib/timeUtils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const athleteId = searchParams.get("athleteId") || "";

  const records = await prisma.record.findMany({
    where: athleteId ? { athleteId } : {},
    include: {
      athlete: { select: { nameKanji: true } },
      team: { select: { name: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(records);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const seconds = timeStringToSeconds(body.timeString);

  const record = await prisma.record.create({
    data: {
      athleteId: body.athleteId,
      teamId: body.teamId || null,
      event: body.event,
      timeString: body.timeString,
      timeSeconds: Math.round(seconds),
      competitionName: body.competitionName,
      date: new Date(body.date),
      segment: body.segment || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(record, { status: 201 });
}
