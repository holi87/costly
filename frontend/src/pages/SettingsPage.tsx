import { useState, useRef } from "react";
import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { Header } from "../components/layout/Header";
import { useUIStore } from "../store/ui";
import {
  Sun,
  Moon,
  Monitor,
  Upload,
  Download,
  Loader2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import api from "../api/client";

const APP_VERSION = "1.3.0";

const CHANGELOG = [
  {
    version: "1.3.0",
    date: "2026-06-06",
    changes: [
      "✨ Pełny eksport i import danych w JSON (kopia zapasowa)",
      '✨ Import: tryb „Zastąp wszystko“ lub „Scal“',
      "🗑️ Usunięto import/eksport Excel (zastąpiony przez JSON)",
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-22",
    changes: [
      "✨ Wiele kategorii na wydatek (multiselect)",
      "✨ Pole \"Wsparcie\" — kwota od teściowej, osobna suma",
      "✨ Export Excel: kolumny Wsparcie i Status",
    ],
  },
  {
    version: "1.1.1",
    date: "2026-03-22",
    changes: [
      "🐛 Fix edycji wydatków (błędne URL-e API)",
      "🐛 Fix filtra kategorii (tablica vs string)",
      "🐛 Fix schematu Zod dla update",
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-22",
    changes: [
      "✨ Wydatki planowane (zapłacone/planowane)",
      "✨ Multiselect kategorii w filtrach",
      "✨ Ikona PWA i favicon (domek z \"zł\")",
    ],
  },
];

// ---- Types ----------------------------------------------------------------

interface BackupEnvelope {
  version: number;
  app: string;
  appVersion?: string;
  exportedAt: string;
  categories: Array<{
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
    createdAt: string;
  }>;
  expenses: Array<{
    id: number;
    name: string;
    amount: string;
    supportAmount: string | null;
    date: string;
    notes: string | null;
    goal: string | null;
    isPaid: boolean;
    createdAt: string;
    updatedAt: string;
    categoryIds: number[];
  }>;
}

interface ImportResult {
  imported: number;
  categoriesImported: number;
  skipped: number;
  errors: string[];
}

type ImportMode = "replace" | "merge";

function isBackupEnvelope(obj: unknown): obj is BackupEnvelope {
  if (typeof obj !== "object" || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.version === "number" &&
    Array.isArray(o.categories) &&
    Array.isArray(o.expenses)
  );
}

// ---- Mode-selection dialog ------------------------------------------------

interface ImportModeDialogProps {
  open: boolean;
  importing: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
}

function ImportModeDialog({
  open,
  importing,
  onClose,
  onConfirm,
}: ImportModeDialogProps) {
  const [confirmingReplace, setConfirmingReplace] = useState(false);

  function handleClose() {
    setConfirmingReplace(false);
    onClose();
  }

  function handleMerge() {
    onConfirm("merge");
  }

  function handleReplaceRequest() {
    setConfirmingReplace(true);
  }

  function handleReplaceConfirm() {
    onConfirm("replace");
  }

  function handleReplaceDeny() {
    setConfirmingReplace(false);
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      className="relative z-50"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70"
        aria-hidden="true"
      />

      {/* Panel container */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-4 sm:p-6">
        <DialogPanel className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-xl">
          <DialogTitle className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
            Wybierz tryb importu
          </DialogTitle>

          {!confirmingReplace ? (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Jak chcesz połączyć dane z pliku z bieżącą bazą?
              </p>

              <div className="space-y-3 mb-5">
                {/* Merge option */}
                <button
                  onClick={handleMerge}
                  disabled={importing}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors disabled:opacity-50 group"
                >
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    Scal (dodaj)
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Dodaje wpisy z pliku do istniejących. Kategorie dopasowywane po nazwie. Może utworzyć duplikaty.
                  </span>
                </button>

                {/* Replace option */}
                <button
                  onClick={handleReplaceRequest}
                  disabled={importing}
                  className="w-full text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-600 hover:border-red-400 dark:hover:border-red-500 transition-colors disabled:opacity-50 group"
                >
                  <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-red-600 dark:group-hover:text-red-400">
                    Zastąp wszystko
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Czyści całą bazę (wydatki + kategorie) i przywraca stan z pliku. Operacja nieodwracalna.
                  </span>
                </button>
              </div>

              <button
                onClick={handleClose}
                disabled={importing}
                className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Anuluj
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                <AlertTriangle
                  size={18}
                  className="flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400"
                  aria-hidden="true"
                />
                <p className="text-sm text-red-700 dark:text-red-400">
                  Czy na pewno? Wszystkie obecne wydatki i kategorie zostaną trwale usunięte i zastąpione danymi z pliku. Tej operacji nie można cofnąć.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleReplaceConfirm}
                  disabled={importing}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition-colors disabled:opacity-50"
                >
                  {importing ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : null}
                  Tak, zastąp wszystko
                </button>
                <button
                  onClick={handleReplaceDeny}
                  disabled={importing}
                  className="w-full py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                >
                  Wróć
                </button>
              </div>
            </>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ---- Main page ------------------------------------------------------------

export function SettingsPage() {
  const { theme, setTheme } = useUIStore();

  // Export state
  const [exporting, setExporting] = useState(false);

  // Import state
  const [importing, setImporting] = useState(false);
  const [parsedPayload, setParsedPayload] = useState<BackupEnvelope | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // -- Export ----------------------------------------------------------------

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const blob = await api.get("api/export/json").blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `koszty-budowy-backup-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Nie udało się wyeksportować danych");
    } finally {
      setExporting(false);
    }
  };

  // -- Import: file pick & parse --------------------------------------------

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input immediately so the same file can be re-picked later
    if (fileRef.current) fileRef.current.value = "";

    setError(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = JSON.parse(ev.target?.result as string);
        if (!isBackupEnvelope(raw)) {
          setError("Nieprawidłowy plik kopii zapasowej (brakuje pól version, categories lub expenses).");
          return;
        }
        setParsedPayload(raw);
      } catch {
        setError("Nie udało się odczytać pliku — upewnij się, że to poprawny plik JSON.");
      }
    };
    reader.onerror = () => {
      setError("Nie udało się wczytać pliku.");
    };
    reader.readAsText(file);
  };

  // -- Import: dialog close / confirm ---------------------------------------

  const handleDialogClose = () => {
    if (importing) return; // block close during in-flight request
    setParsedPayload(null);
  };

  const handleImportConfirm = async (mode: ImportMode) => {
    if (!parsedPayload) return;

    setImporting(true);
    setError(null);
    try {
      const result = await api
        .post("api/import/json", {
          json: { mode, payload: parsedPayload },
        })
        .json<ImportResult>();
      setImportResult(result);
      setParsedPayload(null);
    } catch (err) {
      // Surface the backend's specific reason (e.g. wrong backup version,
      // malformed envelope) — for a restore feature that's exactly what the
      // user needs to see. ky throws HTTPError carrying the JSON body.
      let msg = "Nie udało się zaimportować danych. Spróbuj ponownie.";
      const res = (err as { response?: Response })?.response;
      if (res) {
        try {
          const body = (await res.json()) as { error?: string };
          if (body?.error) msg = `Import odrzucony: ${body.error}`;
        } catch {
          /* keep generic message */
        }
      }
      setError(msg);
      setParsedPayload(null);
    } finally {
      setImporting(false);
    }
  };

  // -- Theme choices --------------------------------------------------------

  const themes = [
    { value: "light" as const, icon: Sun, label: "Jasny" },
    { value: "dark" as const, icon: Moon, label: "Ciemny" },
    { value: "system" as const, icon: Monitor, label: "System" },
  ];

  // -- Render ---------------------------------------------------------------

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

        {/* Data: Import / Export */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            Dane
          </h2>
          <div className="space-y-3">
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFilePick}
              className="hidden"
              id="import-json-file"
              aria-label="Wybierz plik JSON do importu"
            />

            {/* Import button */}
            <label
              htmlFor="import-json-file"
              className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                importing ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              {importing ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              Import z JSON (przywróć kopię)
            </label>

            {/* Export button */}
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
              Eksport JSON (kopia zapasowa)
            </button>
          </div>

          {/* Import success result */}
          {importResult && (
            <div className="mt-3 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} />
                Zaimportowano: {importResult.imported} wydatków,{" "}
                {importResult.categoriesImported} kategorii, pominięto:{" "}
                {importResult.skipped}
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

          {/* Error */}
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
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Aplikacja:
              </span>{" "}
              Koszty Budowy
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Wersja:
              </span>{" "}
              {APP_VERSION}
            </p>
            <p>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Użytkownicy:
              </span>{" "}
              Grzesiek & Julia
            </p>
          </div>
        </section>

        {/* Changelog */}
        <section>
          <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
            Ostatnie zmiany
          </h2>
          <div className="space-y-3">
            {CHANGELOG.map((entry, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    v{entry.version}
                  </span>
                  <span className="text-[10px] text-slate-400">{entry.date}</span>
                </div>
                <ul className="space-y-1">
                  {entry.changes.map((c, j) => (
                    <li key={j} className="text-xs text-slate-500 dark:text-slate-400">
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Import mode dialog */}
      <ImportModeDialog
        open={parsedPayload !== null}
        importing={importing}
        onClose={handleDialogClose}
        onConfirm={handleImportConfirm}
      />
    </>
  );
}
