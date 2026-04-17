import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const setups = await prisma.watchingSetup.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(setups);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const setup = await prisma.watchingSetup.create({
    data: {
      name: body.name,
      type: body.type,
      athleteIds: JSON.stringify(body.athleteIds || []),
      teamSetup: body.teamSetup ? JSON.stringify(body.teamSetup) : null,
    },
  });
  return NextResponse.json(setup, { status: 201 });
}
