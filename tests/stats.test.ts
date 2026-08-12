import { expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats, pairStats } from "@/lib/stats";

it("전체 1236회 집계의 총 출현 횟수는 7416이다", () => {
  expect(lottoDraws).toHaveLength(1236);
  expect(aggregateNumberStats(lottoDraws).reduce((sum, stat) => sum + stat.totalCount, 0)).toBe(7416);
});

it("전체 1236회에서 45C2 궁합수 990쌍을 집계한다", () => {
  const stats = pairStats(lottoDraws);
  expect(stats).toHaveLength(990);
  expect(stats.reduce((sum, stat) => sum + stat.count, 0)).toBe(1236 * 15);
  expect(stats[0].count).toBeGreaterThanOrEqual(stats[stats.length - 1].count);
  expect(stats.every((stat) => stat.numbers[0] < stat.numbers[1])).toBe(true);
});
