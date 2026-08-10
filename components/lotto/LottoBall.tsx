import type { CSSProperties } from "react";

export function LottoBall({ number, size = "md", delay = 0, matched = false }: { number: number; size?: "sm" | "md" | "lg"; delay?: number; matched?: boolean }) {
  const range = number <= 10 ? "yellow" : number <= 20 ? "blue" : number <= 30 ? "red" : number <= 40 ? "gray" : "green";
  return (
    <span className={`lotto-ball ball-${size} ball-${range} ${matched ? "ball-matched" : ""}`} style={{ "--ball-delay": `${delay}ms` } as CSSProperties} aria-label={`${number}번${matched ? ", 일치" : ""}`}>
      {number}
    </span>
  );
}
