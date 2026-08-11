import { describe, expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { drawNumbers } from "@/lib/draw-engine";
import { aggregateNumberStats } from "@/lib/stats";
import type { DrawRequest } from "@/lib/types";

const context = { stats: aggregateNumberStats(lottoDraws), latestDraw: lottoDraws[0], pastDraws: lottoDraws };
const base: DrawRequest = { conditions: {}, filters: { noConsecutive3: true, noPastJackpot: true, noSameTail3: false }, games: 1 };

describe("drawNumbers", () => {
  it("fixed가 excluded보다 우선하고 완화 내용을 기록한다", () => {
    const result = drawNumbers({ ...base, conditions: { fixed: [7], excluded: [7] } }, context);
    expect(result.games[0]).toContain(7);
    expect(result.relaxed?.join(" ")).toContain("우선");
  });

  it("후보가 6개 미만이면 무한 반복 없이 실패한다", () => {
    const excluded = Array.from({ length: 40 }, (_, index) => index + 1);
    const result = drawNumbers({ ...base, conditions: { excluded } }, context);
    expect(result.games).toEqual([]);
    expect(result.attempts).toBeLessThanOrEqual(5000);
  });

  it("5게임은 완전 중복되지 않는다", () => {
    const result = drawNumbers({ ...base, games: 5 }, context);
    expect(result.games).toHaveLength(5);
    expect(new Set(result.games.map((game) => game.join(","))).size).toBe(5);
  });

  it("3연속 번호 필터를 지킨다", () => {
    const result = drawNumbers(base, context);
    const game = result.games[0];
    const hasConsecutive3 = game.some((number, index) => index <= 3 && game[index + 1] === number + 1 && game[index + 2] === number + 2);
    expect(hasConsecutive3).toBe(false);
  });
});
