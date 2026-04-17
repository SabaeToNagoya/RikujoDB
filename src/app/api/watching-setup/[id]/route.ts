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

  const setup = await prisma.watchingSetup.findUnique({ where: { id: params.id } });
  if (!setup) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(setup);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const setup = await prisma.watchingSetup.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      athleteIds: JSON.stringify(body.athleteIds || []),
      teamSetup: body.teamSetup ? JSON.stringify(body.teamSetup) : null,
    },
  });
  return NextResponse.json(setup);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.watchingSetup.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
