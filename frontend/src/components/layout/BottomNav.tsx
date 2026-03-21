import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  List,
  PlusCircle,
  FolderOpen,
  Settings,
} from "lucide-react";

const tabs = [
  { to: "/", icon: LayoutDashboard, label: "Start" },
  { to: "/expenses", icon: List, label: "Lista" },
  { to: "/add", icon: PlusCircle, label: "Dodaj" },
  { to: "/admin", icon: FolderOpen, label: "Kategorie" },
  { to: "/settings", icon: Settings, label: "Więcej" },
] as const;

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)]"
      aria-label="Nawigacja główna"
    >
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-1 min-w-[48px] rounded-lg transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500 active:text-slate-600"
              }`
            }
            aria-label={label}
          >
            <Icon size={20} strokeWidth={isAddTab(to) ? 2.5 : 1.5} />
            <span className="text-[10px] font-medium leading-tight">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function isAddTab(to: string) {
  return to === "/add";
}
