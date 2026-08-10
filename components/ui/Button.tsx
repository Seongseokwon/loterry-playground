"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type ProductButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: "small" | "medium" | "large" | "xlarge";
  tone?: "primary" | "weak" | "danger";
  loading?: boolean;
  children: ReactNode;
};

export function ProductButton({ size = "xlarge", tone = "primary", loading = false, disabled, children, className = "", ...props }: ProductButtonProps) {
  return (
    <button className={`product-button product-${size} product-${tone} ${className}`} disabled={disabled || loading} aria-busy={loading} {...props}>
      <span className="button-content" aria-hidden={loading}>{children}</span>
      {loading && <span className="button-loading"><span className="spinner" aria-hidden="true" /><span>처리 중</span></span>}
    </button>
  );
}

type MarketingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "weak" | "dark"; children: ReactNode };

export function MarketingButton({ variant = "weak", children, className = "", ...props }: MarketingButtonProps) {
  return <button className={`marketing-button marketing-${variant} ${className}`} {...props}>{children}</button>;
}
