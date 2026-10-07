import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문의",
  description: "로또 플레이그라운드 오류 신고와 개선 의견 안내입니다.",
};

export default function ContactPage() {
  return (
    <div className="page page-narrow info-page">
      <header className="page-header">
        <p className="eyebrow">문의 안내</p>
        <h1>의견을 보내고 싶다면</h1>
        <p className="body-color">서비스 오류와 개선 의견을 안전하게 전달할 수 있는 공식 문의 채널을 준비하고 있습니다.</p>
      </header>
      <section className="card info-section">
        <h2>현재 안내</h2>
        <p>공개 문의 주소가 확정되기 전까지는 개인정보나 복권 구매 정보가 포함된 내용을 웹페이지에 입력하지 말아 주세요. 문의 채널이 준비되면 이 페이지에 목적과 보관 기간을 함께 안내하겠습니다.</p>
      </section>
    </div>
  );
}
