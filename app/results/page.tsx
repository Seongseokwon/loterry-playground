import type { Metadata } from "next";
import { ResultsList } from "@/components/lotto/ResultsList";
import { getDraws } from "@/lib/repositories/draws";

export const metadata: Metadata = { title: "당첨번호", description: "제1회부터 최신 회차까지 실제 로또 당첨번호를 확인하세요." };

export default async function ResultsPage() {
  const draws = await getDraws();
  const latestDraw = draws[0];
  const oldestDraw = draws[draws.length - 1];
  return (
    <div className="page page-narrow">
      <header className="page-header"><p className="eyebrow">전체 {draws.length.toLocaleString("ko-KR")}개 회차</p><h1>로또 당첨번호</h1><p className="body-color">제{oldestDraw.round}회부터 제{latestDraw.round}회까지 실제 추첨 결과와 보너스 번호를 확인해 보세요. 회차를 선택하면 1등 정보와 번호 활용 기능도 이어서 볼 수 있어요.</p></header>
      <ResultsList draws={draws} />
      <section className="section content-guide">
        <h2>회차별 당첨번호 보는 방법</h2>
        <p>목록에서 회차를 선택하면 기본 당첨번호 6개, 보너스 번호, 추첨일과 1등 당첨 정보를 확인할 수 있습니다. 번호를 구매하거나 당첨 여부를 판단할 때는 반드시 공식 발표와 실제 복권을 기준으로 확인하세요.</p>
      </section>
    </div>
  );
}
