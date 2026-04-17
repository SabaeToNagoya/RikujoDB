import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [athleteCount, recordCount, teamCount, recentRecords, recentCompetitions] =
    await Promise.all([
      prisma.athlete.count(),
      prisma.record.count(),
      prisma.team.count(),
      prisma.record.findMany({
        take: 8,
        orderBy: { createdAt: "desc" },
        include: { athlete: { select: { nameKanji: true } } },
        select: {
          id: true,
          event: true,
          timeString: true,
          competitionName: true,
          date: true,
          createdAt: true,
          athlete: { select: { nameKanji: true } },
        },
      }),
      prisma.record.findMany({
        orderBy: { date: "desc" },
        take: 20,
        select: { competitionName: true, date: true },
      }),
    ]);

  // 直近の大会（重複除去）
  const seen = new Set<string>();
  const competitions = recentCompetitions
    .filter((r) => {
      if (seen.has(r.competitionName)) return false;
      seen.add(r.competitionName);
      return true;
    })
    .slice(0, 5);

  return NextResponse.json({
    athleteCount,
    recordCount,
    teamCount,
    recentRecords,
    recentCompetitions: competitions,
  });
}
