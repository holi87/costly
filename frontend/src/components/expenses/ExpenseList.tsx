import { useEffect, useState } from "react";
import { useExpensesStore } from "../../store/expenses";
import { ExpenseCard } from "./ExpenseCard";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

export function ExpenseList() {
  const { expenses, categories, loading, fetchExpenses, fetchCategories } =
    useExpensesStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [categories.length, fetchCategories]);

  useEffect(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: "50",
      sort: "date",
      order: "desc",
    };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    fetchExpenses(params);
  }, [search, categoryFilter, dateFrom, dateTo, page, fetchExpenses]);

  const pagination = expenses?.pagination;

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Szukaj wydatków..."
          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
        />
      </div>

      {/* Filters toggle */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
      >
        Filtry
        {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {showFilters && (
        <div className="space-y-2 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none"
          >
            <option value="">Wszystkie kategorie</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? ""} {c.name}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none"
              placeholder="Od"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none"
              placeholder="Do"
            />
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : expenses && expenses.data.length > 0 ? (
        <>
          <div className="space-y-2">
            {expenses.data.map((e) => (
              <ExpenseCard key={e.id} expense={e} />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-30 transition-colors"
              >
                Poprzednia
              </button>
              <span className="px-4 py-2 text-sm text-slate-500">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm disabled:opacity-30 transition-colors"
              >
                Następna
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-slate-500 dark:text-slate-400">Brak wydatków</p>
        </div>
      )}
    </div>
  );
}
