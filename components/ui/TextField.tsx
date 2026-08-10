import type { InputHTMLAttributes } from "react";

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  variant?: "box" | "line";
  helpText?: string;
  error?: string;
};

export function TextField({ label, variant = "box", helpText, error, id, className = "", ...props }: TextFieldProps) {
  const inputId = id ?? `field-${label.replace(/\s/g, "-")}`;
  const descriptionId = `${inputId}-description`;
  return (
    <label className={`text-field text-field-${variant} ${error ? "text-field-error" : ""} ${className}`} htmlFor={inputId}>
      <span>{label}</span>
      <input id={inputId} aria-invalid={Boolean(error)} aria-describedby={(error || helpText) ? descriptionId : undefined} {...props} />
      {(error || helpText) && <small id={descriptionId}>{error ?? helpText}</small>}
    </label>
  );
}
