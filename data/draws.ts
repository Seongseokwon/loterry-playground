import type { Draw } from "@/lib/types";
import { pairStats } from "@/lib/stats";
import collectedDraws from "./lotto-draws.json";

export const lottoDraws: Draw[] = collectedDraws.map((draw) => ({
  ...draw,
  numbers: draw.numbers as Draw["numbers"],
}));

export const latestDraw = lottoDraws[0];
export const oldestDraw = lottoDraws[lottoDraws.length - 1];

// 1,236 draws × 15 pairs is small enough to calculate once at module load.
export const lottoPairStats = pairStats(lottoDraws);
