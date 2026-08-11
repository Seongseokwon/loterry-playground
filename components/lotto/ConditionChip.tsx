"use client";

export function ConditionChip({ icon, label, value, checked, onChange }: { icon?: string; label: string; value?: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} className={`condition-chip ${checked ? "condition-on" : ""}`} onClick={() => onChange(!checked)}>
      {icon && <img className="condition-icon" src={`/icons/condition-${icon}.png`} alt="" aria-hidden="true" />}
      <span>{checked ? "✓ " : ""}{label}</span>
      {checked && value && <small>{value}</small>}
    </button>
  );
}
