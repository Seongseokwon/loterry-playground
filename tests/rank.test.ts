import { describe, expect, it } from "vitest";
import { judgeRank } from "@/lib/rank";
import { mockDraws } from "@/mocks/draws";

const draw = mockDraws.find((item) => item.round === 1236)!;

describe("judgeRank", () => {
  it.each([
    [[12, 18, 21, 29, 34, 38], "1등"],
    [[12, 18, 21, 29, 34, 10], "2등"],
    [[12, 18, 21, 29, 34, 45], "3등"],
    [[12, 18, 21, 29, 44, 45], "4등"],
    [[12, 18, 21, 43, 44, 45], "5등"],
    [[12, 18, 42, 43, 44, 45], "낙첨"],
    [[10, 12, 18, 42, 43, 44], "낙첨"],
  ] as const)("%j → %s", (numbers, expected) => {
    expect(judgeRank([...numbers], draw).rank).toBe(expected);
  });
});
