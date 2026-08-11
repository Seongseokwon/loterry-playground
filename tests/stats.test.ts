import { expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats } from "@/lib/stats";

it("전체 1236회 집계의 총 출현 횟수는 7416이다", () => {
  expect(lottoDraws).toHaveLength(1236);
  expect(aggregateNumberStats(lottoDraws).reduce((sum, stat) => sum + stat.totalCount, 0)).toBe(7416);
});
