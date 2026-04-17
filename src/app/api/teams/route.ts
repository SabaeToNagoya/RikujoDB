import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "";
  const type = searchParams.get("type") || "";

  const teams = await prisma.team.findMany({
    where: {
      AND: [
        name ? { name: { contains: name } } : {},
        type ? { type } : {},
      ],
    },
    include: {
      results: {
        orderBy: { year: "desc" },
        take: 3,
      },
      records: {
        select: { athleteId: true },
        distinct: ["athleteId"],
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teams);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const team = await prisma.team.create({
    data: {
      name: body.name,
      type: body.type,
      notes: body.notes || null,
    },
  });
  return NextResponse.json(team, { status: 201 });
}
