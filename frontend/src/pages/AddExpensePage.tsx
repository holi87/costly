import { Header } from "../components/layout/Header";
import { ExpenseForm } from "../components/expenses/ExpenseForm";

export function AddExpensePage() {
  return (
    <>
      <Header title="Dodaj wydatek" />
      <div className="px-4 py-4 max-w-lg mx-auto">
        <ExpenseForm />
      </div>
    </>
  );
}
