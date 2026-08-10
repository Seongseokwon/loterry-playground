import type { Draw, LottoNumber } from "./types";

export type RankLabel = "1등" | "2등" | "3등" | "4등" | "5등" | "낙첨";

export interface RankResult { rank: RankLabel; matched: number; bonus: boolean; matchedNumbers: LottoNumber[] }

export function judgeRank(myNumbers: LottoNumber[], draw: Draw): RankResult {
  const unique = [...new Set(myNumbers)];
  if (unique.length !== 6 || unique.some((number) => !Number.isInteger(number) || number < 1 || number > 45)) throw new TypeError("내 번호는 중복 없는 1~45 정수 6개여야 합니다.");
  const matchedNumbers = unique.filter((number) => draw.numbers.includes(number)).sort((a, b) => a - b);
  const matched = matchedNumbers.length;
  const bonus = unique.includes(draw.bonus);
  let rank: RankLabel = "낙첨";
  if (matched === 6) rank = "1등";
  else if (matched === 5 && bonus) rank = "2등";
  else if (matched === 5) rank = "3등";
  else if (matched === 4) rank = "4등";
  else if (matched === 3) rank = "5등";
  return { rank, matched, bonus, matchedNumbers };
}
