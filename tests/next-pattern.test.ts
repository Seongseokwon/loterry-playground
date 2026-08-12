import { describe, expect, it } from "vitest";
import { analyzeNextPatterns, drawPattern, formatPattern } from "@/lib/next-pattern";
import type { Draw } from "@/lib/types";

const draw = (round: number, numbers: Draw["numbers"]): Draw => ({ round, date: "2026-01-01", numbers, bonus: 45 });

describe("next pattern analysis", () => {
  it("maps numbers into the default five ranges", () => {
    expect(drawPattern(draw(3, [1, 10, 11, 20, 21, 45]))).toEqual([2, 2, 1, 0, 1]);
    expect(formatPattern([1, 1, 2, 1, 1])).toBe("1·1·2·1·1");
  });

  it("ranks immediate next patterns using the latest 100-round window", () => {
    const draws = [
      draw(5, [1, 2, 11, 21, 31, 41]), // current: 2,1,1,1,1
      draw(4, [1, 11, 12, 21, 31, 41]), // current -> 1,2,1,1,1
      draw(3, [2, 3, 11, 21, 31, 41]), // current -> 2,1,1,1,1
      draw(2, [1, 2, 11, 21, 31, 41]), // current -> 2,1,1,1,1
      draw(1, [1, 11, 21, 31, 41, 42]),
    ];
    const analysis = analyzeNextPatterns(draws, 5);
    expect(analysis.currentPattern).toEqual([2, 1, 1, 1, 1]);
    expect(analysis.matchingRounds).toBe(2);
    expect(analysis.candidates[0]).toMatchObject({ pattern: [1, 2, 1, 1, 1], transitionCount: 1 });
    expect(analysis.candidates[1]).toMatchObject({ pattern: [2, 1, 1, 1, 1], transitionCount: 1 });
  });
});
