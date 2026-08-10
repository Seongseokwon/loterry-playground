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
    const row = Math.floor(index / 9);
    const col = index % 9;
    let next = index;
    if (key === "ArrowRight") next = row * 9 + ((col + 1) % 9);
    if (key === "ArrowLeft") next = row * 9 + ((col + 8) % 9);
    if (key === "ArrowDown") next = ((row + 1) % 5) * 9 + col;
    if (key === "ArrowUp") next = ((row + 4) % 5) * 9 + col;
    refs.current[next]?.focus();
  };
  return (
    <div className="number-grid" role="grid" aria-label="1부터 45까지 번호 선택">
      {Array.from({ length: 45 }, (_, index) => index + 1).map((number, index) => {
        const state = stateFor(number);
        const isSelected = state === "selected" || state === "fixed";
        const atLimit = maxSelected !== undefined && selected.length >= maxSelected && !isSelected;
        return (
          <button
            key={number}
            ref={(node) => { refs.current[index] = node; }}
            type="button"
            role="gridcell"
            className={`number-cell number-${state}`}
            aria-selected={isSelected}
            aria-label={`${number}번, ${state === "fixed" ? "고정" : state === "excluded" ? "제외" : isSelected ? "선택됨" : "선택 안 됨"}`}
            disabled={state === "disabled" || atLimit}
            onClick={() => onToggle(number)}
            onKeyDown={(event) => {
              if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); moveFocus(index, event.key); }
              if (event.key === " ") { event.preventDefault(); onToggle(number); }
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
