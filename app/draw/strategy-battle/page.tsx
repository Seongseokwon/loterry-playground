import type { Metadata } from "next";
import { StrategyBattle } from "@/components/draw/StrategyBattle";

export const metadata: Metadata = {
  title: "전략 대결 번호 추첨",
  description: "완전 랜덤, 핫넘버, 미출현, 반전 픽 번호 조합을 한 번에 비교해 보세요.",
};

export default function StrategyBattlePage() {
  return <div className="page page-narrow"><StrategyBattle /></div>;
}
