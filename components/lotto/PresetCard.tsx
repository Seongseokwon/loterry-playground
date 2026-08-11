import Link from "next/link";

export function PresetCard({ href, icon, title, description, active = false }: { href: string; icon: string; title: string; description: string; active?: boolean }) {
  return (
    <Link className={`preset-card ${active ? "preset-active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
      <span className="preset-icon" aria-hidden="true"><span className="preset-illustration" style={{ backgroundImage: `url(/icons/preset-${icon}.png)` }} /></span>
      <strong>{title}</strong>
      <small>{description}</small>
    </Link>
  );
}
