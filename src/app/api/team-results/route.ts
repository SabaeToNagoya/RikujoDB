import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await prisma.teamResult.create({
    data: {
      teamId: body.teamId,
      competitionName: body.competitionName,
      type: body.type,
      year: body.year,
      ranking: body.ranking,
      totalTime: body.totalTime || null,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(result, { status: 201 });
}
