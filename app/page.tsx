import Link from "next/link";
import Image from "next/image";
import { BallRow } from "@/components/lotto/BallRow";
import { LottoBall } from "@/components/lotto/LottoBall";
import { SavedResultNotice } from "@/components/home/SavedResultNotice";
import { lottoDraws } from "@/data/draws";
import { aggregateNumberStats } from "@/lib/stats";
import { formatKoreanDate, formatWon } from "@/lib/format";

const ranges = [[1, 10], [11, 20], [21, 30], [31, 40], [41, 45]] as const;

export default function Home() {
  const latest = lottoDraws[0];
  const stats = aggregateNumberStats(lottoDraws);
  const hot = [...stats].sort((a, b) => b.countRecent10 - a.countRecent10 || a.number - b.number).slice(0, 5);
  const recent = lottoDraws.slice(0, 10);
  const distribution = ranges.map(([min, max]) => ({ label: `${min}–${max}`, count: recent.reduce((sum, draw) => sum + draw.numbers.filter((n) => n >= min && n <= max).length, 0) }));
  const maxCount = Math.max(...distribution.map((item) => item.count));
  return <div className="page dashboard-home">
    <div className="dashboard-heading"><div><p className="dashboard-kicker">당첨번호부터 나만의 조합까지</p><h1>이번 주, 로또를 살펴볼까요?</h1><p>최신 결과와 흥미로운 숫자를 한눈에 확인해요.</p></div><Link className="dashboard-primary" href="/draw">번호 추첨하기 <span aria-hidden="true">↗</span></Link></div>
    <div className="dashboard-overview">
      <section className="dashboard-result" aria-labelledby="latest-title"><div className="dashboard-card-head"><div><span className="dashboard-pill"><span /> 최신 당첨 결과</span><h2 id="latest-title">제 {latest.round.toLocaleString("ko-KR")}회 당첨번호</h2><p>{formatKoreanDate(latest.date)} 추첨</p></div><Link href={`/results/${latest.round}`} className="dashboard-circle-link" aria-label={`${latest.round}회 당첨 결과 자세히 보기`}>↗</Link></div>
        <div className="dashboard-winning"><BallRow draw={latest} size="lg" /></div>
        <div className="dashboard-prize"><div><span>1등 당첨자</span><strong>{latest.firstWinners?.toLocaleString("ko-KR")}명</strong></div><div><span>1인당 당첨금</span><strong>{formatWon(latest.firstWinAmount)}</strong></div><Link href="/check">내 번호 확인 <span aria-hidden="true">↗</span></Link></div>
      </section>
      <aside className="dashboard-actions"><div className="dashboard-action-top"><span className="dashboard-action-icon" aria-hidden="true"><Image src="/icons/preset-random.png" alt="" width={32} height={32} /></span><span>나만의 번호</span></div><div><h2>어떤 번호를<br />골라볼까요?</h2><p>원하는 조건을 조합해<br />나만의 번호를 만들어 보세요.</p></div><Link href="/draw">번호 만들기 <span aria-hidden="true">↗</span></Link></aside>
    </div>
    <SavedResultNotice />
    <section className="dashboard-insights"><div className="dashboard-section-head"><div><h2>숫자로 보는 최근 회차</h2><p>최근 10회 당첨번호 기준이에요.</p></div><Link href="/stats">통계 자세히 보기 <span aria-hidden="true">↗</span></Link></div>
      <div className="dashboard-insight-grid"><article className="dashboard-panel dashboard-distribution"><div className="dashboard-panel-head"><div><h3>번호 구간별 출현</h3><p>최근 10회 · 본번호 60개</p></div><span className="dashboard-tag">10회 기준</span></div><div className="dashboard-bars">{distribution.map((item) => <div className="dashboard-bar-row" key={item.label}><span>{item.label}</span><div className="dashboard-bar-track"><div style={{ width: `${item.count / maxCount * 100}%` }} /></div><strong>{item.count}<small>회</small></strong></div>)}</div><Link href="/draw/pattern-lab" className="dashboard-panel-link">구간 패턴 연구하기 <span aria-hidden="true">↗</span></Link></article>
      <article className="dashboard-panel dashboard-hot"><div className="dashboard-panel-head"><div><h3>최근 자주 나온 번호</h3><p>최근 10회 출현 횟수</p></div><span className="dashboard-symbol" aria-hidden="true">✦</span></div><div className="dashboard-hot-list">{hot.map((item, i) => <div key={item.number}><span className="dashboard-rank">{i + 1}</span><LottoBall number={item.number} size="sm" /><span className="dashboard-hot-label">{item.number}번</span><strong>{item.countRecent10}회</strong></div>)}</div><Link href="/draw/hot" className="dashboard-panel-link">핫넘버로 추첨하기 <span aria-hidden="true">↗</span></Link></article></div>
    </section>
    <section className="dashboard-shortcuts" aria-label="주요 기능"><Link href="/results"><span className="shortcut-icon" aria-hidden="true"><Image src="/icons/footer-trophy.png" alt="" width={32} height={32} /></span><span><strong>지난 당첨번호</strong><small>회차별 결과를 살펴봐요</small></span><b aria-hidden="true">↗</b></Link><Link href="/archive"><span className="shortcut-icon" aria-hidden="true"><Image src="/icons/footer-ticket.png" alt="" width={32} height={32} /></span><span><strong>내 번호 보관함</strong><small>저장한 번호를 확인해요</small></span><b aria-hidden="true">↗</b></Link><Link href="/draw/pattern-lab"><span className="shortcut-icon" aria-hidden="true"><Image src="/icons/preset-next-pattern.png" alt="" width={32} height={32} /></span><span><strong>패턴 연구실</strong><small>숫자의 흐름을 실험해요</small></span><b aria-hidden="true">↗</b></Link></section>
  </div>;
}
