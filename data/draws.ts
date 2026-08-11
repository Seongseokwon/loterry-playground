import type { Draw } from "@/lib/types";
import collectedDraws from "./lotto-draws.json";

export const lottoDraws: Draw[] = collectedDraws.map((draw) => ({
  ...draw,
  numbers: draw.numbers as Draw["numbers"],
}));

export const latestDraw = lottoDraws[0];
export const oldestDraw = lottoDraws[lottoDraws.length - 1];
