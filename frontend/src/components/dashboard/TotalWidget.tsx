import { formatCurrency } from "../../lib/format";

export function TotalWidget({ total, count }: { total: string; count: number }) {
  return (
    <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-6 text-white shadow-lg">
      <p className="text-blue-100 text-sm font-medium">Suma wydatków</p>
      <p className="text-3xl font-bold mt-1 tracking-tight">
        {formatCurrency(total)}
      </p>
      <p className="text-blue-200 text-sm mt-2">
        {count} {count === 1 ? "wydatek" : count < 5 ? "wydatki" : "wydatków"}
      </p>
    </div>
  );
}
