import { useNavigate } from "react-router-dom";
import type { Expense } from "../../api/client";
import { formatCurrency, formatDate } from "../../lib/format";

export function ExpenseCard({ expense }: { expense: Expense }) {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(`/expenses/${expense.id}/edit`)}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors text-left"
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
      <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
        {formatCurrency(expense.amount)}
      </span>
    </button>
  );
}
