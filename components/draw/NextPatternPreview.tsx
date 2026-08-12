import { Badge } from "@/components/ui/Badge";
import { ProductButton } from "@/components/ui/Button";
import { lottoDraws } from "@/data/draws";
import { analyzeNextPatterns, formatPattern, NEXT_PATTERN_WINDOW } from "@/lib/next-pattern";

export function NextPatternPreview() {
  const analysis = analyzeNextPatterns(lottoDraws);
  const first = analysis.candidates[0];
  const second = analysis.candidates[1];

  return (
    <>
      <section className="draw-intro">
        <p className="eyebrow">번호 추첨 전략</p>
        <h1>다음 패턴 추천</h1>
        <p className="body-color">현재 구간 패턴 다음에 자주 이어진 조합을 살펴보는 방식이에요.</p>
      </section>

      <section className="section card next-pattern-preview">
        <img className="next-pattern-preview-icon" src="/icons/preset-next-pattern.png" alt="" aria-hidden="true" />
        <Badge tone="weak">최근 {NEXT_PATTERN_WINDOW}회 분석</Badge>
        <h2>다음에 이어질 구간 패턴</h2>
        <p className="body-color">현재 패턴과 같았던 과거 회차 다음에 어떤 패턴이 나왔는지 살펴봐요.</p>
        <div className="next-pattern-current">
          <span className="body-small">현재 패턴</span>
          <strong>{formatPattern(analysis.currentPattern)}</strong>
        </div>
        {second ? (
          <div className="next-pattern-result-grid">
            <div className="next-pattern-locked" aria-label="1위 패턴은 광고 시청 후 확인할 수 있어요">
              <span className="body-small">1위 패턴</span>
              <strong aria-hidden="true">•••••••••</strong>
              <small>광고 시청 후 확인</small>
              <ProductButton size="small" tone="weak" disabled>광고 보고 1위 확인</ProductButton>
            </div>
            <div className="next-pattern-second">
              <span className="body-small">2위 패턴</span>
              <strong>{formatPattern(second.pattern)}</strong>
              <small>전이 {second.transitionCount}회 · 일치 회차 {analysis.matchingRounds}회</small>
            </div>
          </div>
        ) : (
          <div className="next-pattern-empty">
            <strong>{first ? "추천 패턴을 더 모으는 중이에요" : "아직 추천할 패턴이 없어요"}</strong>
            <p className="body-small">현재 패턴과 일치한 과거 회차가 충분하지 않아 2위 패턴을 보여드리기 어려워요.</p>
          </div>
        )}
        <p className="body-small">추천 기준: 최근 {analysis.analyzedRounds}회 · 동일 패턴 {analysis.matchingRounds}회 · 바로 다음 회차 전이</p>
        <p className="body-small">추천 결과는 당첨을 예측하지 않으며, 과거 패턴을 살펴보는 참고용 기능이에요.</p>
      </section>
    </>
  );
}
