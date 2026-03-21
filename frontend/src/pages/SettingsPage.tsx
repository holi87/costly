import { useState, useRef } from "react";
import { Header } from "../components/layout/Header";
import { useUIStore } from "../store/ui";
import { Sun, Moon, Monitor, Upload, Download, Loader2, CheckCircle } from "lucide-react";
import api from "../api/client";

export function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setImportResult(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const result = await api.post("api/import/xlsx", { body: formData }).json<{
        imported: number;
        skipped: number;
        errors: string[];
      }>();
      setImportResult(result);
    } catch {
      setError("Nie udało się zaimportować pliku");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.get("api/export/xlsx").blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "koszty-budowy.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Nie udało się wyeksportować danych");
    } finally {
      setExporting(false);
    }
  };

  const themes = [
    { value: "light" as const, icon: Sun, label: "Jasny" },
    { value: "dark" as const, icon: Moon, label: "Ciemny" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  return (
    <>
      <Header title="Ustawienia" />
      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        {/* Theme */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            Motyw
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {themes.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors ${
                  theme === value
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-slate-300"
                }`}
                aria-pressed={theme === value}
                aria-label={`Motyw: ${label}`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Import/Export */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            Dane
          </h2>
          <div className="space-y-3">
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImport}
                className="hidden"
                id="import-file"
                aria-label="Wybierz plik Excel do importu"
              />
              <label
                htmlFor="import-file"
                className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  importing ? "opacity-50 pointer-events-none" : ""
                }`}
              >
                {importing ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                Import z Excel
              </label>
            </div>

            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {exporting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Download size={18} />
              )}
              Eksport do Excel
            </button>
          </div>

          {importResult && (
            <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                Zaimportowano: {importResult.imported}, pominięto: {importResult.skipped}
              </div>
              {importResult.errors.length > 0 && (
                <ul className="mt-2 text-xs space-y-1 text-red-600 dark:text-red-400">
                  {importResult.errors.slice(0, 5).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}
        </section>

        {/* App info */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            Informacje
          </h2>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Aplikacja:</span> Koszty Budowy</p>
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Wersja:</span> 1.0.0</p>
            <p><span className="font-medium text-slate-700 dark:text-slate-300">Użytkownicy:</span> Grzesiek & Julia</p>
          </div>
        </section>
      </div>
    </>
  );
}
