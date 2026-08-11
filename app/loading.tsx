export default function Loading() {
  return (
    <div className="page page-narrow loading-page" role="status" aria-live="polite">
      <span className="sr-only">페이지를 불러오는 중입니다.</span>
      <div className="loading-line loading-eyebrow" />
      <div className="loading-line loading-title" />
      <div className="loading-line loading-copy" />
      <div className="loading-card card">
        <div className="loading-line loading-card-title" />
        <div className="loading-balls" aria-hidden="true">
          {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
        </div>
        <div className="loading-line loading-card-copy" />
      </div>
    </div>
  );
}
