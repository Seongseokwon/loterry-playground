import { describe, expect, it } from "vitest";
import { toDraw } from "@/lib/adapter";

const valid = { round: 1, date: "2026-01-03", numbers: [6, 5, 4, 3, 2, 1], bonus: 7 };

describe("toDraw", () => {
  it("당첨번호를 오름차순으로 정규화한다", () => expect(toDraw(valid).numbers).toEqual([1, 2, 3, 4, 5, 6]));
  it("중복 번호를 거부한다", () => expect(() => toDraw({ ...valid, numbers: [1, 1, 2, 3, 4, 5] })).toThrow());
  it("범위 밖 번호를 거부한다", () => expect(() => toDraw({ ...valid, numbers: [0, 1, 2, 3, 4, 5] })).toThrow());
  it("보너스 중복을 거부한다", () => expect(() => toDraw({ ...valid, bonus: 1 })).toThrow());
});
