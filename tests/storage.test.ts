import { describe, expect, it } from "vitest";
import { getSavedSets, isSavedSetBackup, isStorageAvailable } from "@/lib/storage";

describe("archive storage", () => {
  it("does not access IndexedDB during SSR", async () => {
    expect(isStorageAvailable()).toBe(false);
    await expect(getSavedSets()).resolves.toEqual([]);
  });

  it("validates backup numbers and target round before import", () => {
    expect(isSavedSetBackup({ numbers: [1, 2, 3, 4, 5, 6], targetRound: 1244 })).toBe(true);
    expect(isSavedSetBackup({ numbers: [1, 2, 3, 4, 5, 5], targetRound: 1244 })).toBe(false);
    expect(isSavedSetBackup({ numbers: [1, 2, 3, 4, 5, 46], targetRound: 1244 })).toBe(false);
    expect(isSavedSetBackup({ numbers: [1, 2, 3, 4, 5, 6], targetRound: 0 })).toBe(false);
  });
});
