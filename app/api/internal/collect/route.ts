import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { CollectorResponseError, requestBatch } from "@/lib/collector/source.mjs";
import { prisma } from "@/lib/prisma";
import { toDraw } from "@/lib/repositories/draws";
import { aggregateNumberStats, drawSum } from "@/lib/stats";
import type { Draw } from "@/lib/types";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`);
}

async function writeLog(round: number | null, status: "success" | "pending" | "failed" | "blocked", message: string) {
  await prisma.collectionLog.create({ data: { round, status, message } });
}

function drawData(draw: Draw) {
  return {
    round: draw.round,
    drawDate: new Date(`${draw.date}T00:00:00.000Z`),
    numbers: draw.numbers,
    bonus: draw.bonus,
    totalSell: draw.totalSell === undefined ? null : BigInt(draw.totalSell),
    firstWinAmt: draw.firstWinAmount === undefined ? null : BigInt(draw.firstWinAmount),
    firstWinners: draw.firstWinners ?? null,
    sumValue: drawSum(draw),
    oddCount: draw.numbers.filter((number) => number % 2 === 1).length,
    lowCount: draw.numbers.filter((number) => number <= 22).length,
  };
}

async function refreshStats() {
  const rows = await prisma.draw.findMany({ orderBy: { round: "desc" } });
  const stats = aggregateNumberStats(rows.map(toDraw));
  await prisma.$transaction(
    stats.map((stat) => prisma.numberStat.upsert({
      where: { number: stat.number },
      create: stat,
      update: {
        totalCount: stat.totalCount,
        lastSeenRound: stat.lastSeenRound,
        gap: stat.gap,
        countRecent10: stat.countRecent10,
        countRecent50: stat.countRecent50,
        countRecent100: stat.countRecent100,
      },
    })),
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorized();

  let targetRound: number | null = null;
  try {
    const latest = await prisma.draw.findFirst({ orderBy: { round: "desc" }, select: { round: true } });
    targetRound = (latest?.round ?? 0) + 1;
    const existing = await prisma.draw.findUnique({ where: { round: targetRound } });
    if (existing) return NextResponse.json({ status: "already_collected", round: targetRound });

    const batch: Draw[] = await requestBatch(targetRound);
    const draw = batch.find((candidate) => candidate.round === targetRound);
    if (!draw) {
      await writeLog(targetRound, "pending", `제${targetRound}회 추첨 결과가 아직 공개되지 않았습니다.`);
      return NextResponse.json({ status: "pending", round: targetRound }, { status: 202 });
    }

    await prisma.draw.upsert({
      where: { round: draw.round },
      create: drawData(draw),
      update: drawData(draw),
    });
    await refreshStats();
    await writeLog(targetRound, "success", "최신 회차를 수집했습니다.");
    revalidateTag("draws", "max");
    revalidateTag("stats", "max");
    return NextResponse.json({ status: "success", round: targetRound });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const status = error instanceof CollectorResponseError ? error.status : undefined;
    const logStatus = status !== undefined && status >= 400 && status < 500 ? "blocked" : "failed";
    try {
      await writeLog(targetRound, logStatus, message);
    } catch {
      // Preserve the original collection error when the database is unavailable.
    }
    return NextResponse.json(
      { error: logStatus === "blocked" ? "Source request blocked" : "Collection failed" },
      { status: status === 429 ? 503 : 500 },
    );
  }
}
