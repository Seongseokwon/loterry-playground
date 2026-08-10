"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

export function Agreement({ children, ...props }: InputHTMLAttributes<HTMLInputElement> & { children: ReactNode }) {
  return (
    <label className={`agreement ${props.disabled ? "agreement-disabled" : ""}`}>
      <input type="checkbox" {...props} />
      <span className="agreement-box" aria-hidden="true">✓</span>
      <span>{children}</span>
    </label>
  );
}
