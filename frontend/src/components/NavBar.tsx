import { Link, NavLink } from "react-router-dom";
import { useThemeToggle } from "../hooks/useTheme";

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
  `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
    isActive ? "bg-raised text-ink" : "text-muted hover:text-ink"
  }`;

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
