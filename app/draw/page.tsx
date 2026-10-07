import type { Metadata } from "next";
import { DrawBuilder } from "@/components/draw/DrawBuilder";

export const metadata: Metadata = { title: "번호 추첨", description: "조건을 조합하거나 완전 랜덤으로 로또 번호를 골라보세요." };

export default function DrawPage() {
  return (
    <div className="page page-narrow">
      <DrawBuilder />
      <section className="section content-guide">
        <h2>로또 번호 추첨 이용 안내</h2>
        <p>완전 랜덤부터 핫넘버·미출현 번호·고정 번호·다음 패턴까지 원하는 조건을 조합해 번호를 만들어 볼 수 있습니다. 통계 조건은 번호 선택을 돕는 참고 기능이며 실제 당첨을 예측하거나 보장하지 않습니다.</p>
        <div className="faq-list">
          <details>
            <summary>번호를 6개보다 많이 선택하면 어떻게 되나요?</summary>
            <p>6개까지는 반드시 포함할 번호로 사용하고, 7개 이상 선택하면 선택한 번호들 중에서 조합을 만드는 후보 풀로 처리합니다. 추첨 결과는 마지막 조합을 중심으로 보여주며 반복 추첨 요약도 제공합니다.</p>
          </details>
          <details>
            <summary>많은 횟수를 입력하면 결과를 모두 보여주나요?</summary>
            <p>반복 추첨은 화면 렌더링 부담을 줄이기 위해 마지막에 생성된 조합과 요약 정보만 보여줍니다. 큰 횟수에서는 진행률과 경과 시간을 함께 안내합니다.</p>
          </details>
        </div>
      </section>
    </div>
  );
}
