import type { Expense } from "../../api/client";
import { formatCurrency, formatDate } from "../../lib/format";

export function RecentExpenses({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
        Ostatnie wydatki
      </h3>
      <div className="space-y-3">
        {expenses.map((e) => (
          <div key={e.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: (e.category.color ?? "#6b7280") + "20" }}
              >
                {e.category.icon ?? "💰"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-slate-400">{formatDate(e.date)}</p>
              </div>
            </div>
            <span className="text-sm font-semibold whitespace-nowrap ml-2">
              {formatCurrency(e.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
