import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "이용 안내", description: "로또 플레이그라운드의 기능과 이용 시 참고 사항을 안내합니다.", alternates: { canonical: "/terms" } };
export default function TermsPage() {
  return <div className="page page-narrow info-page">
    <header className="page-header"><p className="eyebrow">서비스 안내</p><h1>이용 안내</h1><p className="body-color">로또 플레이그라운드를 이용하기 전에 확인해 주세요.</p></header>
    <div className="stack">
      <section className="card info-section"><h2>서비스의 성격</h2><p>이 서비스는 당첨번호 조회와 번호 조합 탐색을 돕는 비공식 정보 서비스입니다. 번호 추천과 통계는 재미를 위한 것이며 당첨을 예측하거나 확률을 높이지 않습니다.</p></section>
      <section className="card info-section"><h2>당첨 여부 확인</h2><p>당첨 여부와 지급 조건은 구매한 복권과 동행복권의 공식 발표를 기준으로 확인해 주세요. 데이터 갱신이 지연될 수 있습니다.</p></section>
      <section className="card info-section"><h2>저장한 번호</h2><p>보관함은 현재 브라우저에 저장됩니다. 기기나 브라우저를 바꾸거나 저장소를 삭제하기 전에 백업 파일을 내려받아 주세요.</p></section>
      <section className="card info-section"><h2>개인정보와 문의</h2><p>저장 및 분석에 관한 내용은 <Link href="/privacy" className="text-link">개인정보 안내</Link>에서 확인하세요. 공개 문의 채널은 준비 중입니다.</p></section>
    </div>
  </div>;
}
