import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.teamResult.update({
    where: { id: params.id },
    data: {
      competitionName: body.competitionName,
      type: body.type,
      year: body.year,
      ranking: body.ranking,
      totalTime: body.totalTime || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(result);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.teamResult.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
