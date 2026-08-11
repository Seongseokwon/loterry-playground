import { describe, expect, it } from "vitest";
import { latestDraw, lottoDraws, oldestDraw } from "@/data/draws";

describe("collected lotto data", () => {
  it("contains every round from 1 through 1236 without gaps", () => {
    expect(lottoDraws).toHaveLength(1236);
    expect(lottoDraws.map((draw) => draw.round)).toEqual(
      Array.from({ length: 1236 }, (_, index) => 1236 - index),
    );
  });

  it("exposes the actual first and latest draws", () => {
    expect(latestDraw).toMatchObject({ round: 1236, date: "2026-08-08", numbers: [12, 18, 21, 29, 34, 38], bonus: 10 });
    expect(oldestDraw).toMatchObject({ round: 1, date: "2002-12-07", numbers: [10, 23, 29, 33, 37, 40], bonus: 16 });
  });
});
