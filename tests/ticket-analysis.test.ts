import { describe, expect, it } from "vitest";
import { analyzeTicketNumbers } from "@/lib/ticket-analysis";
import { parseTicketPayload } from "@/components/check/TicketScanner";

describe("analyzeTicketNumbers", () => {
  it("번호 조합의 형태와 주요 지표를 계산한다", () => {
    const result = analyzeTicketNumbers([3, 8, 14, 22, 35, 41]);

    expect(result).not.toBeNull();
    expect(result?.oddCount).toBe(3);
    expect(result?.evenCount).toBe(3);
    expect(result?.lowCount).toBe(4);
    expect(result?.highCount).toBe(2);
    expect(result?.birthdayCount).toBe(4);
    expect(result?.sum).toBe(123);
    expect(result?.span).toBe(38);
    expect(result?.consecutivePairs).toBe(0);
  });

  it("생일 번호 집중과 연속 번호 패턴을 표시한다", () => {
    const result = analyzeTicketNumbers([1, 2, 3, 11, 21, 31]);

    expect(result?.birthdayCount).toBe(6);
    expect(result?.consecutivePairs).toBe(2);
    expect(result?.labels).toContain("생일 번호 집중형");
    expect(result?.labels).toContain("연속 번호 모험형");
  });

  it("유효하지 않은 조합은 분석하지 않는다", () => {
    expect(analyzeTicketNumbers([1, 2, 3, 4, 5])).toBeNull();
    expect(analyzeTicketNumbers([1, 2, 3, 4, 5, 46])).toBeNull();
    expect(analyzeTicketNumbers([1, 1, 2, 3, 4, 5])).toBeNull();
  });

  it("QR payload는 명시적인 번호 형식만 파싱한다", () => {
    expect(parseTicketPayload('{"round":1244,"numbers":[3,8,14,22,35,41]}')).toEqual({ round: 1244, numbers: [3, 8, 14, 22, 35, 41] });
    expect(parseTicketPayload("numbers=3,8,14,22,35,41")).toEqual({ numbers: [3, 8, 14, 22, 35, 41] });
    expect(parseTicketPayload("https://example.test/ticket?round=1244&numbers=3,8,14,22,35,41")).toEqual({ round: 1244, numbers: [3, 8, 14, 22, 35, 41] });
    expect(parseTicketPayload("round 1244 game 3 8 14 22 35 41")).toBeNull();
    expect(parseTicketPayload("https://example.test/ticket?id=1244-3-8-14-22-35-41")).toBeNull();
  });
});
