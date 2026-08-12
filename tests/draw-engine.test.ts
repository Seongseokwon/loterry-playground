import { describe, expect, it } from "vitest";
import { lottoDraws } from "@/data/draws";
import { drawNumbers, mapBirthdayDates } from "@/lib/draw-engine";
import { aggregateNumberStats, pairStats } from "@/lib/stats";
import type { DrawRequest } from "@/lib/types";

const context = { stats: aggregateNumberStats(lottoDraws), pairStats: pairStats(lottoDraws), latestDraw: lottoDraws[0], pastDraws: lottoDraws };
const base: DrawRequest = { conditions: {}, filters: { noConsecutive3: true, noPastJackpot: true, noSameTail3: false }, games: 1 };

describe("drawNumbers", () => {
  it("fixed가 excluded보다 우선하고 완화 내용을 기록한다", () => {
    const result = drawNumbers({ ...base, conditions: { fixed: [7], excluded: [7] } }, context);
    expect(result.games[0]).toContain(7);
    expect(result.relaxed?.join(" ")).toContain("우선");
  });

  it("후보가 6개 미만이면 무한 반복 없이 실패한다", () => {
    const excluded = Array.from({ length: 40 }, (_, index) => index + 1);
    const result = drawNumbers({ ...base, conditions: { excluded } }, context);
    expect(result.games).toEqual([]);
    expect(result.attempts).toBeLessThanOrEqual(5000);
  });

  it("5게임은 완전 중복되지 않는다", () => {
    const result = drawNumbers({ ...base, games: 5 }, context);
    expect(result.games).toHaveLength(5);
    expect(new Set(result.games.map((game) => game.join(","))).size).toBe(5);
  });

  it("3연속 번호 필터를 지킨다", () => {
    const result = drawNumbers(base, context);
    const game = result.games[0];
    const hasConsecutive3 = game.some((number, index) => index <= 3 && game[index + 1] === number + 1 && game[index + 2] === number + 2);
    expect(hasConsecutive3).toBe(false);
  });

  it("홀짝 비율 조건을 지킨다", () => {
    const result = drawNumbers({ ...base, conditions: { oddCount: 2 } }, context);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].filter((number) => number % 2 === 1)).toHaveLength(2);
    expect(result.appliedChips).toContain("홀짝 2:4");
  });

  it("고저 비율 조건을 지킨다", () => {
    const result = drawNumbers({ ...base, conditions: { lowCount: 4 } }, context);
    expect(result.games).toHaveLength(1);
    expect(result.games[0].filter((number) => number <= 22)).toHaveLength(4);
    expect(result.appliedChips).toContain("고저 4:2");
  });

  it("합계 구간 조건을 지킨다", () => {
    const result = drawNumbers({ ...base, conditions: { sumRange: [120, 160] } }, context);
    expect(result.games).toHaveLength(1);
    const sum = result.games[0].reduce((total, number) => total + number, 0);
    expect(sum).toBeGreaterThanOrEqual(120);
    expect(sum).toBeLessThanOrEqual(160);
    expect(result.appliedChips).toContain("합계 120~160");
  });

  it("끝수 분산 조건을 지킨다", () => {
    const result = drawNumbers({ ...base, conditions: { maxSameTail: 2 } }, context);
    expect(result.games).toHaveLength(1);
    const tails = new Map<number, number>();
    result.games[0].forEach((number) => tails.set(number % 10, (tails.get(number % 10) ?? 0) + 1));
    expect(Math.max(...tails.values())).toBeLessThanOrEqual(2);
    expect(result.appliedChips).toContain("끝수 2개 이하");
  });

  it("궁합수 기준 번호를 포함하고 조건 칩을 기록한다", () => {
    const result = drawNumbers({ ...base, conditions: { pair: { base: [7], topK: 20 } } }, context);
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toContain(7);
    expect(result.appliedChips).toContain("궁합수 · 기준 7 · 상위 20개");
  });

  it("기념일은 날짜의 일을 1~31로 매핑하고 부족분도 1~31에서 채운다", () => {
    expect(mapBirthdayDates(["2020-02-29", "2021/12/04", "invalid", "2022-02-29"])).toEqual([4, 29]);
    const result = drawNumbers({ conditions: { birthday: { dates: ["2020-02-29"] } }, filters: { noConsecutive3: false, noPastJackpot: false, noSameTail3: false }, games: 1 }, context);
    expect(result.games).toHaveLength(1);
    expect(result.games[0]).toContain(29);
    expect(result.games[0].every((number) => number <= 31)).toBe(true);
    expect(result.appliedChips).toContain("기념일 · 1개");
  });

  it("다음 패턴의 구간별 번호 개수를 지킨다", () => {
    const result = drawNumbers({ ...base, conditions: { rangePattern: [1, 2, 1, 1, 1] } }, context);
    expect(result.games).toHaveLength(1);
    const counts = [
      result.games[0].filter((number) => number <= 10).length,
      result.games[0].filter((number) => number >= 11 && number <= 20).length,
      result.games[0].filter((number) => number >= 21 && number <= 30).length,
      result.games[0].filter((number) => number >= 31 && number <= 40).length,
      result.games[0].filter((number) => number >= 41).length,
    ];
    expect(counts).toEqual([1, 2, 1, 1, 1]);
    expect(result.appliedChips).toContain("다음 패턴 · 1·2·1·1·1");
  });

  it("고급 조건 충돌 시 완화 안내를 제안한다", () => {
    const result = drawNumbers({
      ...base,
      conditions: { fixed: [1, 2, 3, 4, 5, 6], oddCount: 3, lowCount: 3, sumRange: [120, 160], maxSameTail: 1 },
    }, context);
    expect(result.games).toEqual([]);
    expect(result.relaxed).toEqual(expect.arrayContaining(["홀짝 비율 완화", "고저 비율 완화", "합계 구간 넓히기", "끝수 분산 완화"]));
  });
});
