import { describe, expect, it } from "vitest";
import { validateDrawCollection } from "@/lib/collector/source.mjs";

const draw = (round: number) => ({ round, date: "2020-01-01", numbers: [1, 2, 3, 4, 5, 6], bonus: 7, totalSell: 1, firstWinAmount: 1, firstWinners: 1 });

describe("validateDrawCollection", () => {
  it("accepts contiguous draw data", () => {
    expect(validateDrawCollection([draw(1), draw(2)])).toMatchObject({ firstRound: 1, latestRound: 2, count: 2 });
  });
  it("rejects missing rounds", () => {
    expect(() => validateDrawCollection([draw(1), draw(3)])).toThrow("missing round 2");
  });
  it("rejects duplicate rounds", () => {
    expect(() => validateDrawCollection([draw(1), draw(1)])).toThrow("duplicate rounds");
  });
});
