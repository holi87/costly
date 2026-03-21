import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../components/layout/Header";
import { ExpenseForm } from "../components/expenses/ExpenseForm";
import api from "../api/client";
import type { Expense } from "../api/client";

export function EditExpensePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`api/expenses/${id}`)
      .json<Expense>()
      .then(setExpense)
      .catch(() => navigate("/expenses"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  return (
    <>
      <Header title="Edytuj wydatek" />
      <div className="px-4 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : expense ? (
          <ExpenseForm expense={expense} />
        ) : null}
      </div>
    </>
  );
}
