import { describe, expect, it } from "vitest";
import { getSavedSets, isStorageAvailable } from "@/lib/storage";

describe("archive storage", () => {
  it("does not access IndexedDB during SSR", async () => {
    expect(isStorageAvailable()).toBe(false);
    await expect(getSavedSets()).resolves.toEqual([]);
  });
});
