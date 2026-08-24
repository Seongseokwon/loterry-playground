import { describe, expect, it } from "vitest";
import { analyzeSavedSets, generateWeightedCombination } from "@/lib/saved-stats";
import type { SavedSet } from "@/lib/storage";

function savedSet(numbers: number[], id: string): SavedSet {
  return {
    id,
    numbers: numbers as SavedSet["numbers"],
    conditions: {},
    conditionLabels: [],
    label: id,
    memo: "",
    targetRound: 1238,
    createdAt: "2026-08-24T00:00:00.000Z",
    updatedAt: "2026-08-24T00:00:00.000Z",
  };
}

describe("saved number analysis", () => {
  it("counts each number across saved sets and exposes the most frequent numbers", () => {
    const analysis = analyzeSavedSets([
      savedSet([1, 2, 3, 4, 5, 6], "a"),
      savedSet([1, 2, 3, 7, 8, 9], "b"),
    ]);

    expect(analysis.totalSets).toBe(2);
    expect(analysis.totalSelections).toBe(12);
    expect(analysis.numbers.find((item) => item.number === 1)).toEqual({ number: 1, count: 2, percentage: 100 });
    expect(analysis.numbers.find((item) => item.number === 6)).toEqual({ number: 6, count: 1, percentage: 50 });
    expect(analysis.topNumbers.map((item) => item.number)).toEqual([1, 2, 3]);
  });

  it("creates six unique numbers with frequency-based weights", () => {
    const sets = [savedSet([1, 2, 3, 4, 5, 6], "a")];
    const result = generateWeightedCombination(sets, () => 0);

    expect(result).toHaveLength(6);
    expect(new Set(result).size).toBe(6);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("rejects combination generation when there are no saved sets", () => {
    expect(() => generateWeightedCombination([])).toThrow("저장된 번호가 없습니다.");
  });
});
