import { expect, it } from "vitest";
import { aggregateNumberStats } from "@/lib/stats";
import { mockDraws } from "@/mocks/draws";

it("104회 집계의 총 출현 횟수는 624다", () => {
  expect(mockDraws).toHaveLength(104);
  expect(aggregateNumberStats(mockDraws).reduce((sum, stat) => sum + stat.totalCount, 0)).toBe(624);
});
