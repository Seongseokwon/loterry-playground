"use client";

import type { ReactNode } from "react";

export function ResultSheet({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="result-sheet" role="dialog" aria-modal="true" aria-labelledby="result-sheet-title">
        <span className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h3 id="result-sheet-title">{title}</h3>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">×</button>
        </div>
        {children}
      </section>
    </div>
  );
}
