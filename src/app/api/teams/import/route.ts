import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// CSVフォーマット:
// チーム名,種別,備考

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
    const [name, type, notes] = row;

    if (!name?.trim()) {
      results.errors.push(`行${i + 1}: チーム名が空です`);
      continue;
    }
    if (!type?.trim()) {
      results.errors.push(`行${i + 1}: 種別が空です`);
      continue;
    }
    if (!["実業団", "大学", "高校"].includes(type.trim())) {
      results.errors.push(`行${i + 1}: 種別は「実業団」「大学」「高校」のいずれかで入力してください`);
      continue;
    }

    // 重複チェック（同じチーム名）
    const existing = await prisma.team.findFirst({
      where: { name: name.trim() },
    });
    if (existing) {
      results.duplicates++;
      continue;
    }

    await prisma.team.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        notes: notes?.trim() || null,
      },
    });
    results.success++;
  }

  return NextResponse.json(results);
}
