import { useEffect, useState, useCallback } from "react";
import { useExpensesStore } from "../../store/expenses";
import { ExpenseCard } from "./ExpenseCard";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

const PAGE_SIZES = [10, 25, 50] as const;

export function ExpenseList() {
  const { expenses, categories, loading, fetchExpenses, fetchCategories } =
    useExpensesStore();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(25);

  useEffect(() => {
    if (categories.length === 0) fetchCategories();
  }, [categories.length, fetchCategories]);

  const loadExpenses = useCallback(() => {
    const params: Record<string, string> = {
      page: String(page),
      limit: String(pageSize),
      sort: "date",
      order: "desc",
    };
    if (search) params.search = search;
    if (categoryFilter) params.category = categoryFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    fetchExpenses(params);
  }, [search, categoryFilter, dateFrom, dateTo, page, pageSize, fetchExpenses]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const handleDeleted = () => {
    loadExpenses();
  };

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
          aria-label="Szukaj wydatków"
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
            aria-label="Filtruj po kategorii"
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
              aria-label="Data od"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              aria-label="Data do"
              className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm outline-none"
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
              <ExpenseCard key={e.id} expense={e} onDeleted={handleDeleted} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-400">Pokaż:</span>
              {PAGE_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setPageSize(size);
                    setPage(1);
                  }}
                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                    pageSize === size
                      ? "bg-blue-600 text-white"
                      : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-2.5 py-1 rounded text-xs border border-slate-300 dark:border-slate-600 disabled:opacity-30 transition-colors"
                >
                  &larr;
                </button>
                <span className="text-xs text-slate-500 min-w-[4ch] text-center">
                  {page}/{pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.totalPages}
                  className="px-2.5 py-1 rounded text-xs border border-slate-300 dark:border-slate-600 disabled:opacity-30 transition-colors"
                >
                  &rarr;
                </button>
              </div>
            )}
          </div>

          {pagination && (
            <p className="text-xs text-slate-400 text-center">
              {pagination.total} {pagination.total === 1 ? "wydatek" : pagination.total < 5 ? "wydatki" : "wydatków"}
            </p>
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
