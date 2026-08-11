import { BallRow } from "@/components/lotto/BallRow";
import { LottoBall } from "@/components/lotto/LottoBall";
import { Badge } from "@/components/ui/Badge";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats } from "@/lib/stats";
import { formatKoreanDate, formatWon } from "@/lib/format";

export default function Home() {
  const latest = lottoDraws[0];
  const stats = aggregateNumberStats(lottoDraws);
  const hot = [...stats].sort((a, b) => b.countRecent10 - a.countRecent10).slice(0, 3);
  const cold = [...stats].sort((a, b) => b.gap - a.gap).slice(0, 3);
  return (
    <div className="page home-page">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">{formatKoreanDate(latest.date)}</p>
          <h1>제{latest.round}회<br />당첨번호가 나왔어요</h1>
          <p className="body-color">번호를 확인하고 다음 주 조합도 가볍게 골라보세요.</p>
        </div>
        <div className="hero-result card">
          <BallRow draw={latest} size="lg" />
          <hr className="divider" />
          <dl className="hero-kv">
            <div><dt>1등 당첨자</dt><dd>{latest.firstWinners}명</dd></div>
            <div><dt>1인당 당첨금</dt><dd>{formatWon(latest.firstWinAmount)}</dd></div>
          </dl>
          <a className="text-link" href={`/results/${latest.round}`}>회차 자세히 보기 →</a>
        </div>
      </section>

      <section className="quick-grid section">
        <a href="/check" className="quick-card card card-weak">
          <Badge tone="fill">빠른 확인</Badge>
          <h3>내 번호는 몇 개 맞았을까요?</h3>
          <p>번호 6개만 고르면 바로 등수를 확인해요.</p>
          <span>내 번호 확인하기 →</span>
        </a>
        <a href="/draw" className="quick-card card">
          <img className="quick-icon illustration-image" src="/icons/preset-random.png" alt="" aria-hidden="true" />
          <h3>다음 회차 번호 뽑기</h3>
          <p>조건 없이 시작하고, 원할 때만 조건을 더해요.</p>
          <span>번호 골라보기 →</span>
        </a>
      </section>

      <section className="section">
        <div className="section-head"><h2>이번 주 하이라이트</h2><a className="text-link" href="/stats">전체 통계 →</a></div>
        <div className="highlight-grid">
          <div className="card"><div className="highlight-title"><img className="highlight-illustration" src="/icons/preset-hot.png" alt="" aria-hidden="true" /><div><h3>최근 자주 나온 번호</h3><p className="body-small">최근 10회 출현 횟수</p></div></div><div className="highlight-numbers">{hot.map((stat) => <div key={stat.number}><LottoBall number={stat.number} /><strong>{stat.countRecent10}회</strong></div>)}</div></div>
          <div className="card"><div className="highlight-title"><img className="highlight-illustration" src="/icons/preset-cold.png" alt="" aria-hidden="true" /><div><h3>오래 쉬고 있는 번호</h3><p className="body-small">최신 회차 기준</p></div></div><div className="highlight-numbers">{cold.map((stat) => <div key={stat.number}><LottoBall number={stat.number} /><strong>{stat.gap}회</strong></div>)}</div></div>
        </div>
      </section>
    </div>
  );
}
