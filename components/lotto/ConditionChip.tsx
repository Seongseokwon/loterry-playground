"use client";

export function ConditionChip({ label, value, checked, onChange }: { label: string; value?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={`condition-chip ${checked ? "condition-on" : ""}`} onClick={() => onChange(!checked)}>
      <span>{checked ? "✓ " : ""}{label}</span>
      {checked && value && <small>{value}</small>}
    </button>
  );
}
