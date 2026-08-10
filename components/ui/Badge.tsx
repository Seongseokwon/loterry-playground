import type { ReactNode } from "react";

export function Badge({ children, tone = "weak" }: { children: ReactNode; tone?: "fill" | "weak" | "neutral" | "danger" }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}
