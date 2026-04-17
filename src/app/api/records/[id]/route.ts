import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeStringToSeconds } from "@/lib/timeUtils";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const seconds = timeStringToSeconds(body.timeString);

  const record = await prisma.record.update({
    where: { id: params.id },
    data: {
      athleteId: body.athleteId,
      teamId: body.teamId || null,
      event: body.event,
      timeString: body.timeString,
      timeSeconds: Math.round(seconds),
      competitionName: body.competitionName,
      date: new Date(body.date),
      ranking: body.ranking || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(record);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.record.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
