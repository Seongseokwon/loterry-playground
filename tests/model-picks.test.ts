import { describe, expect, it } from "vitest";
import { recommendModels } from "@/lib/model-picks";
import { lottoDraws } from "@/data/draws";

describe("model recommendations", () => {
  it("returns four valid, distinct-number combinations and explanations", () => {
    const picks = recommendModels(lottoDraws, () => 0.42);
    expect(picks.map((pick) => pick.id)).toEqual(["random", "trend", "gap", "pair"]);
    for (const pick of picks) {
      expect(pick.numbers).toHaveLength(6);
      expect(new Set(pick.numbers).size).toBe(6);
      expect(pick.numbers.every((n) => n >= 1 && n <= 45)).toBe(true);
      expect(pick.explanation.length).toBeGreaterThan(10);
    }
  });
  it("uses only the supplied history and handles missing history", () => {
    expect(recommendModels([])).toEqual([]);
    const picks = recommendModels(lottoDraws.slice(0, 1), () => 0);
    expect(picks[1].explanation).toContain("최근 1회");
    expect(new Set(picks[3].numbers).size).toBe(6);
  });
});
