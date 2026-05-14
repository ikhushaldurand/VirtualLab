import { NavLink, Link, useNavigate } from "react-router-dom";
import { AtomLogo } from "../brand/AtomLogo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const navLinkClass = ({ isActive }) =>
  [
    "relative whitespace-nowrap pb-1 text-[clamp(10px,2.2vw,14px)] transition-colors",
    isActive
      ? "font-semibold text-lab-blue after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-lab-blue"
      : "font-medium text-slate-700 hover:text-slate-900",
  ].join(" ");

export function Navbar() {
  const navigate = useNavigate();
  const { user, ready, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="shrink-0 border-b border-slate-100 bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6">
        <Link
          to="/"
          className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3"
        >
          <AtomLogo className="h-8 w-8 shrink-0 sm:h-10 sm:w-10" />
          <div className="min-w-0 leading-tight">
            <div className="truncate text-xs font-extrabold tracking-wide text-lab-blue sm:text-base">
              VIRTUAL-LAB
            </div>
            <div className="truncate text-[10px] font-medium text-slate-400 sm:text-xs">
              Physics Sandbox
            </div>
          </div>
        </Link>

        <nav
          className="flex min-w-0 flex-1 justify-center gap-[clamp(6px,1.8vw,40px)] px-1"
          aria-label="Primary"
        >
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/experiments" className={navLinkClass}>
            Browse Experiments
          </NavLink>
          <NavLink to="/library" end className={navLinkClass}>
            My Experiments
          </NavLink>
          <NavLink to="/about" className={navLinkClass}>
            About
          </NavLink>
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {!ready ? (
            <div
              className="h-8 w-28 shrink-0 animate-pulse rounded-md bg-slate-100 sm:w-36"
              aria-hidden
            />
          ) : isAuthenticated ? (
            <>
              <span
                className="max-w-[5rem] truncate text-xs font-semibold text-slate-700 sm:max-w-[10rem] sm:text-sm"
                title={user?.username}
              >
                {user?.username}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-md border border-brand-red bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-red transition hover:bg-red-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/signin"
                className="rounded-md bg-brand-blue px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-brand-blue-dark sm:px-4 sm:py-2 sm:text-sm"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="rounded-md border border-brand-red bg-white px-2.5 py-1.5 text-[11px] font-semibold text-brand-red transition hover:bg-red-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
