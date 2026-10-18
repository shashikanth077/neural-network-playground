import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useThemeToggle } from "../hooks/useTheme";
import { DOMAINS } from "../labs/domains";
import { SHEETS } from "../cheatsheets/registry";
import { LABS } from "../labs/registry";
import { TOOLS } from "../lib/features";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <g stroke="#fff" strokeOpacity=".55" strokeWidth="1.4">
        <path d="M8 10l8 6M8 10l8-6M8 22l8-6M8 22l8 6M16 16h8M16 6l8 10M16 26l8-10" />
      </g>
      <g fill="#fff">
        <circle cx="8" cy="10" r="2.4" /><circle cx="8" cy="22" r="2.4" />
        <circle cx="16" cy="16" r="2.6" /><circle cx="16" cy="6" r="2" /><circle cx="16" cy="26" r="2" />
        <circle cx="24" cy="16" r="2.6" />
      </g>
    </svg>
  );
}

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-raised text-ink" : "text-muted hover:text-ink"}`;

/** Disclosure menu: closes on outside click, Escape and route change. */
function NavMenu({ label, id, prefix, children }: { label: string; id: string; prefix: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const active = pathname.startsWith(prefix);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="sm:relative">
      <button
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${active || open ? "bg-raised text-ink" : "text-muted hover:text-ink"}`}
      >
        {label} <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <div id={id} className="absolute left-4 right-4 top-full z-40 mt-2 max-h-[80vh] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-card sm:left-auto sm:right-0 sm:top-auto sm:w-[23rem]">
          {children}
        </div>
      )}
    </div>
  );
}

function MenuRow({ badge, title, meta, to }: { badge: string; title: string; meta: string; to?: string }) {
  const inner = (
    <>
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 font-mono text-sm font-bold text-brand">{badge}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{title}</span>
        <span className="block text-xs text-muted">{meta}</span>
      </span>
    </>
  );
  return to ? (
    <Link to={to} className="flex items-center gap-3 rounded-xl p-2 hover:bg-raised">{inner}</Link>
  ) : (
    <div className="flex items-center gap-3 rounded-xl p-2 opacity-60" aria-disabled="true">{inner}</div>
  );
}

const DomainHeading = ({ glyph, name, text }: { glyph: string; name: string; text: string }) => (
  <p className={`mt-1 flex items-center gap-1.5 px-2 pt-2 text-[11px] font-semibold uppercase tracking-wider ${text}`}>
    <span aria-hidden>{glyph}</span>{name}
  </p>
);

export function NavBar() {
  const { dark, toggle } = useThemeToggle();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <Logo />
          <span className="hidden sm:inline">AI Lab</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <NavLink to="/" end className={linkCls}>Home</NavLink>

          <NavMenu label="Labs" id="labs-menu" prefix="/labs">
            {DOMAINS.map((d) => {
              const labs = LABS.filter((l) => l.domain === d.id);
              if (!labs.length) return null;
              return (
                <div key={d.id}>
                  <DomainHeading glyph={d.glyph} name={d.name} text={d.text} />
                  <ul>
                    {labs.map((l) => (
                      <li key={l.id}>
                        <MenuRow badge={String(l.number)} title={l.title} meta={l.status === "live" ? `${l.steps.length} steps` : "Planned"} to={l.status === "live" ? `/labs/${l.id}` : undefined} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <Link to="/labs" className="mt-1 block rounded-xl border-t border-line px-3 pt-2.5 pb-1.5 text-sm font-semibold text-brand hover:underline">Browse all labs →</Link>
          </NavMenu>

          <NavMenu label="Tools" id="tools-menu" prefix="/playground">
            {DOMAINS.map((d) => {
              const tools = TOOLS.filter((t) => t.domain === d.id);
              if (!tools.length) return null;
              return (
                <div key={d.id}>
                  <DomainHeading glyph={d.glyph} name={d.name} text={d.text} />
                  <ul>
                    {tools.map((t) => (
                      <li key={t.id}><MenuRow badge={d.short} title={t.title} meta={t.needsBackend ? "Needs the backend" : "Runs in the browser"} to={t.path} /></li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <Link to="/tools" className="mt-1 block rounded-xl border-t border-line px-3 pt-2.5 pb-1.5 text-sm font-semibold text-brand hover:underline">Browse all tools →</Link>
          </NavMenu>

          <NavMenu label="Cheatsheets" id="sheets-menu" prefix="/cheatsheets">
            {DOMAINS.map((d) => {
              const sheets = SHEETS.filter((s) => s.domain === d.id);
              if (!sheets.length) return null;
              return (
                <div key={d.id}>
                  <DomainHeading glyph={d.glyph} name={d.name} text={d.text} />
                  <ul>
                    {sheets.map((s) => (
                      <li key={s.id}>
                        <MenuRow badge={d.short} title={s.title} meta={s.status === "live" ? `${s.sections.length} sections` : "Planned"} to={s.status === "live" ? `/cheatsheets/${s.id}` : undefined} />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
            <Link to="/cheatsheets" className="mt-1 block rounded-xl border-t border-line px-3 pt-2.5 pb-1.5 text-sm font-semibold text-brand hover:underline">Browse all cheatsheets →</Link>
          </NavMenu>

          <button
            onClick={toggle}
            className="btn-ghost ml-2 !px-2.5"
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Light theme" : "Dark theme"}
          >
            <span aria-hidden>{dark ? "☀" : "☾"}</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
