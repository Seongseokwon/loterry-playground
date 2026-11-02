import { describe, expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { backtestExperiments, labContext, labRequest, sampleExperiment, variantConfig, type LabConfig } from "@/lib/lab-experiment";

const config: LabConfig = { pattern: false, strategy: "exact", windowSize: 100, hot: true, hotWindow: 30, hotWeight: "mid", cold: true, coldPool: 15, pair: false, pairWindow: 50, pairTop: 10, pairBase: null };
describe("실험 조합", () => {
  it("allows hot and cold without requiring a pattern", () => {
    const request = labRequest(config, lottoDraws)!;
    expect(request.conditions.rangePattern).toBeUndefined();
    expect(request.conditions.hot).toBeDefined();
    expect(request.conditions.cold).toBeDefined();
    expect(sampleExperiment(request, labContext(lottoDraws), 10).completed).toBe(10);
  });
  it("uses a random baseline with no pattern or weights", () => {
    const request = labRequest(variantConfig({ ...config, pattern: true, pair: true }, "무작위"), lottoDraws)!;
    expect(request.conditions).toEqual({ rangePattern: undefined, hot: undefined, cold: undefined, pair: undefined });
  });
  it("scores historical games and respects the requested sample count", () => {
    const rows = backtestExperiments(lottoDraws.slice(0, 50), config, 2, 2);
    for (const row of rows) {
      expect(row.rounds + row.skipped).toBe(2);
      expect(row.matches.reduce((a, b) => a + b, 0)).toBe(row.completed);
      expect(row.completed + row.failed).toBe(row.rounds * 2);
    }
  });
});
