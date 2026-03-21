import { useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../../api/client";
import type { Category } from "../../api/client";

interface CategoryFormProps {
  category?: Category;
  onSaved: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSaved, onCancel }: CategoryFormProps) {
  const isEdit = !!category;
  const [name, setName] = useState(category?.name ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [color, setColor] = useState(category?.color ?? "#6366f1");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nazwa jest wymagana";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        icon: icon.trim() || undefined,
        color: color || undefined,
      };
      if (isEdit) {
        await api.put(`api/categories/${category.id}`, { json: body });
      } else {
        await api.post("api/categories", { json: body });
      }
      onSaved();
    } catch {
      setErrors({ form: "Nie udało się zapisać kategorii" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        {isEdit ? "Edytuj kategorię" : "Nowa kategoria"}
      </h3>

      {errors.form && (
        <p className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{errors.form}</p>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nazwa
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Formalności"
          aria-invalid={!!errors.name}
          className={`w-full px-3 py-2.5 rounded-xl border ${
            errors.name ? "border-red-400" : "border-slate-300 dark:border-slate-600"
          } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Ikona (emoji)
          </label>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="🏗️"
            maxLength={10}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Kolor
          </label>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-[42px] rounded-xl border border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {isEdit ? "Zapisz" : "Dodaj"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          Anuluj
        </button>
      </div>
    </form>
  );
}
