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
      date: true,
    },
  });

  const yearsSet = new Set<number>();
  const namesSet = new Set<string>();
  const eventsSet = new Set<string>();

  for (const r of records) {
    yearsSet.add(new Date(r.date).getFullYear());
    namesSet.add(r.competitionName);
    eventsSet.add(r.event);
  }

  const years = Array.from(yearsSet).sort((a, b) => b - a);
  const names = Array.from(namesSet).sort();
  const events = Array.from(eventsSet).sort();

  return NextResponse.json({ years, names, events });
}
