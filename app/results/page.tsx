import type { Metadata } from "next";
import { ResultsList } from "@/components/lotto/ResultsList";
import { latestDraw, lottoDraws, oldestDraw } from "@/data/draws";

export const metadata: Metadata = { title: "당첨번호", description: "제1회부터 최신 회차까지 실제 로또 당첨번호를 확인하세요." };

export default function ResultsPage() {
  return (
    <div className="page page-narrow">
      <header className="page-header"><p className="eyebrow">전체 {lottoDraws.length.toLocaleString("ko-KR")}개 회차</p><h1>당첨번호</h1><p className="body-color">제{oldestDraw.round}회부터 제{latestDraw.round}회까지 실제 추첨 결과를 보여드려요.</p></header>
      <ResultsList />
    </div>
  );
}
