import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.record.findMany({
    select: {
      competitionName: true,
      event: true,
      segment: true,
      date: true,
    },
  });

  // {year, name, event, segment} の組み合わせ配列を返す（クライアント側で連動絞り込みに使う）
  const combinations = records.map((r) => ({
    year: new Date(r.date).getFullYear(),
    name: r.competitionName,
    event: r.event,
    segment: r.segment ?? "",
  }));

  return NextResponse.json(combinations);
}
