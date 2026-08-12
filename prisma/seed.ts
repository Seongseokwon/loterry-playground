import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import collectedDraws from "@/data/lotto-draws.json";
import { toDraw } from "@/lib/adapter";
import { aggregateNumberStats, drawSum } from "@/lib/stats";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL 환경변수가 필요합니다.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
const draws = collectedDraws.map(toDraw);

try {
  await prisma.draw.createMany({
    data: draws.map((draw) => ({
      round: draw.round,
      drawDate: new Date(`${draw.date}T00:00:00.000Z`),
      numbers: draw.numbers,
      bonus: draw.bonus,
      totalSell: draw.totalSell === undefined ? undefined : BigInt(draw.totalSell),
      firstWinAmt: draw.firstWinAmount === undefined ? undefined : BigInt(draw.firstWinAmount),
      firstWinners: draw.firstWinners,
      sumValue: drawSum(draw),
      oddCount: draw.numbers.filter((number) => number % 2 === 1).length,
      lowCount: draw.numbers.filter((number) => number <= 22).length,
    })),
    skipDuplicates: true,
  });

  const numberStats = aggregateNumberStats(draws);
  await prisma.numberStat.deleteMany();
  await prisma.numberStat.createMany({ data: numberStats });

  console.log(`Seeded ${draws.length} draws and ${numberStats.length} number stats.`);
} finally {
  await prisma.$disconnect();
}
