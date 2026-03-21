import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatCurrency } from "../../lib/format";

interface MonthData {
  month: string;
  total: string;
  count: number;
}

export function MonthlyChart({ data }: { data: MonthData[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    month: d.month.slice(5),
    total: parseFloat(d.total),
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
        Wydatki miesięczne
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={60} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Kwota"]}
            contentStyle={{
              backgroundColor: "var(--color-slate-800, #1e293b)",
              border: "none",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
