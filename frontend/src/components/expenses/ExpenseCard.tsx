import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Expense } from "../../api/client";
import { formatCurrency, formatDate } from "../../lib/format";
import { Pencil, Trash2, Clock } from "lucide-react";
import api from "../../api/client";

interface ExpenseCardProps {
  expense: Expense;
  onDeleted: () => void;
}

export function ExpenseCard({ expense, onDeleted }: ExpenseCardProps) {
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`api/expenses/${expense.id}`);
      onDeleted();
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 transition-colors">
      <button
        onClick={() => navigate(`/expenses/${expense.id}/edit`)}
        className="flex-1 flex items-center gap-3 text-left min-w-0"
        aria-label={`Edytuj ${expense.name}`}
      >
        <span
          className="w-10 h-10 rounded-full flex items-center justify-center text-base shrink-0"
          style={{
            backgroundColor: (expense.category.color ?? "#6b7280") + "20",
          }}
        >
          {expense.category.icon ?? "💰"}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
            {expense.name}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {expense.category.name} · {formatDate(expense.date)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <span className={`text-sm font-semibold whitespace-nowrap ${
            expense.isPaid
              ? "text-slate-800 dark:text-slate-100"
              : "text-amber-600 dark:text-amber-400"
          }`}>
            {formatCurrency(expense.amount)}
          </span>
          {!expense.isPaid && (
            <div className="flex items-center justify-end gap-0.5 mt-0.5">
              <Clock size={10} className="text-amber-500" />
              <span className="text-[10px] text-amber-500 font-medium">planowane</span>
            </div>
          )}
        </div>
      </button>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => navigate(`/expenses/${expense.id}/edit`)}
          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          aria-label={`Edytuj ${expense.name}`}
        >
          <Pencil size={16} />
        </button>

        {confirmDelete ? (
          <div className="flex gap-1">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2 py-1 rounded-lg bg-red-600 text-white text-xs font-medium disabled:opacity-50"
              aria-label="Potwierdź usunięcie"
            >
              Tak
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-600 text-xs"
              aria-label="Anuluj usunięcie"
            >
              Nie
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            aria-label={`Usuń ${expense.name}`}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
