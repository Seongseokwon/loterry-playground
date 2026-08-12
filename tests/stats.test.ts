import { expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats, drawSum, lowHighDistribution, median, oddEvenDistribution, pairStats } from "@/lib/stats";

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

it("분포 집계와 합계 중앙값을 계산한다", () => {
  const draws = lottoDraws.slice(0, 2);
  expect(drawSum(draws[0])).toBe(152);
  expect(oddEvenDistribution(draws).map((item) => item.count)).toEqual([0, 0, 1, 0, 0, 1, 0]);
  expect(lowHighDistribution(draws).map((item) => item.count)).toEqual([0, 0, 0, 1, 1, 0, 0]);
  expect(median([152, 121, 100])).toBe(121);
  expect(median([100, 121])).toBe(110.5);
});
