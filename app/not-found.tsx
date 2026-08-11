export default function NotFound() {
  return (
    <div className="page page-narrow status-page">
      <div className="status-mark" aria-hidden="true">404</div>
      <div className="status-copy">
        <p className="eyebrow">페이지를 찾을 수 없어요</p>
        <h1>번호가 살짝 빗나갔네요</h1>
        <p className="body-color">주소가 바뀌었거나 존재하지 않는 페이지예요. 홈에서 다시 시작해 주세요.</p>
      </div>
      <div className="status-actions">
        <a className="product-button product-large product-primary" href="/">홈으로 돌아가기</a>
        <a className="product-button product-large product-weak" href="/results">당첨번호 보기</a>
      </div>
    </div>
  );
}
