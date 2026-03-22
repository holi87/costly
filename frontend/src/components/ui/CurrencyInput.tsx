import { useState } from "react";

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

export function CurrencyInput({
  value,
  onChange,
  error,
  label,
  placeholder = "0.00",
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    // Allow digits, comma, dot — normalize comma to dot
    const cleaned = raw.replace(",", ".");
    if (cleaned === "" || /^\d+\.?\d{0,2}$/.test(cleaned)) {
      onChange(cleaned);
    }
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          {label}
        </label>
      )}
      <div
        className={`flex items-center rounded-xl border ${
          error
            ? "border-red-400 dark:border-red-500"
            : focused
              ? "border-blue-500 ring-2 ring-blue-500/20"
              : "border-slate-300 dark:border-slate-600"
        } bg-white dark:bg-slate-800 transition-colors`}
      >
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 px-3 py-2.5 bg-transparent outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
        />
        <span className="pr-3 text-slate-400 dark:text-slate-500 text-sm font-medium">
          zł
        </span>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
