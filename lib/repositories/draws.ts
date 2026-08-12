import { prisma } from "@/lib/prisma";
import type { Draw, NumberStat } from "@/lib/types";

type StoredDraw = NonNullable<Awaited<ReturnType<typeof prisma.draw.findFirst>>>;

export function toDraw(row: StoredDraw): Draw {
  return {
    round: row.round,
    date: row.drawDate.toISOString().slice(0, 10),
    numbers: [...row.numbers].sort((a, b) => a - b) as Draw["numbers"],
    bonus: row.bonus,
    totalSell: row.totalSell === null ? undefined : Number(row.totalSell),
    firstWinAmount: row.firstWinAmt === null ? undefined : Number(row.firstWinAmt),
    firstWinners: row.firstWinners ?? undefined,
  };
}

export async function getDraws(): Promise<Draw[]> {
  const rows = await prisma.draw.findMany({ orderBy: { round: "desc" } });
  return rows.map(toDraw);
}

export async function getDrawByRound(round: number): Promise<Draw | null> {
  const row = await prisma.draw.findUnique({ where: { round } });
  return row ? toDraw(row) : null;
}

export async function getNumberStats(): Promise<NumberStat[]> {
  return prisma.numberStat.findMany({ orderBy: { number: "asc" } });
}
