import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "데이터 출처",
  description: "로또 플레이그라운드가 당첨번호와 통계 데이터를 수집하고 검증하는 방법을 안내합니다.",
};

export default function DataSourcePage() {
  return (
    <div className="page page-narrow info-page">
      <header className="page-header">
        <p className="eyebrow">데이터 안내</p>
        <h1>데이터 출처와 갱신</h1>
        <p className="body-color">회차 결과는 공개된 동행복권 데이터를 바탕으로 제공하며, 서비스 내부 검증을 거쳐 표시합니다.</p>
      </header>
      <div className="stack">
        <section className="card info-section">
          <h2>수집 데이터</h2>
          <p>회차 번호, 추첨일, 당첨번호, 보너스 번호, 1등 당첨 정보와 판매금액을 사용합니다. 수집 데이터는 회차 누락·중복·번호 범위·보너스 중복 여부를 확인한 뒤 저장합니다.</p>
        </section>
        <section className="card info-section">
          <h2>공식 확인</h2>
          <p>서비스 화면은 편리한 탐색을 위한 보조 정보입니다. 당첨 여부와 실제 구매 티켓은 <a className="text-link" href="https://www.dhlottery.co.kr/" target="_blank" rel="noreferrer">동행복권 공식 사이트 ↗</a>에서 확인해 주세요.</p>
        </section>
        <section className="card card-weak info-section">
          <h2>관련 기능</h2>
          <div className="status-actions">
            <Link className="product-button product-primary" href="/results">전체 당첨번호 보기</Link>
            <Link className="product-button product-weak" href="/stats">번호 통계 보기</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
