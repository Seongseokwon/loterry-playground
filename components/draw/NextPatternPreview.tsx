import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export function NextPatternPreview() {
  return (
    <>
      <section className="draw-intro">
        <p className="eyebrow">번호 추첨 전략</p>
        <h1>다음 패턴 추천</h1>
        <p className="body-color">현재 구간 패턴 다음에 자주 이어진 조합을 살펴보는 방식이에요.</p>
      </section>

      <section className="section card next-pattern-preview">
        <img className="next-pattern-preview-icon" src="/icons/preset-next-pattern.png" alt="" aria-hidden="true" />
        <Badge tone="weak">준비 중</Badge>
        <h2>패턴의 흐름을 연구하고 있어요</h2>
        <p className="body-color">과거 회차의 구간 패턴과 다음 회차 패턴을 연결해, 여러 추천 전략 중 하나로 보여드릴 예정이에요.</p>
        <div className="next-pattern-example" aria-label="구간 패턴 예시">
          <span>1·1·2·1·1</span><strong aria-hidden="true">→</strong><span className="next-pattern-example-highlight">다음 패턴</span>
        </div>
        <p className="body-small">추천 결과는 당첨을 예측하지 않으며, 알고리즘 기준을 정한 뒤 제공할게요.</p>
        <Link className="product-button product-weak" href="/draw">다른 방식으로 번호 뽑기</Link>
      </section>
    </>
  );
}
