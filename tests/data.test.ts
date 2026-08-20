import { describe, expect, it } from "vitest";
import { latestDraw, lottoDraws, oldestDraw } from "@/data/draws";

describe("collected lotto data", () => {
  // 매주 회차가 늘어나므로 개수를 고정하지 않고 "1회부터 최신 회차까지 빠짐없이" 라는 불변식만 검증한다.
  it("contains every round from 1 through the latest without gaps", () => {
    expect(lottoDraws.length).toBe(latestDraw.round);
    expect(lottoDraws.map((draw) => draw.round)).toEqual(
      Array.from({ length: latestDraw.round }, (_, index) => latestDraw.round - index),
    );
  });

  it("exposes the actual first draw", () => {
    expect(oldestDraw).toMatchObject({ round: 1, date: "2002-12-07", numbers: [10, 23, 29, 33, 37, 40], bonus: 16 });
  });

  it("keeps every draw structurally valid", () => {
    for (const draw of lottoDraws) {
      expect(draw.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(draw.numbers).toHaveLength(6);
      expect(new Set(draw.numbers).size).toBe(6);
      expect([...draw.numbers]).toEqual([...draw.numbers].sort((a, b) => a - b));
      expect(draw.numbers.every((number) => number >= 1 && number <= 45)).toBe(true);
      expect(draw.bonus).toBeGreaterThanOrEqual(1);
      expect(draw.bonus).toBeLessThanOrEqual(45);
      expect(draw.numbers).not.toContain(draw.bonus);
    }
  });
});
