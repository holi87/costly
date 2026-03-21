import { Header } from "../components/layout/Header";

export function ExpensesPage() {
  return (
    <>
      <Header title="Lista wydatków" />
      <div className="px-4 py-4 max-w-lg mx-auto">
        <p className="text-slate-500 dark:text-slate-400 text-center py-20">
          Lista wydatków — wkrótce
        </p>
      </div>
    </>
  );
}
