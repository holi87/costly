import ky from "ky";

const api = ky.create({
  prefixUrl: import.meta.env.VITE_API_URL || "",
  timeout: 15000,
});

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  color: string | null;
  createdAt: string;
  _count: { expenses: number };
}

export interface Expense {
  id: number;
  name: string;
  amount: string;
  date: string;
  notes: string | null;
  goal: string | null;
  categoryId: number;
  category: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ExpensesResponse {
  data: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Stats {
  total: string;
  count: number;
  byCategory: Array<{
    categoryId: number;
    categoryName: string;
    categoryIcon: string | null;
    categoryColor: string | null;
    total: string;
    count: number;
  }>;
  byMonth: Array<{
    month: string;
    total: string;
    count: number;
  }>;
}

export default api;
