import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "로또 플레이그라운드가 제공하는 번호 확인, 추첨, 통계 기능과 운영 원칙을 안내합니다.",
};

export default function AboutPage() {
  return (
    <div className="page page-narrow info-page">
      <header className="page-header">
        <p className="eyebrow">서비스 안내</p>
        <h1>로또 플레이그라운드</h1>
        <p className="body-color">당첨번호를 확인하고, 여러 조건을 조합해 번호를 재미있게 탐색하는 비공식 정보 서비스입니다.</p>
      </header>
      <div className="stack">
        <section className="card info-section">
          <h2>무엇을 할 수 있나요?</h2>
          <p>최신 당첨번호와 회차별 결과를 확인하고, 과거 통계와 다양한 추첨 조건을 참고해 나만의 번호 조합을 만들어 볼 수 있습니다.</p>
        </section>
        <section className="card info-section">
          <h2>운영 원칙</h2>
          <ul>
            <li>추첨과 통계는 재미와 탐색을 위한 기능으로 제공합니다.</li>
            <li>어떤 번호도 당첨을 보장하거나 확률을 높인다고 주장하지 않습니다.</li>
            <li>당첨 결과는 공식 동행복권 사이트에서 최종 확인해 주세요.</li>
          </ul>
        </section>
        <section className="card info-section">
          <h2>문의</h2>
          <p>서비스 오류나 개선 의견을 전달할 수 있는 공개 문의 채널을 준비하고 있습니다. 운영 채널이 정해지면 이 페이지에 안내하겠습니다.</p>
        </section>
      </div>
    </div>
  );
}
