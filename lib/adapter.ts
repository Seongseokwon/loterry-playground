import type { Draw, LottoNumber } from "./types";

type RawDraw = {
  round?: unknown;
  date?: unknown;
  numbers?: unknown;
  bonus?: unknown;
  totalSell?: unknown;
  firstWinAmount?: unknown;
  firstWinners?: unknown;
};

function isLottoNumber(value: unknown): value is LottoNumber {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 45;
}

export function toDraw(raw: unknown): Draw {
  if (!raw || typeof raw !== "object") throw new TypeError("회차 데이터가 객체가 아닙니다.");
  const value = raw as RawDraw;
  if (!Number.isInteger(value.round) || Number(value.round) < 1) throw new TypeError("회차 번호가 올바르지 않습니다.");
  if (typeof value.date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) throw new TypeError("추첨일이 올바르지 않습니다.");
  if (!Array.isArray(value.numbers) || value.numbers.length !== 6 || !value.numbers.every(isLottoNumber)) throw new TypeError("당첨번호는 1~45 정수 6개여야 합니다.");
  if (new Set(value.numbers).size !== 6) throw new TypeError("당첨번호에 중복이 있습니다.");
  if (!isLottoNumber(value.bonus)) throw new TypeError("보너스 번호가 올바르지 않습니다.");
  if (value.numbers.includes(value.bonus)) throw new TypeError("보너스 번호가 당첨번호와 중복됩니다.");
  const numbers = [...value.numbers].sort((a, b) => a - b) as Draw["numbers"];
  const draw: Draw = { round: Number(value.round), date: value.date, numbers, bonus: value.bonus };
  for (const key of ["totalSell", "firstWinAmount", "firstWinners"] as const) {
    if (value[key] !== undefined) {
      if (!Number.isFinite(value[key]) || Number(value[key]) < 0) throw new TypeError(`${key} 값이 올바르지 않습니다.`);
      draw[key] = Number(value[key]);
    }
  }
  return draw;
}
