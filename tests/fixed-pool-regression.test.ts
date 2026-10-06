import { describe, expect, it } from "vitest";
import { drawNumbers } from "@/lib/draw-engine";
import type { DrawContext, DrawRequest } from "@/lib/types";

const context: DrawContext = {
  stats: Array.from({ length: 45 }, (_, index) => ({ number: index + 1, totalCount: 1, lastSeenRound: 1, gap: 0, countRecent10: 1, countRecent30: 1, countRecent50: 1, countRecent100: 1 })),
  latestDraw: { round: 1, date: "2020-01-01", numbers: [1, 2, 3, 4, 5, 45], bonus: 6 },
  pastDraws: [],
};
const request: DrawRequest = {
  conditions: { fixed: [1, 2, 3, 4, 5, 6, 7], carryover: { count: 1 }, pair: { base: [45], topK: 20 }, birthday: { dates: ["1990-01-31"] } },
  filters: { noConsecutive3: false, noPastJackpot: false, noSameTail3: false },
  games: 1,
};

describe("fixed candidate pool", () => {
  it("does not escape the selected pool when other strategies are enabled", () => {
    for (let index = 0; index < 20; index += 1) {
      const result = drawNumbers(request, context);
      expect(result.games).toHaveLength(1);
      expect(result.games[0].every((number) => request.conditions.fixed?.includes(number))).toBe(true);
    }
  });
});
