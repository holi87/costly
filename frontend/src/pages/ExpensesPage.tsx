import { Header } from "../components/layout/Header";
import { ExpenseList } from "../components/expenses/ExpenseList";

export function ExpensesPage() {
  return (
    <>
      <Header title="Lista wydatków" />
      <div className="px-4 py-4 max-w-lg mx-auto">
        <ExpenseList />
      </div>
    </>
  );
}
