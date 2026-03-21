import { useState } from "react";
import type { Category } from "../../api/client";
import api from "../../api/client";
import { Pencil, Trash2 } from "lucide-react";

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDeleted: () => void;
}

export function CategoryList({ categories, onEdit, onDeleted }: CategoryListProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: number) => {
    if (deleting === id) {
      // Confirmed
      try {
        await api.delete(`api/categories/${id}`);
        setDeleting(null);
        onDeleted();
      } catch (err) {
        const body = await (err as Response & { response?: { json: () => Promise<{ error: string }> } })?.response?.json?.().catch(() => null);
        setError(body?.error ?? "Nie udało się usunąć kategorii");
        setDeleting(null);
      }
    } else {
      setDeleting(id);
      setError(null);
    }
  };

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">📁</p>
        <p className="text-slate-500 dark:text-slate-400">Brak kategorii</p>
        <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
          Dodaj pierwszą kategorię, aby móc tworzyć wydatki
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" role="list" aria-label="Lista kategorii">
      {error && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}
      {categories.map((cat) => (
        <div
          key={cat.id}
          role="listitem"
          className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
        >
          <span
            className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: (cat.color ?? "#6b7280") + "20" }}
          >
            {cat.icon ?? "📁"}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
              {cat.name}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {cat._count.expenses}{" "}
              {cat._count.expenses === 1
                ? "wydatek"
                : cat._count.expenses < 5
                  ? "wydatki"
                  : "wydatków"}
            </p>
          </div>
          <div
            className="w-4 h-4 rounded-full shrink-0"
            style={{ backgroundColor: cat.color ?? "#6b7280" }}
            aria-label={`Kolor: ${cat.color}`}
          />
          <button
            onClick={() => onEdit(cat)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            aria-label={`Edytuj ${cat.name}`}
          >
            <Pencil size={16} />
          </button>
          {deleting === cat.id ? (
            <div className="flex gap-1">
              <button
                onClick={() => handleDelete(cat.id)}
                className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium"
                aria-label="Potwierdź usunięcie"
              >
                Tak
              </button>
              <button
                onClick={() => setDeleting(null)}
                className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
                aria-label="Anuluj usunięcie"
              >
                Nie
              </button>
            </div>
          ) : (
            <button
              onClick={() => handleDelete(cat.id)}
              className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              aria-label={`Usuń ${cat.name}`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
