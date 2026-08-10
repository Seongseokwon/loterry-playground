import type { Draw } from "@/lib/types";
import { LottoBall } from "./LottoBall";

export function BallRow({ draw, size = "md", matched = [] }: { draw: Pick<Draw, "numbers" | "bonus">; size?: "sm" | "md" | "lg"; matched?: number[] }) {
  return (
    <div className="numbers">
      {draw.numbers.map((number, index) => <LottoBall key={number} number={number} size={size} delay={index * 90} matched={matched.includes(number)} />)}
      <span className="plus" aria-label="보너스 번호">+</span>
      <LottoBall number={draw.bonus} size={size} delay={540} matched={matched.includes(draw.bonus)} />
    </div>
  );
}
