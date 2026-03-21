import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppShell() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <main className="pb-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)]">
        <div key={location.pathname} className="animate-page-in">
          <Outlet />
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
