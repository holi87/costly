import { create } from "zustand";
import api from "../api/client";
import type { Category, ExpensesResponse, Stats } from "../api/client";

interface ExpensesState {
  expenses: ExpensesResponse | null;
  categories: Category[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  fetchExpenses: (params?: Record<string, string>) => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchStats: (params?: Record<string, string>) => Promise<void>;
}

export const useExpensesStore = create<ExpensesState>((set) => ({
  expenses: null,
  categories: [],
  stats: null,
  loading: false,
  error: null,

  fetchExpenses: async (params) => {
    set({ loading: true, error: null });
    try {
      const searchParams = new URLSearchParams(params);
      const data = await api.get("api/expenses", { searchParams }).json<ExpensesResponse>();
      set({ expenses: data, loading: false });
    } catch {
      set({ error: "Nie udało się pobrać wydatków", loading: false });
    }
  },

  fetchCategories: async () => {
    try {
      const data = await api.get("api/categories").json<Category[]>();
      set({ categories: data });
    } catch {
      set({ error: "Nie udało się pobrać kategorii" });
    }
  },

  fetchStats: async (params) => {
    try {
      const searchParams = params ? new URLSearchParams(params) : undefined;
      const data = await api.get("api/expenses/stats", { searchParams }).json<Stats>();
      set({ stats: data });
    } catch {
      set({ error: "Nie udało się pobrać statystyk" });
    }
  },
}));
