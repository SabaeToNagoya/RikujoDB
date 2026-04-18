import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// CSVフォーマット:
// 氏名（漢字）,ふりがな,性別,生年月日,出身都道府県,出身高校,出身大学,所属チーム名,備考

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rows: string[][] = body.rows;

  const results: { success: number; errors: string[]; duplicates: number } = {
    success: 0,
    errors: [],
    duplicates: 0,
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const [nameKanji, nameFurigana, gender, dobRaw, prefecture, highSchool, university, teamNameRaw, notes] = row;

    if (!nameKanji?.trim()) {
      results.errors.push(`行${i + 1}: 氏名（漢字）が空です`);
      continue;
    }
    if (!nameFurigana?.trim()) {
      results.errors.push(`行${i + 1}: ふりがなが空です`);
      continue;
    }
    if (!gender?.trim()) {
      results.errors.push(`行${i + 1}: 性別が空です`);
      continue;
    }
    if (gender.trim() !== "男性" && gender.trim() !== "女性") {
      results.errors.push(`行${i + 1}: 性別は「男性」または「女性」で入力してください`);
      continue;
    }

    // 重複チェック（同じ氏名漢字）
    const existing = await prisma.athlete.findFirst({
      where: { nameKanji: nameKanji.trim() },
    });
    if (existing) {
      results.duplicates++;
      continue;
    }

    // 生年月日パース（任意）
    let dateOfBirth: Date | null = null;
    if (dobRaw?.trim()) {
      try {
        const normalized = dobRaw.trim().replace(/\//g, "-");
        dateOfBirth = new Date(normalized);
        if (isNaN(dateOfBirth.getTime())) throw new Error("Invalid date");
      } catch {
        results.errors.push(`行${i + 1}: 生年月日「${dobRaw}」が不正です`);
        continue;
      }
    }

    // チーム検索（任意）
    let teamId: string | null = null;
    if (teamNameRaw?.trim()) {
      const team = await prisma.team.findFirst({
        where: { name: { contains: teamNameRaw.trim() } },
      });
      teamId = team?.id || null;
    }

    await prisma.athlete.create({
      data: {
        nameKanji: nameKanji.trim(),
        nameFurigana: nameFurigana.trim(),
        gender: gender.trim(),
        dateOfBirth,
        prefecture: prefecture?.trim() || null,
        highSchool: highSchool?.trim() || null,
        university: university?.trim() || null,
        teamId,
        notes: notes?.trim() || null,
      },
    });
    results.success++;
  }

  return NextResponse.json(results);
}
