import { useState, useRef, useEffect } from "react";
import { DayPicker } from "react-day-picker";
import { pl } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { Calendar } from "lucide-react";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  error?: string;
}

function toDate(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function toStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function DatePickerInput({ value, onChange, error }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ? toDate(value) : undefined;
  const display = value
    ? value.split("-").reverse().join(".")
    : "Wybierz datę";

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        Data
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border ${
          error
            ? "border-red-400 dark:border-red-500"
            : "border-slate-300 dark:border-slate-600"
        } bg-white dark:bg-slate-800 text-left transition-colors`}
      >
        <Calendar size={18} className="text-slate-400" />
        <span
          className={
            value
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-400"
          }
        >
          {display}
        </span>
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {open && (
        <div className="absolute z-50 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-2">
          <DayPicker
            mode="single"
            selected={selected}
            onSelect={(d) => {
              if (d) {
                onChange(toStr(d));
                setOpen(false);
              }
            }}
            locale={pl}
            defaultMonth={selected}
          />
        </div>
      )}
    </div>
  );
}
