import { Sun, Moon, Monitor } from "lucide-react";
import { useUIStore } from "../../store/ui";

export function Header({ title }: { title: string }) {
  const { theme, setTheme } = useUIStore();

  const cycleTheme = () => {
    const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    setTheme(next);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          {title}
        </h1>
        <button
          onClick={cycleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Zmień motyw"
        >
          {theme === "light" && <Sun size={20} />}
          {theme === "dark" && <Moon size={20} />}
          {theme === "system" && <Monitor size={20} />}
        </button>
      </div>
    </header>
  );
}
