export function PresetCard({ href, icon, title, description, active = false }: { href: string; icon: string; title: string; description: string; active?: boolean }) {
  return (
    <a className={`preset-card ${active ? "preset-active" : ""}`} href={href} aria-current={active ? "page" : undefined}>
      <span className="preset-icon" aria-hidden="true"><img className="preset-illustration" src={`/icons/preset-${icon}.png`} alt="" /></span>
      <strong>{title}</strong>
      <small>{description}</small>
    </a>
  );
}
