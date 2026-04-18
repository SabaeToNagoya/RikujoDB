import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { timeStringToSeconds } from "@/lib/timeUtils";

// CSVフォーマット:
// 選手名,種目,記録,大会名,日付,所属チーム名（任意）,区間（任意）,メモ（任意）

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rows: string[][] = body.rows; // CSVパース済みの行配列

  const results: { success: number; errors: string[]; duplicates: number } = {
    success: 0,
    errors: [],
    duplicates: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < 5) {
      results.errors.push(`行${i + 1}: 列数が不足しています`);
      continue;
    }

    const [athleteName, event, timeStr, competitionName, dateStr, teamNameRaw, segmentRaw, notesRaw] = row;

    if (!athleteName || !event || !timeStr || !competitionName || !dateStr) {
      results.errors.push(`行${i + 1}: 必須項目が空です`);
      continue;
    }

    // 選手検索
    const athlete = await prisma.athlete.findFirst({
      where: { nameKanji: athleteName.trim() },
    });
    if (!athlete) {
      results.errors.push(`行${i + 1}: 選手「${athleteName}」がDBに見つかりません`);
      continue;
    }

    // 日付パース
    let date: Date;
    try {
      const normalized = dateStr.trim().replace(/\//g, "-");
      date = new Date(normalized);
      if (isNaN(date.getTime())) throw new Error("Invalid date");
    } catch {
      results.errors.push(`行${i + 1}: 日付「${dateStr}」が不正です`);
      continue;
    }

    // タイム変換
    const seconds = timeStringToSeconds(timeStr.trim());
    if (seconds === 0) {
      results.errors.push(`行${i + 1}: タイム「${timeStr}」が不正です`);
      continue;
    }

    // チーム検索（任意）
    let teamId: string | null = null;
    if (teamNameRaw?.trim()) {
      const team = await prisma.team.findFirst({
        where: { name: { contains: teamNameRaw.trim() } },
      });
      teamId = team?.id || null;
    }

    // 重複チェック（同選手・同種目・同大会・同日付）
    const existing = await prisma.record.findFirst({
      where: {
        athleteId: athlete.id,
        event: event.trim(),
        competitionName: competitionName.trim(),
        date,
      },
    });
    if (existing) {
      results.duplicates++;
      continue;
    }

    await prisma.record.create({
      data: {
        athleteId: athlete.id,
        teamId,
        event: event.trim(),
        segment: segmentRaw?.trim() || null,
        timeString: timeStr.trim(),
        timeSeconds: Math.round(seconds),
        competitionName: competitionName.trim(),
        date,
        notes: notesRaw?.trim() || null,
      },
    });
    results.success++;
  }

  return NextResponse.json(results);
}
