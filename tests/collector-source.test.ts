import { describe, expect, it } from "vitest";
import { normalizeApiRow } from "@/lib/collector/source.mjs";

describe("lotto collector source", () => {
  it("normalizes and sorts a valid API row", () => {
    const draw = normalizeApiRow({
      ltEpsd: 1236,
      ltRflYmd: "20260808",
      tm1WnNo: 38,
      tm2WnNo: 12,
      tm3WnNo: 34,
      tm4WnNo: 18,
      tm5WnNo: 29,
      tm6WnNo: 21,
      bnsWnNo: 10,
      wholEpsdSumNtslAmt: 114070835000,
      rnk1WnAmt: 2441919375,
      rnk1WnNope: 11,
    });

    expect(draw).toMatchObject({
      round: 1236,
      date: "2026-08-08",
      numbers: [12, 18, 21, 29, 34, 38],
      bonus: 10,
    });
  });

  it("rejects duplicate main numbers and bonus numbers", () => {
    expect(() => normalizeApiRow({
      ltEpsd: 1236,
      ltRflYmd: "20260808",
      tm1WnNo: 12,
      tm2WnNo: 12,
      tm3WnNo: 21,
      tm4WnNo: 29,
      tm5WnNo: 34,
      tm6WnNo: 38,
      bnsWnNo: 10,
      wholEpsdSumNtslAmt: 1,
      rnk1WnAmt: 1,
      rnk1WnNope: 1,
    })).toThrow("Invalid number set");
  });
});
