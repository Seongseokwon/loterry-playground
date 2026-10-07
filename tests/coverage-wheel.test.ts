import { describe, expect, it } from "vitest";
import { buildCoverageWheel } from "@/lib/coverage-wheel";

describe("buildCoverageWheel", () => {
  it("includes every selected candidate at least once", () => {
    const result = buildCoverageWheel([1, 2, 3, 4, 5, 6, 7, 8, 9], 5);
    const union = new Set(result.games.flat());

    expect(result.games).toHaveLength(5);
    expect(result.games.every((game) => game.length === 6)).toBe(true);
    expect(union).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  });

  it("raises the game count when the candidate pool needs more coverage", () => {
    const result = buildCoverageWheel(Array.from({ length: 45 }, (_, index) => index + 1), 5);

    expect(result.minimumGames).toBe(8);
    expect(result.actualGames).toBe(8);
    expect(new Set(result.games.flat()).size).toBe(45);
  });
});
