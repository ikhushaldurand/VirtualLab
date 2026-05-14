import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Menu, Pencil, UserPlus, Users } from "lucide-react";
import { AtomLogo } from "../brand/AtomLogo.jsx";

export function ElectricFieldTopBar() {
  const [title, setTitle] = useState("Electric Field");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (!menuOpen) return undefined;
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [menuOpen]);

  const share = useCallback(async () => {
    const url = window.location.href;
    try {
      await navigator.share?.({ title, url });
    } catch {
      /* user cancelled or unsupported */
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* ignore */
    }
  }, [title]);

  function commitTitle() {
    const next = draft.trim() || "Electric Field";
    setTitle(next);
    setDraft(next);
    setEditing(false);
  }

  return (
    <header className="shrink-0 border-b border-slate-200 bg-white px-2 py-2 shadow-sm sm:px-4">
      <div className="mx-auto flex max-w-[1600px] items-center gap-2">
        <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <Link to="/" className="flex shrink-0 items-center gap-1.5" aria-label="Home">
            <AtomLogo className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          </Link>
          <Link
            to="/"
            className="hidden text-xs font-extrabold tracking-wide text-lab-blue sm:inline sm:text-sm"
          >
            VIRTUAL-LAB
          </Link>
          <Link
            to="/room/new"
            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-lab-blue px-2 py-1 text-[10px] font-semibold text-lab-blue transition hover:bg-sky-50 sm:px-2.5 sm:text-xs"
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            <span className="truncate">Create Room</span>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 justify-center px-1">
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") {
                  setDraft(title);
                  setEditing(false);
                }
              }}
              className="max-w-[min(100%,14rem)] rounded-md border border-slate-200 px-2 py-1 text-center text-sm font-bold text-slate-900 focus:border-lab-blue focus:outline-none sm:max-w-xs sm:text-base"
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(title);
                setEditing(true);
              }}
              className="group inline-flex max-w-full items-center gap-1.5 rounded-md px-1 py-0.5 text-sm font-bold text-slate-900 transition hover:bg-slate-50 sm:text-base"
            >
              <span className="truncate">{title}</span>
              <Pencil
                className="h-3.5 w-3.5 shrink-0 text-slate-400 group-hover:text-lab-blue"
                aria-hidden
              />
            </button>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={share}
            className="inline-flex items-center gap-1 rounded-lg border border-lab-blue bg-white px-2 py-1.5 text-[10px] font-semibold text-lab-blue shadow-sm transition hover:bg-sky-50 sm:gap-1.5 sm:px-3 sm:text-xs"
          >
            <Users className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Share Room</span>
            <span className="sm:hidden">Share</span>
          </button>
          <Link
            to="/experiments"
            className="rounded-lg bg-lab-red px-2 py-1.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-lab-red-dark sm:px-3 sm:text-xs"
          >
            Leave Room
          </Link>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-expanded={menuOpen}
              aria-haspopup="true"
              onClick={() => setMenuOpen((o) => !o)}
              className="rounded-md p-2 text-slate-600 transition hover:bg-slate-100"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {menuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-slate-200 bg-white py-1 text-xs shadow-lg">
                <Link
                  to="/"
                  className="block px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/experiments"
                  className="block px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Browse Experiments
                </Link>
                <Link
                  to="/rooms"
                  className="block px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  Rooms
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
