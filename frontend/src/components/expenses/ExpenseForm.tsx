import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CurrencyInput } from "../ui/CurrencyInput";
import { DatePickerInput } from "../ui/DatePicker";
import { useExpensesStore } from "../../store/expenses";
import api from "../../api/client";
import type { Expense } from "../../api/client";
import { Loader2, Trash2, CheckCircle2, Clock, X, Heart } from "lucide-react";

interface ExpenseFormProps {
  expense?: Expense;
}

function today(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ExpenseForm({ expense }: ExpenseFormProps) {
  const navigate = useNavigate();
  const { categories, fetchCategories } = useExpensesStore();
  const isEdit = !!expense;

  const [name, setName] = useState(expense?.name ?? "");
  const [amount, setAmount] = useState(expense?.amount ?? "");
  const [supportAmount, setSupportAmount] = useState(expense?.supportAmount ?? "");
  const [date, setDate] = useState(expense?.date ?? today());
  const [categoryIds, setCategoryIds] = useState<number[]>(
    expense?.categories?.map((c) => c.id) ?? [],
  );
  const [goal, setGoal] = useState(expense?.goal ?? "");
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [isPaid, setIsPaid] = useState(expense?.isPaid ?? true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [categories.length, fetchCategories]);

  const toggleCategory = (id: number) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Nazwa jest wymagana";
    if (!amount || parseFloat(amount) <= 0) e.amount = "Kwota musi być większa od 0";
    if (!/^\d+(\.\d{1,2})?$/.test(amount)) e.amount = "Nieprawidłowy format kwoty";
    if (!date) e.date = "Data jest wymagana";
    if (categoryIds.length === 0) e.categoryIds = "Wybierz co najmniej jedną kategorię";
    if (supportAmount && !/^\d+(\.\d{1,2})?$/.test(supportAmount))
      e.supportAmount = "Nieprawidłowy format kwoty";
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
        amount: parseFloat(amount).toFixed(2),
        supportAmount: supportAmount ? parseFloat(supportAmount).toFixed(2) : null,
        date,
        categoryIds,
        goal: goal.trim() || null,
        notes: notes.trim() || null,
        isPaid,
      };

      if (isEdit) {
        await api.put(`api/expenses/${expense.id}`, { json: body });
      } else {
        await api.post("api/expenses", { json: body });
      }
      navigate("/expenses");
    } catch {
      setErrors({ form: "Nie udało się zapisać wydatku" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expense) return;
    setSubmitting(true);
    try {
      await api.delete(`api/expenses/${expense.id}`);
      navigate("/expenses");
    } catch {
      setErrors({ form: "Nie udało się usunąć wydatku" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
          {errors.form}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Nazwa
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="np. Notariusz"
          className={`w-full px-3 py-2.5 rounded-xl border ${
            errors.name
              ? "border-red-400 dark:border-red-500"
              : "border-slate-300 dark:border-slate-600"
          } bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors`}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      <CurrencyInput label="Kwota" value={amount} onChange={setAmount} error={errors.amount} />

      {/* Support amount */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          <span className="flex items-center gap-1.5">
            <Heart size={14} className="text-purple-500" />
            Wsparcie (opcjonalne)
          </span>
        </label>
        <CurrencyInput
          value={supportAmount}
          onChange={setSupportAmount}
          error={errors.supportAmount}
          placeholder="0,00"
        />
      </div>

      <DatePickerInput value={date} onChange={setDate} error={errors.date} />

      {/* Category multiselect chips */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Kategorie
        </label>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const isSelected = categoryIds.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? "text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
                style={
                  isSelected
                    ? { backgroundColor: c.color ?? "#3b82f6" }
                    : undefined
                }
              >
                {c.icon && <span>{c.icon}</span>}
                {c.name}
                {isSelected && <X size={12} />}
              </button>
            );
          })}
        </div>
        {errors.categoryIds && (
          <p className="mt-1 text-xs text-red-500">{errors.categoryIds}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Cel
        </label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          placeholder="Opcjonalnie"
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
          Uwagi
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opcjonalnie"
          rows={3}
          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none"
        />
      </div>

      {/* Paid / Planned toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Status
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setIsPaid(true)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
              isPaid
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
            }`}
          >
            <CheckCircle2 size={16} />
            Zapłacone
          </button>
          <button
            type="button"
            onClick={() => setIsPaid(false)}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors ${
              !isPaid
                ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                : "border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400"
            }`}
          >
            <Clock size={16} />
            Planowane
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium transition-colors flex items-center justify-center gap-2"
      >
        {submitting && <Loader2 size={18} className="animate-spin" />}
        {isEdit ? "Zapisz zmiany" : "Dodaj wydatek"}
      </button>

      {isEdit && (
        <>
          {showDeleteConfirm ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-medium transition-colors"
              >
                Potwierdź usunięcie
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                Anuluj
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-xl border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-medium transition-colors flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={18} />
              Usuń wydatek
            </button>
          )}
        </>
      )}
    </form>
  );
}
