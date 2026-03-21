import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "../../lib/format";

interface CategoryData {
  categoryName: string;
  categoryIcon: string | null;
  categoryColor: string | null;
  total: string;
  count: number;
}

const FALLBACK_COLORS = ["#6366f1", "#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#6b7280"];

export function CategoryChart({ data }: { data: CategoryData[] }) {
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    name: `${d.categoryIcon ?? ""} ${d.categoryName}`.trim(),
    value: parseFloat(d.total),
    color: d.categoryColor,
  }));

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">
        Wydatki wg kategorii
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Kwota"]}
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "none",
              borderRadius: "8px",
              color: "#f1f5f9",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 mt-2">
        {chartData.map((d, i) => (
          <span key={i} className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ backgroundColor: d.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
            />
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}
