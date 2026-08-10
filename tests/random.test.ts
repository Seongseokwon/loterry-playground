import { expect, it } from "vitest";
import { randomInt } from "@/lib/random";

it("10만 회 추출 빈도가 기대값 ±5% 안에 든다", () => {
  const counts = Array.from({ length: 10 }, () => 0);
  for (let index = 0; index < 100_000; index += 1) counts[randomInt(10)] += 1;
  for (const count of counts) expect(count).toBeGreaterThanOrEqual(9_500);
  for (const count of counts) expect(count).toBeLessThanOrEqual(10_500);
});
