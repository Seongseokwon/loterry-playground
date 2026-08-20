import { expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats, drawSum, lowHighDistribution, median, oddEvenDistribution, pairStats } from "@/lib/stats";
import type { Draw } from "@/lib/types";

// 회차 수는 매주 늘어나므로 고정값 대신 데이터 길이에서 기대값을 유도한다.
it("전체 회차 집계의 총 출현 횟수는 회차수 × 6이다", () => {
  expect(aggregateNumberStats(lottoDraws).reduce((sum, stat) => sum + stat.totalCount, 0)).toBe(lottoDraws.length * 6);
});

it("45C2 궁합수 990쌍을 집계한다", () => {
  const stats = pairStats(lottoDraws);
  expect(stats).toHaveLength(990);
  expect(stats.reduce((sum, stat) => sum + stat.count, 0)).toBe(lottoDraws.length * 15);
  expect(stats[0].count).toBeGreaterThanOrEqual(stats[stats.length - 1].count);
  expect(stats.every((stat) => stat.numbers[0] < stat.numbers[1])).toBe(true);
});

it("분포 집계와 합계 중앙값을 계산한다", () => {
  // 수집 데이터와 무관하게 고정된 표본으로 계산 로직만 검증한다.
  const low: Draw = { round: 2, date: "2002-12-14", numbers: [1, 2, 3, 4, 5, 6], bonus: 45 };
  const high: Draw = { round: 1, date: "2002-12-07", numbers: [40, 41, 42, 43, 44, 45], bonus: 1 };
  const draws = [low, high];

  expect(drawSum(low)).toBe(21);
  expect(drawSum(high)).toBe(255);
  expect(oddEvenDistribution(draws).map((item) => item.count)).toEqual([0, 0, 0, 2, 0, 0, 0]);
  expect(lowHighDistribution(draws).map((item) => item.count)).toEqual([1, 0, 0, 0, 0, 0, 1]);
  expect(median([152, 121, 100])).toBe(121);
  expect(median([100, 121])).toBe(110.5);
});
