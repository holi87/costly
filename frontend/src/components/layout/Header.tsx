import { useNavigate, useLocation } from "react-router-dom";
import { Sun, Moon, Monitor, ArrowLeft } from "lucide-react";
import { useUIStore } from "../../store/ui";

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const showBack = location.pathname.includes("/edit");

  const cycleTheme = () => {
    const next =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Wróć"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            {title}
          </h1>
        </div>
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label={`Zmień motyw (aktualny: ${theme === "light" ? "jasny" : theme === "dark" ? "ciemny" : "systemowy"})`}
        >
          {theme === "light" && <Sun size={20} />}
          {theme === "dark" && <Moon size={20} />}
          {theme === "system" && <Monitor size={20} />}
        </button>
      </div>
    </header>
  );
}
