import { useEffect } from "react";
import { Header } from "../components/layout/Header";
import { TotalWidget } from "../components/dashboard/TotalWidget";
import { MonthlyChart } from "../components/dashboard/MonthlyChart";
import { CategoryChart } from "../components/dashboard/CategoryChart";
import { RecentExpenses } from "../components/dashboard/RecentExpenses";
import { useExpensesStore } from "../store/expenses";
import { PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { stats, expenses, fetchStats, fetchExpenses, loading } =
    useExpensesStore();

  useEffect(() => {
    fetchStats();
    fetchExpenses({ limit: "5", sort: "date", order: "desc" });
  }, [fetchStats, fetchExpenses]);

  return (
    <>
      <Header title="Koszty Budowy" />
      <div className="px-4 py-4 space-y-4 max-w-lg mx-auto">
        {stats && stats.count > 0 ? (
          <>
            <TotalWidget total={stats.total} count={stats.count} />
            <MonthlyChart data={stats.byMonth} />
            <CategoryChart data={stats.byCategory} />
            {expenses && <RecentExpenses expenses={expenses.data} />}
          </>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🏗️</p>
            <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">
              Brak wydatków
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Dodaj pierwszy wydatek, aby zobaczyć statystyki
            </p>
            <Link
              to="/add"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              <PlusCircle size={20} />
              Dodaj wydatek
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
