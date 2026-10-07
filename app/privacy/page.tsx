import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보 안내",
  description: "로또 플레이그라운드의 브라우저 저장, 분석 이벤트, 개인정보 처리 원칙을 안내합니다.",
};

export default function PrivacyPage() {
  return (
    <div className="page page-narrow info-page">
      <header className="page-header">
        <p className="eyebrow">개인정보 안내</p>
        <h1>개인정보를 어떻게 다루나요?</h1>
        <p className="body-color">현재 서비스의 저장과 분석 범위를 쉽게 확인할 수 있도록 안내합니다.</p>
      </header>
      <div className="stack">
        <section className="card info-section">
          <h2>브라우저에 저장되는 정보</h2>
          <p>사용자가 저장한 번호와 보관함 데이터는 기본적으로 현재 브라우저의 IndexedDB에 저장됩니다. 서버 계정이나 동기화 기능은 사용하지 않습니다.</p>
        </section>
        <section className="card info-section">
          <h2>분석 이벤트</h2>
          <p>추첨 시작·완료, 번호 저장, 결과 확인, 공유, 용지 촬영 시작·완료·인식 결과와 같은 서비스 사용 이벤트는 Google Analytics 4가 설정된 운영 환경에서 전송될 수 있습니다. 원본 사진, QR 원문, 선택한 번호 자체는 분석 이벤트에 포함하지 않습니다.</p>
        </section>
        <section className="card card-weak info-section">
          <h2>주의할 점</h2>
          <p>브라우저 저장소를 삭제하거나 다른 브라우저를 사용하면 보관함 번호를 확인할 수 없습니다. 필요한 경우 보관함 백업 기능으로 JSON 파일을 내려받아 보관해 주세요.</p>
        </section>
      </div>
    </div>
  );
}
