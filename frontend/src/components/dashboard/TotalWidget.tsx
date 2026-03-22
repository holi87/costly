import { formatCurrency } from "../../lib/format";
import { CheckCircle2, Clock, Heart } from "lucide-react";

interface TotalWidgetProps {
  total: string;
  count: number;
  totalPaid: string;
  countPaid: number;
  totalPlanned: string;
  countPlanned: number;
  totalSupport: string;
}

export function TotalWidget({
  total,
  count,
  totalPaid,
  countPaid,
  totalPlanned,
  countPlanned,
  totalSupport,
}: TotalWidgetProps) {
  const supportNum = parseFloat(totalSupport);

  return (
    <div className="space-y-3">
      {/* Grand total */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-5 text-white shadow-lg">
        <p className="text-blue-100 text-sm font-medium">Suma całkowita</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">
          {formatCurrency(total)}
        </p>
        <p className="text-blue-200 text-sm mt-1">
          {count} {count === 1 ? "wydatek" : count < 5 ? "wydatki" : "wydatków"}
        </p>
      </div>

      {/* Paid + Planned row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Paid */}
        <div className="rounded-xl p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
              Zapłacone
            </p>
          </div>
          <p className="text-lg font-bold text-emerald-800 dark:text-emerald-200">
            {formatCurrency(totalPaid)}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
            {countPaid} {countPaid === 1 ? "pozycja" : countPaid < 5 ? "pozycje" : "pozycji"}
          </p>
        </div>

        {/* Planned */}
        <div className="rounded-xl p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock size={14} className="text-amber-600 dark:text-amber-400" />
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Planowane
            </p>
          </div>
          <p className="text-lg font-bold text-amber-800 dark:text-amber-200">
            {formatCurrency(totalPlanned)}
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
            {countPlanned} {countPlanned === 1 ? "pozycja" : countPlanned < 5 ? "pozycje" : "pozycji"}
          </p>
        </div>
      </div>

      {/* Support */}
      {supportNum > 0 && (
        <div className="rounded-xl p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-1.5 mb-1">
            <Heart size={14} className="text-purple-600 dark:text-purple-400" />
            <p className="text-xs font-medium text-purple-700 dark:text-purple-400">
              Wsparcie
            </p>
          </div>
          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
            {formatCurrency(totalSupport)}
          </p>
        </div>
      )}
    </div>
  );
}
