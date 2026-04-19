import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const year = searchParams.get("year") || "";
  const name = searchParams.get("name") || "";
  const event = searchParams.get("event") || "";

  // 大会名が未選択の場合は空配列を返す
  if (!name) return NextResponse.json([]);

  const records = await prisma.record.findMany({
    where: {
      competitionName: name,
      ...(event ? { event } : {}),
      ...(year
        ? {
            date: {
              gte: new Date(`${year}-01-01`),
              lte: new Date(`${year}-12-31`),
            },
          }
        : {}),
    },
    include: {
      athlete: { select: { id: true, nameKanji: true } },
      team: { select: { name: true } },
    },
    orderBy: { timeSeconds: "asc" },
  });

  return NextResponse.json(records);
}
