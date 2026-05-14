import { Outlet, useLocation } from "react-router-dom";
import { Navbar } from "./Navbar.jsx";

export function MainLayout() {
  const location = useLocation();
  const path = location.pathname;
  const isHome = path === "/";
  const isExperimentsFlow =
    path === "/experiments" || /^\/experiments\/[^/]+$/.test(path);
  const fullViewport = isHome || isExperimentsFlow;
  const isAbout = path === "/about";
  const hideNavbar =
    path === "/experiments/electric-field" || path === "/experiments/buoyancy";

  return (
    <div
      className={
        fullViewport || isAbout
          ? "flex h-[100dvh] flex-col overflow-hidden"
          : "flex min-h-[100dvh] flex-col"
      }
    >
      {hideNavbar ? null : <Navbar />}
      <main
        className={
          fullViewport || isAbout
            ? "flex min-h-0 flex-1 flex-col overflow-hidden"
            : "flex flex-1 flex-col"
        }
      >
        <Outlet />
      </main>
    </div>
  );
}
