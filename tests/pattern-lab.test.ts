import { describe, expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { analyzeLab, backtestLab, patternDistance } from "@/lib/pattern-lab";

describe("pattern lab", () => {
  it("measures how many numbers move between ranges", () => {
    expect(patternDistance([0, 2, 1, 2, 1], [1, 2, 1, 1, 1])).toBe(1);
  });
  it("finds the known 1248 transitions and expands similar cases", () => {
    const draws = lottoDraws.filter((draw) => draw.round <= 1248);
    const exact = analyzeLab(draws, "exact");
    expect(exact.examples).toHaveLength(21);
    expect(exact.candidates[0]).toEqual({ pattern: [2, 1, 2, 1, 0], count: 3 });
    expect(analyzeLab(draws, "similar").examples.length).toBeGreaterThan(21);
    expect(analyzeLab(draws, "exact", 100).examples).toHaveLength(1);
  });
  it("does not use future draws when evaluating an earlier prediction", () => {
    const earlier = lottoDraws.filter((draw) => draw.round <= 100);
    const later = lottoDraws.filter((draw) => draw.round <= 101);
    const oldResult = backtestLab(earlier, "frequency", 100, 1);
    expect(oldResult).toEqual(backtestLab(later.slice(1), "frequency", 100, 1));
    expect(backtestLab(later, "frequency", 100, 1).requested).toBe(1);
  });
});
