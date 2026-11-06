"use client";

import { useRef } from "react";

export type NumberState = "default" | "selected" | "fixed" | "excluded" | "disabled";

export function NumberGrid({ selected = [], fixed = [], excluded = [], disabled = [], onToggle, maxSelected }: {
  selected?: number[];
  fixed?: number[];
  excluded?: number[];
  disabled?: number[];
  onToggle: (number: number) => void;
  maxSelected?: number;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const stateFor = (number: number): NumberState => disabled.includes(number) ? "disabled" : fixed.includes(number) ? "fixed" : excluded.includes(number) ? "excluded" : selected.includes(number) ? "selected" : "default";
  const moveFocus = (index: number, key: string) => {
    const columns = window.matchMedia("(max-width: 767px)").matches ? 5 : 9;
    const rows = 45 / columns;
    const row = Math.floor(index / columns);
    const col = index % columns;
    let next = index;
    if (key === "ArrowRight") next = row * columns + ((col + 1) % columns);
    if (key === "ArrowLeft") next = row * columns + ((col + columns - 1) % columns);
    if (key === "ArrowDown") next = ((row + 1) % rows) * columns + col;
    if (key === "ArrowUp") next = ((row + rows - 1) % rows) * columns + col;
    const direction = key === "ArrowLeft" || key === "ArrowUp" ? -1 : 1;
    let attempts = 0;
    while (refs.current[next]?.disabled && attempts < 45) { next = (next + direction + 45) % 45; attempts += 1; }
    refs.current[next]?.focus();
  };
  return (
    <div className="number-grid" role="group" aria-label="1부터 45까지 번호 선택">
      {Array.from({ length: 45 }, (_, index) => index + 1).map((number, index) => {
        const state = stateFor(number);
        const isSelected = state === "selected" || state === "fixed";
        const atLimit = maxSelected !== undefined && selected.length >= maxSelected && !isSelected;
        return (
          <button
            key={number}
            ref={(node) => { refs.current[index] = node; }}
            type="button"
            className={`number-cell number-${state}`}
            aria-pressed={isSelected}
            aria-label={`${number}번, ${state === "fixed" ? "고정" : state === "excluded" ? "제외" : isSelected ? "선택됨" : "선택 안 됨"}`}
            disabled={state === "disabled" || atLimit}
            onClick={() => onToggle(number)}
            onKeyDown={(event) => {
              if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); moveFocus(index, event.key); }
            }}
          >
            {number}
            {state === "fixed" && <span className="cell-check" aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
