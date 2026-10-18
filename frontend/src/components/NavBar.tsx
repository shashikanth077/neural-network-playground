import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useThemeToggle } from "../hooks/useTheme";
import { LABS } from "../labs/registry";

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

function LabsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();
  const active = pathname.startsWith("/labs");

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
    <div ref={ref} className="relative">
      <button
        aria-expanded={open}
        aria-controls="labs-menu"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${active || open ? "bg-raised text-ink" : "text-muted hover:text-ink"}`}
      >
        Labs <span aria-hidden className="text-[10px]">▾</span>
      </button>
      {open && (
        <div id="labs-menu" className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 shadow-card sm:left-0 sm:right-auto">
          <ul>
            {LABS.map((l) => {
              const live = l.status === "live";
              const inner = (
                <>
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand/10 font-mono text-sm font-bold text-brand">{l.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{l.title}</span>
                    <span className="block text-xs text-muted">{live ? `${l.steps.length} steps` : "Planned"}</span>
                  </span>
                </>
              );
              return (
                <li key={l.id}>
                  {live ? (
                    <Link to={`/labs/${l.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-raised">{inner}</Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-xl p-2 opacity-60" aria-disabled="true">{inner}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <Link to="/labs" className="mt-1 block rounded-xl border-t border-line px-3 pt-2.5 pb-1.5 text-sm font-semibold text-brand hover:underline">Browse all labs →</Link>
        </div>
      )}
    </div>
  );
}

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
          <LabsMenu />
          <NavLink to="/playground" className={linkCls}>Playground</NavLink>
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
